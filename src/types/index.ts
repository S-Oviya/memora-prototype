export type UserRole = 'caregiver' | 'patient' | 'healthcare_worker';

// Nine supported languages
export type Language = 'en' | 'as' | 'bn' | 'ne' | 'lus' | 'kha' | 'ny' | 'trp' | 'mni';

export type DementiaStage = 'early' | 'mild' | 'moderate' | 'advanced';

export interface Patient {
  id: string;
  name: string;
  age: number;
  dementiaType: string;
  dementiaStage: DementiaStage;
  preferredLanguage: Language;
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  relationshipAs?: string;
  photoUrl: string;
  voiceAudioUrl?: string;
  voiceTranscriptEn?: string;
  voiceTranscriptAs?: string;
  voiceTranscriptBn?: string;
  voiceTranscriptNe?: string;
  voiceTranscriptLus?: string;
  voiceTranscriptKha?: string;
  voiceTranscriptNy?: string;
  voiceTranscriptTrp?: string;
  voiceTranscriptMni?: string;
  voiceTranscripts?: Partial<Record<Language, string>>;
  notes?: string;
}

export type RoutinePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface RoutineItem {
  id: string;
  patientId: string;
  time: string;
  period: RoutinePeriod;
  titleEn: string;
  titleAs: string;
  titles?: Partial<Record<Language, string>>;
  icon: string;
  photoUrl?: string;
  completed?: boolean;
  order: number;
}

export type ReminderType = 'medicine' | 'hydration' | 'activity' | 'appointment';

export interface ReminderItem {
  id: string;
  patientId: string;
  title: string;
  titleEn?: string;
  titleAs?: string;
  titles?: Partial<Record<Language, string>>;
  type: ReminderType;
  time: string; // e.g. "09:00 AM" or ISO string or time representation
  schedule?: string; // e.g. "Daily", "Every 2 Hours", "Weekly", "Specific Date"
  notes?: string;
  notesEn?: string;
  notesAs?: string;
  notesLang?: Partial<Record<Language, string>>;
  enabled: boolean;
  completedToday?: boolean;
  lastAcknowledgedAt?: string;
  createdAt?: string;
}

export type CaregiverAlertType =
  | 'missed_medicine'
  | 'missed_hydration'
  | 'missed_activity'
  | 'missed_appointment'
  | 'inactivity';

export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertStatus = 'unread' | 'read' | 'resolved';

export interface CaregiverAlert {
  id: string;
  patientId: string;
  patientName: string;
  type: CaregiverAlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  titleEn?: string;
  titleAs?: string;
  titles?: Partial<Record<Language, string>>;
  description: string;
  descriptionEn?: string;
  descriptionAs?: string;
  descriptions?: Partial<Record<Language, string>>;
  relevantItemTitle: string;
  relevantItemId?: string;
  dueTime?: string;
  timestamp: string; // ISO 8601
  readAt?: string;
  resolvedAt?: string;
}

export interface FavoriteMusic {
  id: string;
  patientId: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration?: string;
  isBuiltIn?: boolean;
  isSynthesized?: boolean;
}

// 7 Total Cognitive Activities (4 existing + 3 new)
export type GameId =
  | 'photo-puzzle'
  | 'familiar-faces'
  | 'familiar-voices'
  | 'routine-recall'
  | 'odd-one-out'
  | 'shape-fit'
  | 'matching-family';

// Stable internal cognitive skill identifiers
export type CognitiveSkillId =
  | 'recall'
  | 'recognition'
  | 'associative_memory'
  | 'problem_solving'
  | 'categorization'
  | 'visual_spatial';

// Centralized mapping from Game to Primary Cognitive Skill
export const GAME_COGNITIVE_SKILL_MAP: Record<GameId, CognitiveSkillId> = {
  'routine-recall': 'recall',
  'photo-puzzle': 'problem_solving',
  'familiar-faces': 'recognition',
  'odd-one-out': 'categorization',
  'matching-family': 'associative_memory',
  'shape-fit': 'visual_spatial',
  'familiar-voices': 'recognition',
};

// Secondary cognitive skills engaged by activities
export const GAME_SECONDARY_SKILLS_MAP: Record<GameId, CognitiveSkillId[]> = {
  'routine-recall': ['recall'],
  'photo-puzzle': ['problem_solving', 'visual_spatial'],
  'familiar-faces': ['recognition'],
  'odd-one-out': ['categorization'],
  'matching-family': ['associative_memory', 'recognition'],
  'shape-fit': ['visual_spatial', 'problem_solving'],
  'familiar-voices': ['recognition', 'associative_memory'],
};

export interface GameAttempt {
  id: string;
  patientId: string;
  gameId: GameId;
  cognitiveSkill: CognitiveSkillId;
  cognitiveSkills?: CognitiveSkillId[];
  level: number;
  success: boolean;
  score: number; // Activity engagement score (0 - 100)
  timeTakenSeconds: number;
  mistakesCount: number;
  timestamp: string; // ISO 8601
}

export interface CognitiveAnalytics {
  patientId: string;
  totalAttempts: number;
  successRate: number;
  cognitiveScores: Record<CognitiveSkillId, number>;
  strongestArea: CognitiveSkillId;
  practiceArea: CognitiveSkillId;
  recommendedActivity: GameId;
  recommendedLevel: number;
  recentTrends: {
    skill: CognitiveSkillId;
    score: number;
    attemptsCount: number;
  }[];
}

export interface AIRecommendationResult {
  recommendedGame: GameId;
  recommendedLevel: number;
  reason: string;
  confidence: number;
  isAiPowered: boolean;
}

export interface AICaregiverInsightResult {
  summary: string;
  strongestArea: string;
  practiceArea: string;
  recommendedActivity: string;
  recommendedLevel: number;
  reason: string;
  caregiverSuggestions: string[];
  confidence: number;
  disclaimer: string;
  isAiPowered: boolean;
}

export interface GameInfo {
  id: GameId;
  titleEn: string;
  titleAs: string;
  descriptionEn: string;
  descriptionAs: string;
  icon: string;
  color: string;
  bgLight: string;
  badgeEn: string;
  badgeAs: string;
  cognitiveSkill: CognitiveSkillId;
}

export interface CaregiverGuidanceTip {
  id: string;
  titleEn: string;
  titleAs: string;
  titleBn?: string;
  titleNe?: string;
  titleLus?: string;
  titleKha?: string;
  titleNy?: string;
  titleTrp?: string;
  titleMni?: string;
  categoryEn: string;
  categoryAs: string;
  categoryBn?: string;
  categoryNe?: string;
  categoryLus?: string;
  categoryKha?: string;
  categoryNy?: string;
  categoryTrp?: string;
  categoryMni?: string;
  summaryEn: string;
  summaryAs: string;
  summaryBn?: string;
  summaryNe?: string;
  summaryLus?: string;
  summaryKha?: string;
  summaryNy?: string;
  summaryTrp?: string;
  summaryMni?: string;
  bulletPointsEn: string[];
  bulletPointsAs: string[];
  bulletPointsBn?: string[];
  bulletPointsNe?: string[];
  bulletPointsLus?: string[];
  bulletPointsKha?: string[];
  bulletPointsNy?: string[];
  bulletPointsTrp?: string[];
  bulletPointsMni?: string[];
  titles?: Partial<Record<Language, string>>;
  categories?: Partial<Record<Language, string>>;
  summaries?: Partial<Record<Language, string>>;
  bulletPoints?: Partial<Record<Language, string[]>>;
  icon: string;
}
