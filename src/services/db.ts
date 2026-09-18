import { Patient, FamilyMember, RoutineItem, FavoriteMusic, GameAttempt, GameId, GAME_COGNITIVE_SKILL_MAP } from '../types';
import { INITIAL_PATIENT, INITIAL_FAMILY_MEMBERS, INITIAL_ROUTINES, INITIAL_MUSIC } from './seedData';

const KEYS = {
  PATIENT: 'memora_patient',
  FAMILY: 'memora_family_members',
  ROUTINES: 'memora_routines',
  MUSIC: 'memora_music',
  ATTEMPTS: 'memora_game_attempts',
  CAREGIVER_PIN: 'memora_caregiver_pin',
  CAREGIVER_PIN_CHANGED: 'memora_caregiver_pin_changed',
  ACTIVE_ROLE: 'memora_active_role',
};

class DatabaseService {
  // --- Patient ---
  getPatient(): Patient {
    try {
      const data = localStorage.getItem(KEYS.PATIENT);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load patient from storage', e);
    }
    // Initialize with seed data
    this.savePatient(INITIAL_PATIENT);
    return INITIAL_PATIENT;
  }

  savePatient(patient: Patient): void {
    try {
      localStorage.setItem(KEYS.PATIENT, JSON.stringify(patient));
    } catch (e) {
      console.error('Failed to save patient', e);
    }
  }

