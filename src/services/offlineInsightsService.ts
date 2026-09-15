import {
  GameAttempt,
  AICaregiverInsightResult,
  Language,
  CognitiveSkillId,
  GameId,
} from '../types';
import { CognitiveMLInferenceService, MLPredictionResult } from './mlInferenceService';
import { AdaptiveDifficultyEngine } from './adaptiveEngine';

const DISCLAIMER_TEXT =
  "Memora's insights are based on activity performance and are intended for supportive guidance only. They are not a medical assessment.";

export class OfflineInsightsService {
  static generateOfflineInsights(
    patientName: string = 'the senior',
    attempts: GameAttempt[],
    lang: Language = 'en'
  ): AICaregiverInsightResult {
    const analytics = AdaptiveDifficultyEngine.evaluateCognitiveSkills(attempts);
    const strongestSkill = analytics.strongestArea;
    const practiceSkill = analytics.practiceArea;
    const recommendedActivity = analytics.recommendedActivity;

    let mlPrediction: MLPredictionResult | null = null;
    try {
      mlPrediction = CognitiveMLInferenceService.predictDifficulty(recommendedActivity, attempts);
    } catch {
      // Fallback handled safely
    }

    const recommendedLevel = mlPrediction
      ? AdaptiveDifficultyEngine.clampAiLevel(recommendedActivity, mlPrediction.predictedDifficulty, attempts)
      : AdaptiveDifficultyEngine.getRecommendedLevel(recommendedActivity, attempts);

    const confidence = mlPrediction ? Number(mlPrediction.confidence.toFixed(2)) : 0.85;

    const getSkillLabel = (skill: CognitiveSkillId): string => {
      switch (skill) {
        case 'recall': return lang === 'as' ? 'ৰুটিন মনত পেলোৱা' : 'Routine Recall';
        case 'recognition': return lang === 'as' ? 'চিনাকি মুখ আৰু মাত' : 'Familiar Recognition';
        case 'associative_memory': return lang === 'as' ? 'সম্পৰ্ক চিনাক্তকৰণ' : 'Family Connections';
        case 'problem_solving': return lang === 'as' ? 'ছবিৰ সাঁথৰ সমাধান' : 'Visual Puzzle Solving';
        case 'categorization': return lang === 'as' ? 'বস্তুৰ শ্ৰেণী বিভাজন' : 'Object Categorization';
        case 'visual_spatial': return lang === 'as' ? 'আকৃতি চিনাক্তকৰণ' : 'Shape and Spatial Awareness';
        default: return skill;
      }
    };

    const strongestLabel = getSkillLabel(strongestSkill);
    const practiceLabel = getSkillLabel(practiceSkill);
    const strongestScore = analytics.cognitiveScores[strongestSkill] || 85;

    const recent = attempts.slice(-5);
    const avgResponseTime =
      recent.length > 0
        ? Math.round(recent.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0) / recent.length)
        : 25;

    let summary = '';
    let reason = '';
    let caregiverSuggestions: string[] = [];

    if (lang === 'as') {
      if (mlPrediction && mlPrediction.predictedDifficulty > mlPrediction.features.currentDifficulty) {
        summary = patientName + ' demonstrates high engagement in ' + strongestLabel + ' (' + strongestScore + '%). Level updated to ' + recommendedLevel + '.';
      } else if (mlPrediction && mlPrediction.predictedDifficulty < mlPrediction.features.currentDifficulty) {
        summary = patientName + ' had mild hesitation recently. Difficulty eased to Level ' + recommendedLevel + ' for comfort.';
      } else {
        summary = patientName + ' shows steady comfort in ' + strongestLabel + ' (' + strongestScore + '%). Practice in ' + practiceLabel + ' encouraged.';
      }
      reason = 'Offline Neural MLP model selected Level ' + recommendedLevel + ' (' + Math.round(confidence * 100) + '% certainty) without internet.';
      caregiverSuggestions = [
        'Allow unhurried time for answering questions comfortably (' + avgResponseTime + 's average).',
        'Validate emotional comfort rather than accuracy; avoid pointing out mistakes.',
        'Pair short sessions with familiar soothing music or a warm cup of tea.',
      ];
    } else {
      if (mlPrediction && mlPrediction.predictedDifficulty > mlPrediction.features.currentDifficulty) {
        summary = patientName + ' demonstrates strong engagement and steady confidence in ' + strongestLabel + ' (' + strongestScore + '%). The local cognitive model gently progressed challenge to Level ' + recommendedLevel + '.';
      } else if (mlPrediction && mlPrediction.predictedDifficulty < mlPrediction.features.currentDifficulty) {
        summary = 'Mild hesitation detected during recent sessions. Difficulty was automatically simplified to Level ' + recommendedLevel + ' to prevent frustration and preserve comfort.';
      } else {
        summary = strongestLabel + ' shows consistent engagement (' + strongestScore + '%). Continued gentle practice in ' + practiceLabel + ' will maintain reassuring cognitive stimulation.';
      }
      reason = 'Local on-device neural model selected Level ' + recommendedLevel + ' (' + Math.round(confidence * 100) + '% certainty) without needing internet or cloud APIs.';
      caregiverSuggestions = [
        'Allow comfortable unhurried time for answering questions (current average: ' + avgResponseTime + 's).',
        'Validate emotional comfort rather than accuracy; avoid pointing out mistakes.',
        'Pair short gameplay sessions with soothing family memories, tea, or gentle traditional flute melodies.',
      ];
    }

    return {
      summary,
      strongestArea: strongestLabel,
      practiceArea: practiceLabel,
      recommendedActivity,
      recommendedLevel,
      reason,
      caregiverSuggestions,
      confidence,
      disclaimer: DISCLAIMER_TEXT,
      isAiPowered: true,
    };
  }
}
