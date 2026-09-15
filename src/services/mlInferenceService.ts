import { COGNITIVE_MODEL_CONFIG } from './cognitiveModelConfig';
import { GameAttempt, GameId, CognitiveSkillId, GAME_COGNITIVE_SKILL_MAP } from '../types';

export interface MLFeatures {
  recentAvgScore: number;
  recentMistakes: number;
  responseTimeSec: number;
  currentDifficulty: number;
  consecutiveSuccesses: number;
  numRecentAttempts: number;
  cognitiveDomain: number;
  recentTrend: number;
}

export interface MLPredictionResult {
  predictedDifficulty: number; // 1 to 5
  confidence: number;          // 0 to 1
  probabilities: number[];     // 5 output probabilities
  features: MLFeatures;
  rawFeatureVector: number[];
  isMlDriven: boolean;
  explanation: string;
}

export class CognitiveMLInferenceService {
  private static config = COGNITIVE_MODEL_CONFIG;

  /**
   * Evaluates the pure neural forward pass given an 8-dimensional feature vector.
   * Architecture: 8 -> Dense(16, ReLU) -> Dense(5, Softmax)
   */
  static predictFromFeatures(rawFeatures: number[]): {
    predictedDifficulty: number;
    confidence: number;
    probabilities: number[];
  } {
    const { scaler, weights, classes } = this.config;
    const mean = scaler.mean as readonly number[];
    const scale = scaler.scale as readonly number[];
    const W1 = weights.layer_1_weights as readonly (readonly number[])[];
    const b1 = weights.layer_1_biases as readonly number[];
    const W2 = weights.layer_2_weights as readonly (readonly number[])[];
    const b2 = weights.layer_2_biases as readonly number[];

    // 1. Feature normalization: (x - mean) / scale
    const xNorm: number[] = new Array(8);
    for (let i = 0; i < 8; i++) {
      const s = scale[i] !== 0 ? scale[i] : 1;
      xNorm[i] = (rawFeatures[i] - mean[i]) / s;
    }

    // 2. Layer 1: Dense(16) + ReLU
    const hidden: number[] = new Array(16);
    for (let j = 0; j < 16; j++) {
      let sum = b1[j];
      for (let i = 0; i < 8; i++) {
        sum += xNorm[i] * W1[i][j];
      }
      hidden[j] = Math.max(0, sum); // ReLU activation
    }

    // 3. Layer 2: Dense(5) logits
    const logits: number[] = new Array(5);
    let maxLogit = -Infinity;
    for (let k = 0; k < 5; k++) {
      let sum = b2[k];
      for (let j = 0; j < 16; j++) {
        sum += hidden[j] * W2[j][k];
      }
      logits[k] = sum;
      if (sum > maxLogit) {
        maxLogit = sum;
      }
    }

    // 4. Softmax activation (with numeric stability)
    const expLogits: number[] = new Array(5);
    let sumExp = 0;
    for (let k = 0; k < 5; k++) {
      const expVal = Math.exp(logits[k] - maxLogit);
      expLogits[k] = expVal;
      sumExp += expVal;
    }

    const probabilities: number[] = new Array(5);
    let bestIndex = 0;
    let maxProb = -Infinity;
    for (let k = 0; k < 5; k++) {
      const prob = sumExp > 0 ? expLogits[k] / sumExp : 0.2;
      probabilities[k] = prob;
      if (prob > maxProb) {
        maxProb = prob;
        bestIndex = k;
      }
    }

    const predictedDifficulty = (classes as readonly number[])[bestIndex] || (bestIndex + 1);

    return {
      predictedDifficulty,
      confidence: maxProb,
      probabilities,
    };
  }

  /**
   * Maps cognitive skill domain name to index (0-5)
   */
  static getDomainIndex(skill: CognitiveSkillId): number {
    const domainMap: Record<string, number> = this.config.cognitive_domains;
    if (skill in domainMap) {
      return domainMap[skill];
    }
    return 3; // Default to problem_solving
  }

