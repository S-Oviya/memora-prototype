import {
  GameId,
  GameAttempt,
  CognitiveSkillId,
  CognitiveAnalytics,
  GAME_COGNITIVE_SKILL_MAP,
  GAME_SECONDARY_SKILLS_MAP,
} from '../types';

export interface AdaptiveProfile {
  recommendedLevels: Record<GameId, number>;
  recommendedGame: GameId;
  reasonEn: string;
  reasonAs: string;
  accuracyRate: number;
  cognitiveAnalytics: CognitiveAnalytics;
}

export const ALL_GAMES: GameId[] = [
  'photo-puzzle',
  'familiar-faces',
  'familiar-voices',
  'routine-recall',
  'odd-one-out',
  'shape-fit',
  'matching-family',
];

export const ALL_COGNITIVE_SKILLS: CognitiveSkillId[] = [
  'recall',
  'recognition',
  'associative_memory',
  'problem_solving',
  'categorization',
  'visual_spatial',
];

export class AdaptiveDifficultyEngine {
  // Evaluates performance and returns recommended level (1 to 5) for a given game
  static getRecommendedLevel(gameId: GameId, attempts: GameAttempt[]): number {
    const gameAttempts = attempts
      .filter((a) => a.gameId === gameId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (gameAttempts.length === 0) {
      return 1; // Start with gentlest level
    }

    const recent = gameAttempts.slice(0, 3);
    const lastAttempt = recent[0];

    // Check if patient struggled on recent attempt
    if (!lastAttempt.success || lastAttempt.mistakesCount >= 3 || lastAttempt.score < 50) {
      return Math.max(1, lastAttempt.level - 1);
    }

    // If last two attempts were very successful (score >= 80)
    const successfulAttempts = recent.filter((a) => a.success && a.score >= 80);
    if (successfulAttempts.length >= 2) {
      const highestLevel = Math.max(...successfulAttempts.map((a) => a.level));
      return Math.min(5, highestLevel + 1);
    }

    // Default to last attempt's level, clamped within 1 to 5
    return Math.min(5, Math.max(1, lastAttempt.level));
  }

  // Returns safe maximum level allowed for a game (for clamping AI recommendations)
  static getMaxSafeLevel(gameId: GameId, attempts: GameAttempt[]): number {
    const currentRec = this.getRecommendedLevel(gameId, attempts);
    // AI can recommend at most current safe level + 1, never exceeding 5
    return Math.min(5, currentRec + 1);
  }

  // Clamps an AI-suggested level within safe bounds
  static clampAiLevel(gameId: GameId, suggestedLevel: number, attempts: GameAttempt[]): number {
    const maxSafe = this.getMaxSafeLevel(gameId, attempts);
    return Math.min(maxSafe, Math.max(1, suggestedLevel));
  }

  // Suggests which game the patient should try next
  static getRecommendedNextGame(attempts: GameAttempt[]): GameId {
    if (attempts.length === 0) {
      return 'familiar-faces'; // Gentle greeting start
    }

    const recentSorted = [...attempts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const lastGame = recentSorted[0]?.gameId;

    // Find a game that hasn't been played in the last 2 sessions
    const recentGames = new Set(recentSorted.slice(0, 2).map((a) => a.gameId));
    const unplayedRecently = ALL_GAMES.filter((g) => !recentGames.has(g));

    if (unplayedRecently.length > 0) {
      return unplayedRecently[0];
    }

    // Rotate to next game
    const currentIndex = ALL_GAMES.indexOf(lastGame);
    return ALL_GAMES[(currentIndex + 1) % ALL_GAMES.length];
  }

  // Aggregates game performance into cognitive skill performance indicators
  // Uses recent weighting (most recent 3 attempts have 1.5x weight)
  static evaluateCognitiveSkills(attempts: GameAttempt[], patientId: string = 'patient-ramesh-1'): CognitiveAnalytics {
    const totalAttempts = attempts.length;
    const successfulAttempts = attempts.filter((a) => a.success).length;
    const successRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 100;

    // Default baseline scores if no attempts exist yet
    const baselineScores: Record<CognitiveSkillId, number> = {
      recognition: 88,
      recall: 82,
      problem_solving: 78,
      associative_memory: 75,
      categorization: 72,
      visual_spatial: 80,
    };

    const skillAttempts: Record<CognitiveSkillId, { score: number; timestamp: number }[]> = {
      recall: [],
      recognition: [],
      associative_memory: [],
      problem_solving: [],
      categorization: [],
      visual_spatial: [],
    };

    attempts.forEach((a) => {
      const primarySkill = a.cognitiveSkill || GAME_COGNITIVE_SKILL_MAP[a.gameId];
      if (primarySkill && skillAttempts[primarySkill]) {
        skillAttempts[primarySkill].push({
          score: a.score,
          timestamp: new Date(a.timestamp).getTime(),
        });
      }

      // Also contribute 50% weight to secondary skills
      const secondarySkills = GAME_SECONDARY_SKILLS_MAP[a.gameId] || [];
      secondarySkills.forEach((secSkill) => {
        if (secSkill !== primarySkill && skillAttempts[secSkill]) {
          skillAttempts[secSkill].push({
            score: Math.round(a.score * 0.9),
            timestamp: new Date(a.timestamp).getTime(),
          });
        }
      });
    });

    const cognitiveScores: Record<CognitiveSkillId, number> = { ...baselineScores };
    const recentTrends: CognitiveAnalytics['recentTrends'] = [];

    ALL_COGNITIVE_SKILLS.forEach((skill) => {
      const items = skillAttempts[skill];
      if (items.length > 0) {
        // Sort descending by timestamp
        items.sort((a, b) => b.timestamp - a.timestamp);
        let weightedSum = 0;
        let totalWeight = 0;

        items.forEach((item, index) => {
          // Weight: 2.0 for latest, 1.5 for 2nd, 1.2 for 3rd, 1.0 for older
          const weight = index === 0 ? 2.0 : index === 1 ? 1.5 : index === 2 ? 1.2 : 1.0;
          weightedSum += item.score * weight;
          totalWeight += weight;
        });

        const calculated = Math.round(weightedSum / totalWeight);
        cognitiveScores[skill] = Math.max(20, Math.min(100, calculated));
      }

      recentTrends.push({
        skill,
        score: cognitiveScores[skill],
        attemptsCount: items.length,
      });
    });

    // Determine strongest area and practice area
    let strongestArea: CognitiveSkillId = 'recognition';
    let practiceArea: CognitiveSkillId = 'categorization';
    let maxScore = -1;
    let minScore = 999;

    ALL_COGNITIVE_SKILLS.forEach((skill) => {
      const score = cognitiveScores[skill];
      if (score > maxScore) {
        maxScore = score;
        strongestArea = skill;
      }
      if (score < minScore) {
        minScore = score;
        practiceArea = skill;
      }
    });

    // Map practice area to best practice game
    const skillToGameMap: Record<CognitiveSkillId, GameId> = {
      categorization: 'odd-one-out',
      associative_memory: 'matching-family',
      visual_spatial: 'shape-fit',
      problem_solving: 'photo-puzzle',
      recognition: 'familiar-faces',
      recall: 'routine-recall',
    };

    const recommendedActivity = skillToGameMap[practiceArea] || 'odd-one-out';
    const recommendedLevel = this.getRecommendedLevel(recommendedActivity, attempts);

    return {
      patientId,
      totalAttempts,
      successRate,
      cognitiveScores,
      strongestArea,
      practiceArea,
      recommendedActivity,
      recommendedLevel,
      recentTrends,
    };
  }

  // Comprehensive adaptive summary for caregiver & patient prompt
  static evaluate(attempts: GameAttempt[]): AdaptiveProfile {
    const recommendedLevels: Record<GameId, number> = {
      'photo-puzzle': this.getRecommendedLevel('photo-puzzle', attempts),
      'familiar-faces': this.getRecommendedLevel('familiar-faces', attempts),
      'familiar-voices': this.getRecommendedLevel('familiar-voices', attempts),
      'routine-recall': this.getRecommendedLevel('routine-recall', attempts),
      'odd-one-out': this.getRecommendedLevel('odd-one-out', attempts),
      'shape-fit': this.getRecommendedLevel('shape-fit', attempts),
      'matching-family': this.getRecommendedLevel('matching-family', attempts),
    };

    const cognitiveAnalytics = this.evaluateCognitiveSkills(attempts);
    const recommendedGame = cognitiveAnalytics.recommendedActivity || this.getRecommendedNextGame(attempts);

    const total = attempts.length;
    const successes = attempts.filter((a) => a.success).length;
    const accuracyRate = total > 0 ? Math.round((successes / total) * 100) : 100;

    let reasonEn = 'Patient shows steady comfort. Recommended level tuned to encourage familiarity without stress.';
    let reasonAs = 'জ্যেষ্ঠজনৰ মানসিক স্থিৰতা সুন্দৰ হৈ আছে। মানসিক চাপ নপৰাকৈ চিনাকি স্তৰত খেলিবলৈ পৰামৰ্শ দিয়া হৈছে।';

    if (accuracyRate >= 85 && total >= 3) {
      reasonEn = 'High cognitive engagement detected over recent sessions. Unlocking higher level challenges for gentle stimulation.';
      reasonAs = 'শেহতীয়া খেলবোৰত খুব ভাল সঁহাৰি দিছে। মন সতেজ ৰাখিবলৈ উচ্চ স্তৰৰ খেল আগবঢ়োৱা হৈছে।';
    } else if (accuracyRate < 60 && total >= 2) {
      reasonEn = 'Slight hesitation noticed. Difficulty is automatically simplified with larger visual cues and extra time.';
      reasonAs = 'কিছু মানসিক দ্বিধাবোধ লক্ষ্য কৰা হৈছে। সেয়েহে সহজ স্তৰ আৰু ডাঙৰ ছবিৰে খেল সজোৱা হৈছে।';
    }

    return {
      recommendedLevels,
      recommendedGame,
      reasonEn,
      reasonAs,
      accuracyRate,
      cognitiveAnalytics,
    };
  }
}