  // --- Family Members ---
  getFamilyMembers(): FamilyMember[] {
    try {
      const data = localStorage.getItem(KEYS.FAMILY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load family members', e);
    }
    this.saveFamilyMembers(INITIAL_FAMILY_MEMBERS);
    return INITIAL_FAMILY_MEMBERS;
  }

  saveFamilyMembers(members: FamilyMember[]): void {
    try {
      localStorage.setItem(KEYS.FAMILY, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save family members', e);
    }
  }

  addFamilyMember(member: FamilyMember): void {
    const list = this.getFamilyMembers();
    list.push(member);
    this.saveFamilyMembers(list);
  }

  updateFamilyMember(member: FamilyMember): void {
    const list = this.getFamilyMembers().map(m => (m.id === member.id ? member : m));
    this.saveFamilyMembers(list);
  }

  deleteFamilyMember(id: string): void {
    const list = this.getFamilyMembers().filter(m => m.id !== id);
    this.saveFamilyMembers(list);
  }

  // --- Routines ---
  getRoutines(): RoutineItem[] {
    try {
      const data = localStorage.getItem(KEYS.ROUTINES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load routines', e);
    }
    this.saveRoutines(INITIAL_ROUTINES);
    return INITIAL_ROUTINES;
  }

  saveRoutines(routines: RoutineItem[]): void {
    try {
      localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
    } catch (e) {
      console.error('Failed to save routines', e);
    }
  }

  addRoutine(routine: RoutineItem): void {
    const list = this.getRoutines();
    list.push(routine);
    this.saveRoutines(list);
  }

  deleteRoutine(id: string): void {
    const list = this.getRoutines().filter(r => r.id !== id);
    this.saveRoutines(list);
  }

  // --- Favorite Music ---
  getMusicTracks(): FavoriteMusic[] {
    try {
      const data = localStorage.getItem(KEYS.MUSIC);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load music', e);
    }
    this.saveMusicTracks(INITIAL_MUSIC);
    return INITIAL_MUSIC;
  }

  saveMusicTracks(tracks: FavoriteMusic[]): void {
    try {
      localStorage.setItem(KEYS.MUSIC, JSON.stringify(tracks));
    } catch (e) {
      console.error('Failed to save music', e);
    }
  }

  addMusicTrack(track: FavoriteMusic): void {
    const list = this.getMusicTracks();
    list.push(track);
    this.saveMusicTracks(list);
  }

  deleteMusicTrack(id: string): void {
    const list = this.getMusicTracks().filter(m => m.id !== id);
    this.saveMusicTracks(list);
  }

  // --- Game Attempts & Performance ---
  getGameAttempts(): GameAttempt[] {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(KEYS.ATTEMPTS);
        if (data !== null) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load game attempts', e);
    }
    // Return sample initial history for demonstration of charts
    const initialAttempts: GameAttempt[] = [
      {
        id: 'att-1',
        patientId: 'patient-ramesh-1',
        gameId: 'photo-puzzle',
        cognitiveSkill: 'problem_solving',
        level: 1,
        success: true,
        score: 95,
        timeTakenSeconds: 32,
        mistakesCount: 1,
        timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'att-2',
        patientId: 'patient-ramesh-1',
        gameId: 'familiar-faces',
        cognitiveSkill: 'recognition',
        level: 1,
        success: true,
        score: 100,
        timeTakenSeconds: 18,
        mistakesCount: 0,
        timestamp: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
      {
        id: 'att-3',
        patientId: 'patient-ramesh-1',
        gameId: 'familiar-voices',
        cognitiveSkill: 'recognition',
        level: 1,
        success: true,
        score: 90,
        timeTakenSeconds: 24,
        mistakesCount: 1,
        timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      },
      {
        id: 'att-4',
        patientId: 'patient-ramesh-1',
        gameId: 'routine-recall',
        cognitiveSkill: 'recall',
        level: 1,
        success: true,
        score: 100,
        timeTakenSeconds: 28,
        mistakesCount: 0,
        timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
      {
        id: 'att-5',
        patientId: 'patient-ramesh-1',
        gameId: 'photo-puzzle',
        cognitiveSkill: 'problem_solving',
        level: 2,
        success: true,
        score: 85,
        timeTakenSeconds: 45,
        mistakesCount: 2,
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: 'att-6',
        patientId: 'patient-ramesh-1',
        gameId: 'odd-one-out',
        cognitiveSkill: 'categorization',
        level: 1,
        success: true,
        score: 80,
        timeTakenSeconds: 25,
        mistakesCount: 1,
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      },
      {
        id: 'att-7',
        patientId: 'patient-ramesh-1',
        gameId: 'matching-family',
        cognitiveSkill: 'associative_memory',
        level: 1,
        success: true,
        score: 85,
        timeTakenSeconds: 20,
        mistakesCount: 1,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];
    this.saveGameAttempts(initialAttempts);
    return initialAttempts;
  }

  saveGameAttempts(attempts: GameAttempt[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(KEYS.ATTEMPTS, JSON.stringify(attempts));
      }
    } catch (e) {
      console.error('Failed to save game attempts', e);
    }
  }

  recordGameAttempt(attempt: Omit<GameAttempt, 'id' | 'timestamp' | 'cognitiveSkill'> & { cognitiveSkill?: any }): GameAttempt {
    const cognitiveSkill = attempt.cognitiveSkill || GAME_COGNITIVE_SKILL_MAP[attempt.gameId] || 'problem_solving';
    const fullAttempt: GameAttempt = {
      ...attempt,
      cognitiveSkill,
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const current = this.getGameAttempts();
    current.push(fullAttempt);
    this.saveGameAttempts(current);
    return fullAttempt;
  }

  // --- Caregiver Password / PIN ---
  isCaregiverPinChanged(): boolean {
    return localStorage.getItem(KEYS.CAREGIVER_PIN_CHANGED) === 'true';
  }

  getCaregiverPin(): string {
    const stored = localStorage.getItem(KEYS.CAREGIVER_PIN);
    if (stored) return stored;
    return '1234';
  }

  verifyCaregiverPin(inputPin: string): boolean {
    if (!inputPin) return false;
    const isChanged = this.isCaregiverPinChanged();
    if (isChanged) {
      const stored = localStorage.getItem(KEYS.CAREGIVER_PIN);
      return Boolean(stored && inputPin === stored);
    }
    // Initial setup password: only '1234' is accepted before the password is changed
    return inputPin === '1234';
  }

  setCaregiverPin(pin: string): void {
    localStorage.setItem(KEYS.CAREGIVER_PIN, pin);
    localStorage.setItem(KEYS.CAREGIVER_PIN_CHANGED, 'true');
  }

  changeCaregiverPassword(currentPassword: string, newPassword: string): { success: boolean; error?: string } {
    if (!newPassword || newPassword.trim() === '') {
      return { success: false, error: 'New password cannot be empty.' };
    }
    if (!this.verifyCaregiverPin(currentPassword)) {
      return { success: false, error: 'Current password is incorrect.' };
    }
    this.setCaregiverPin(newPassword);
    return { success: true };
  }

  // --- Active Role ---
  getActiveRole(): 'caregiver' | 'patient' {
    return (localStorage.getItem(KEYS.ACTIVE_ROLE) as 'caregiver' | 'patient') || 'patient';
  }

  setActiveRole(role: 'caregiver' | 'patient'): void {
    localStorage.setItem(KEYS.ACTIVE_ROLE, role);
  }

  // Reset to initial demo state if needed
  resetToDefault() {
    localStorage.clear();
    this.savePatient(INITIAL_PATIENT);
    this.saveFamilyMembers(INITIAL_FAMILY_MEMBERS);
    this.saveRoutines(INITIAL_ROUTINES);
    this.saveMusicTracks(INITIAL_MUSIC);
  }
}

export const db = new DatabaseService();
