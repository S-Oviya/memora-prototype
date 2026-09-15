import {
  GameAttempt,
  AICaregiverInsightResult,
  Language,
  CognitiveSkillId,
  GameId,
} from '../types';
import { CognitiveMLInferenceService, MLPredictionResult } from './mlInferenceService';
import { AdaptiveDifficultyEngine, DifficultyRecommendation } from './adaptiveEngine';

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

    const recommendation = AdaptiveDifficultyEngine.getDifficultyRecommendation(recommendedActivity, attempts);
    const recommendedLevel = recommendation.level;
    const confidence = Number(recommendation.confidence.toFixed(2));

    const getSkillLabel = (skill: CognitiveSkillId): string => {
      switch (skill) {
        case 'recall': return lang === 'as' ? 'ৰুটিন সোঁৱৰণ' : 'Routine Recall';
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

    const isPromotion = recommendation.features && recommendation.level > recommendation.features.currentDifficulty;
    const isDemotion = recommendation.features && recommendation.level < recommendation.features.currentDifficulty;

    if (lang === 'as') {
      if (attempts.length === 0) {
        summary = `${patientName}ৰ বাবে শান্ত আৰু আনন্দদায়ক চিনাকি খেলৰ মাধ্যমেৰে আৰম্ভ কৰা হৈছে। প্ৰথম পৰ্যায়ত স্তৰ ১ পৰামৰ্শ দিয়া হ’ল।`;
        reason = `অফলাইন নিউৰেল মডেলে মানসিক চাপ নপৰাকৈ প্ৰাথমিক স্তৰ নিৰ্ধাৰণ কৰিছে। কোনো ইণ্টাৰনেটৰ প্ৰয়োজন নাই।`;
      } else if (isPromotion) {
        summary = `${patientName}য়ে ${strongestLabel}-ত বিশেষ দক্ষতা দেখুৱাইছে (${strongestScore}%)। অগ্ৰগতিৰ বাবে খেলৰ স্তৰ ${recommendedLevel}-লৈ বৃদ্ধি কৰা হৈছে।`;
        reason = `অফলাইন নিউৰেল MLP মডেলে শেহতীয়া সঁহাৰি পৰ্যবেক্ষণ কৰি স্তৰ ${recommendedLevel} (${Math.round(confidence * 100)}% নিশ্চিতি) নিৰ্ধাৰণ কৰিছে।`;
      } else if (isDemotion) {
        summary = `শেহতীয়া খেলত সামান্য দ্বিধাবোধ লক্ষ্য কৰা হৈছে। সেয়েহে সহজ অনুভৱৰ বাবে খেলৰ স্তৰ ${recommendedLevel}-লৈ নিৰ্ধাৰণ কৰা হৈছে।`;
        reason = `অফলাইন নিউৰেল মডেলে কোনো মানসিক চাপ নপৰাকৈ আৰামদায়ক স্তৰ ${recommendedLevel} বাছি লৈছে।`;
      } else {
        summary = `${patientName}য়ে ${strongestLabel}-ত স্থিৰ আনন্দ লাভ কৰিছে (${strongestScore}%)। ${practiceLabel} নিয়মীয়াকৈ অনুশীলন কৰাৰ পৰামৰ্শ দিয়া হ’ল।`;
        reason = `অফলাইন নিউৰেল MLP মডেলে ইণ্টাৰনেট অবিহনে খেলৰ অগ্ৰগতি নিৰীক্ষণ কৰি স্তৰ ${recommendedLevel} (${Math.round(confidence * 100)}% নিশ্চিতি) বাছি লৈছে।`;
      }

      caregiverSuggestions = [
        `উত্তৰ দিবলৈ তাড়াহুড়া নকৰি আৰামেৰে সময় ল’বলৈ দিয়ক (গড় সময়: ${avgResponseTime} ছেকেণ্ড)।`,
        'শুদ্ধ বা ভুলৰ সলনি মানসিক সন্তুষ্টি আৰু আত্মবিশ্বাসক অধিক গুৰুত্ব দিয়ক।',
        'খেলৰ সময়খিনিক চিনাকি চাহৰ কাপ, সুমধুৰ গীত বা শান্ত সান্নিধ্যৰ সৈতে সংযোগ কৰক।',
      ];
    } else {
      if (attempts.length === 0) {
        summary = `Welcome to Memora. Initial gentle activities at Level 1 recommended to build comfort and familiarity for ${patientName}.`;
        reason = `On-device neural network initialized safe starting levels without requiring internet connection.`;
      } else if (isPromotion) {
        summary = `${patientName} demonstrates strong engagement and steady confidence in ${strongestLabel} (${strongestScore}%). The local cognitive model gently progressed challenge to Level ${recommendedLevel}.`;
        reason = `Local on-device neural model selected Level ${recommendedLevel} (${Math.round(confidence * 100)}% certainty) without needing internet or cloud APIs.`;
      } else if (isDemotion) {
        summary = `Mild hesitation detected during recent sessions. Difficulty was automatically simplified to Level ${recommendedLevel} to prevent frustration and preserve comfort.`;
        reason = `On-device cognitive model automatically eased challenge to Level ${recommendedLevel} (${Math.round(confidence * 100)}% confidence).`;
      } else {
        summary = `${strongestLabel} shows consistent engagement (${strongestScore}%). Continued gentle practice in ${practiceLabel} will maintain reassuring cognitive stimulation.`;
        reason = `Local on-device neural model selected Level ${recommendedLevel} (${Math.round(confidence * 100)}% certainty) without needing internet or cloud APIs.`;
      }

      caregiverSuggestions = [
        `Allow comfortable unhurried time for answering questions (current average: ${avgResponseTime}s).`,
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
