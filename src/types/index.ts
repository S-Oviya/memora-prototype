export type UserRole = 'caregiver' | 'patient';
export type Language = 'en' | 'as';

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
  icon: string;
  photoUrl?: string;
  completed?: boolean;
  order: number;
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

export type GameId = 'photo-puzzle' | 'familiar-faces' | 'familiar-voices' | 'routine-recall';

export interface GameAttempt {
  id: string;
  patientId: string;
  gameId: GameId;
  level: number;
  success: boolean;
  score: number; // Internal caregiver score (0 - 100)
  timeTakenSeconds: number;
  mistakesCount: number;
  timestamp: string; // ISO 8601
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
}

export interface CaregiverGuidanceTip {
  id: string;
  titleEn: string;
  titleAs: string;
  categoryEn: string;
  categoryAs: string;
  summaryEn: string;
  summaryAs: string;
  bulletPointsEn: string[];
  bulletPointsAs: string[];
  icon: string;
}
