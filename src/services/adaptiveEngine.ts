import { GameId, GameAttempt } from '../types';

export interface AdaptiveProfile {
  recommendedLevels: Record<GameId, number>;
  recommendedGame: GameId;
  reasonEn: string;
  reasonAs: string;
  accuracyRate: number;
}

export const ALL_GAMES: GameId[] = ['photo-puzzle', 'familiar-faces', 'familiar-voices', 'routine-recall'];

export class AdaptiveDifficultyEngine {
  // Evaluates performance and returns recommended level (1, 2, or 3) for a given game
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
      return Math.min(3, highestLevel + 1);
    }

    // Default to last attempt's level
    return lastAttempt.level;
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

  // Comprehensive adaptive summary for caregiver & patient prompt
  static evaluate(attempts: GameAttempt[]): AdaptiveProfile {
    const recommendedLevels: Record<GameId, number> = {
      'photo-puzzle': this.getRecommendedLevel('photo-puzzle', attempts),
      'familiar-faces': this.getRecommendedLevel('familiar-faces', attempts),
      'familiar-voices': this.getRecommendedLevel('familiar-voices', attempts),
      'routine-recall': this.getRecommendedLevel('routine-recall', attempts),
    };

    const recommendedGame = this.getRecommendedNextGame(attempts);

    const total = attempts.length;
    const successes = attempts.filter((a) => a.success).length;
    const accuracyRate = total > 0 ? Math.round((successes / total) * 100) : 100;

    let reasonEn = 'Patient shows steady comfort. Recommended level tuned to encourage familiarity without stress.';
    let reasonAs = 'জ্যেষ্ঠজনৰ মানসিক স্থিৰতা সুন্দৰ হৈ আছে। মানসিক চাপ নপৰাকৈ চিনাকি স্তৰত খেলিবলৈ পৰামৰ্শ দিয়া হৈছে।';

    if (accuracyRate >= 85 && total >= 3) {
      reasonEn = 'High cognitive confidence detected over recent sessions. Unlocking Level 2 & 3 challenges for gentle stimulation.';
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
    };
  }
}
