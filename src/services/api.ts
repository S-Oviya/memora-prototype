import {
  Patient,
  FamilyMember,
  RoutineItem,
  FavoriteMusic,
  GameAttempt,
  CognitiveAnalytics,
  AIRecommendationResult,
  AICaregiverInsightResult,
  Language,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

class ApiService {
  private isOnline: boolean = false;
  private lastHealthCheck: number = 0;

  async checkHealth(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastHealthCheck < 10000 && this.isOnline) {
      return true;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE}/api/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.isOnline = res.ok;
      this.lastHealthCheck = now;
      return res.ok;
    } catch {
      this.isOnline = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  async getPatient(patientId: string): Promise<Patient | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        id: data.id,
        name: data.name,
        age: data.age,
        dementiaType: data.dementiaType || data.dementia_type,
        dementiaStage: data.dementiaStage || data.dementia_stage,
        preferredLanguage: data.preferredLanguage || data.preferred_language,
        avatarUrl: data.avatarUrl || data.avatar_url,
        notes: data.notes,
        createdAt: data.createdAt || data.created_at || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  async getGameAttempts(patientId: string): Promise<GameAttempt[] | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/attempts`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async recordGameAttempt(
    attempt: Omit<GameAttempt, 'id' | 'timestamp'>
  ): Promise<GameAttempt | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${attempt.patientId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: attempt.patientId,
          gameId: attempt.gameId,
          cognitiveSkill: attempt.cognitiveSkill,
          cognitiveSkills: attempt.cognitiveSkills,
          level: attempt.level,
          score: attempt.score,
          mistakesCount: attempt.mistakesCount,
          success: attempt.success,
          timeTakenSeconds: attempt.timeTakenSeconds,
        }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      // Backend is optional; silently return null so localStorage remains source of truth
      return null;
    }
  }

  async getAnalytics(patientId: string): Promise<CognitiveAnalytics | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/analytics`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getRecommendation(patientId: string): Promise<AIRecommendationResult | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/recommendation`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getCaregiverInsights(
    patientId: string,
    lang: Language
  ): Promise<AICaregiverInsightResult | null> {
    try {
      const res = await fetch(
        `${API_BASE}/api/patients/${patientId}/caregiver-insights?lang=${encodeURIComponent(lang)}`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  getTTSAudioUrl(text: string, lang: string): string {
    return `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
  }
}

export const api = new ApiService();
