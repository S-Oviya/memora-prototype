import {
  Patient,
  FamilyMember,
  RoutineItem,
  ReminderItem,
  FavoriteMusic,
  GameAttempt,
  CognitiveAnalytics,
  AIRecommendationResult,
  AICaregiverInsightResult,
  CaregiverAlert,
  Language,
} from '../types';
import { db } from './db';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

class ApiService {
  private isOnline: boolean = false;
  private lastHealthCheck: number = 0;

  private getAuthHeaders(additional?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-User-Role': typeof db !== 'undefined' ? db.getActiveRole() : 'patient',
      ...additional,
    };
    if (typeof sessionStorage !== 'undefined') {
      const pin = sessionStorage.getItem('memora_session_pin');
      if (pin) {
        headers['X-Caregiver-PIN'] = pin;
      }
      const healthcarePin = sessionStorage.getItem('memora_session_healthcare_pin');
      if (healthcarePin) {
        headers['X-Healthcare-PIN'] = healthcarePin;
      }
    }
    return headers;
  }

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
      const res = await fetch(`${API_BASE}/api/patients/${patientId}`, {
        headers: this.getAuthHeaders(),
      });
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
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/attempts`, {
        headers: this.getAuthHeaders(),
      });
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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

  async getReminders(patientId: string): Promise<ReminderItem[] | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/reminders`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async saveReminder(reminder: ReminderItem): Promise<ReminderItem | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${reminder.patientId}/reminders`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(reminder),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async deleteReminder(patientId: string, reminderId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/reminders/${reminderId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getAlerts(patientId: string): Promise<CaregiverAlert[] | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/alerts`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async saveAlert(alert: CaregiverAlert): Promise<CaregiverAlert | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${alert.patientId}/alerts`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(alert),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async updateAlertStatus(patientId: string, alertId: string, status: string): Promise<boolean> {
    try {
      const payload: any = { status };
      if (status === 'resolved') payload.resolvedAt = new Date().toISOString();
      if (status === 'read') payload.readAt = new Date().toISOString();
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/alerts/${alertId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async deleteAlert(patientId: string, alertId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getAnalytics(patientId: string): Promise<CognitiveAnalytics | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/analytics`, {
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getRecommendation(patientId: string): Promise<AIRecommendationResult | null> {
    try {
      const res = await fetch(`${API_BASE}/api/patients/${patientId}/recommendation`, {
        headers: this.getAuthHeaders(),
      });
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
        `${API_BASE}/api/patients/${patientId}/caregiver-insights?lang=${encodeURIComponent(lang)}`,
        {
          headers: this.getAuthHeaders(),
        }
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

  async synthesizeSpeech(text: string, language: string): Promise<Blob> {
    const cleanedText = text.trim();
    if (!cleanedText) {
      throw new Error('Text cannot be empty.');
    }

    const payload = JSON.stringify({
      text: cleanedText,
      language: language.toLowerCase().split('-')[0].trim(),
    });

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/wav',
        },
        body: payload,
      });
      if (res.status === 404) {
        res = await fetch(`${API_BASE}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'audio/wav',
          },
          body: payload,
        });
      }
    } catch {
      throw new Error('Local FastAPI TTS server is offline or unreachable. Please ensure the backend is running.');
    }

    if (!res.ok) {
      let errorDetail = 'Speech generation failed.';
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        errorDetail = `Server returned status ${res.status}.`;
      }
      throw new Error(errorDetail);
    }

    return await res.blob();
  }
}

export const api = new ApiService();