  /**
   * Extracts real ML features from a patient\'s GameAttempt history for a specific game.
   */
  static extractFeatures(gameId: GameId, attempts: GameAttempt[]): MLFeatures {
    const gameAttempts = attempts
      .filter((a) => a.gameId === gameId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const recent = gameAttempts.slice(0, 5);
    const numRecentAttempts = recent.length;

    // Determine current level from the latest attempt or baseline 1
    const currentDifficulty = recent.length > 0 ? recent[0].level : 1;

    // Determine cognitive domain
    const primarySkill = recent.length > 0 && recent[0].cognitiveSkill
      ? recent[0].cognitiveSkill
      : GAME_COGNITIVE_SKILL_MAP[gameId] || 'problem_solving';
    const cognitiveDomain = this.getDomainIndex(primarySkill);

    if (numRecentAttempts === 0) {
      // Baseline cold start features
      return {
        recentAvgScore: 70.0,
        recentMistakes: 1.0,
        responseTimeSec: 30.0,
        currentDifficulty: 1,
        consecutiveSuccesses: 0,
        numRecentAttempts: 0,
        cognitiveDomain,
        recentTrend: 0.0,
      };
    }

    // 1. Recent Average Score
    const recentAvgScore = recent.reduce((sum, a) => sum + a.score, 0) / numRecentAttempts;

    // 2. Recent Mistakes (average mistakes across recent attempts)
    const recentMistakes = recent.reduce((sum, a) => sum + (a.mistakesCount || 0), 0) / numRecentAttempts;

    // 3. Response Time (average time in seconds)
    const responseTimeSec = recent.reduce((sum, a) => sum + (a.timeTakenSeconds || 0), 0) / numRecentAttempts;

    // 4. Consecutive Successes (counting unbroken successes backwards from most recent)
    let consecutiveSuccesses = 0;
    for (const a of recent) {
      if (a.success) {
        consecutiveSuccesses++;
      } else {
        break;
      }
    }

    // 5. Recent Performance Trend
    let recentTrend = 0.0;
    if (numRecentAttempts >= 2) {
      const latestScore = recent[0].score;
      const oldestInWindowScore = recent[numRecentAttempts - 1].score;
      recentTrend = latestScore - oldestInWindowScore;
    } else {
      recentTrend = recent[0].score >= 80 ? 10.0 : recent[0].score < 50 ? -15.0 : 0.0;
    }

    return {
      recentAvgScore: Number(recentAvgScore.toFixed(2)),
      recentMistakes: Number(recentMistakes.toFixed(2)),
      responseTimeSec: Number(responseTimeSec.toFixed(2)),
      currentDifficulty,
      consecutiveSuccesses,
      numRecentAttempts,
      cognitiveDomain,
      recentTrend: Number(recentTrend.toFixed(2)),
    };
  }

  /**
   * Primary inference: predicts optimal difficulty 1-5 for a game.
   */
  static predictDifficulty(gameId: GameId, attempts: GameAttempt[]): MLPredictionResult {
    const features = this.extractFeatures(gameId, attempts);
    const rawVector = [
      features.recentAvgScore,
      features.recentMistakes,
      features.responseTimeSec,
      features.currentDifficulty,
      features.consecutiveSuccesses,
      features.numRecentAttempts,
      features.cognitiveDomain,
      features.recentTrend,
    ];

    const inference = this.predictFromFeatures(rawVector);

    let explanation = `ML model selected Level ${inference.predictedDifficulty} (${(inference.confidence * 100).toFixed(1)}% confidence).`;
    if (inference.predictedDifficulty > features.currentDifficulty) {
      explanation = `Steady mastery observed (${features.recentAvgScore}% avg score, ${features.consecutiveSuccesses} streak). ML promoted to Level ${inference.predictedDifficulty}.`;
    } else if (inference.predictedDifficulty < features.currentDifficulty) {
      explanation = `Slight hesitation noticed (${features.recentMistakes.toFixed(1)} avg mistakes, ${features.responseTimeSec.toFixed(0)}s response). ML eased to Level ${inference.predictedDifficulty}.`;
    } else {
      explanation = `Patient comfortable at Level ${inference.predictedDifficulty} (${features.recentAvgScore}% score). ML maintained steady pacing.`;
    }

    return {
      predictedDifficulty: inference.predictedDifficulty,
      confidence: inference.confidence,
      probabilities: inference.probabilities,
      features,
      rawFeatureVector: rawVector,
      isMlDriven: true,
      explanation,
    };
  }
}
