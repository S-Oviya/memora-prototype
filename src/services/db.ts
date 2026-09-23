import { UserRole, Patient, FamilyMember, RoutineItem, ReminderItem, FavoriteMusic, GameAttempt, GameId, GAME_COGNITIVE_SKILL_MAP, CaregiverAlert } from '../types';
import { INITIAL_PATIENT, INITIAL_FAMILY_MEMBERS, INITIAL_ROUTINES, INITIAL_REMINDERS, INITIAL_MUSIC, INITIAL_ALERTS } from './seedData';
import { evaluateCaregiverAlerts } from './alertService';
import { sha256 } from '../utils/crypto';

const DEFAULT_PIN_HASH = sha256('1234');
const DEFAULT_HEALTHCARE_PIN_HASH = sha256('4321');

const KEYS = {
  PATIENT: 'memora_patient',
  FAMILY: 'memora_family_members',
  ROUTINES: 'memora_routines',
  REMINDERS: 'memora_reminders',
  ALERTS: 'memora_alerts',
  MUSIC: 'memora_music',
  ATTEMPTS: 'memora_game_attempts',
  CAREGIVER_PIN_HASH: 'memora_caregiver_pin_hash',
  CAREGIVER_PIN_LEN: 'memora_caregiver_pin_len',
  CAREGIVER_PIN_CHANGED: 'memora_caregiver_pin_changed',
  // Legacy key for migration only:
  LEGACY_CAREGIVER_PIN: 'memora_caregiver_pin',
  ACTIVE_ROLE: 'memora_active_role',
};

class DatabaseService {
  constructor() {
    this.migrateLegacyPinStorage();
  }

  private migrateLegacyPinStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const legacyPin = localStorage.getItem(KEYS.LEGACY_CAREGIVER_PIN);
      if (legacyPin) {
        // Migrate to SHA-256 hash
        localStorage.setItem(KEYS.CAREGIVER_PIN_HASH, sha256(legacyPin));
        localStorage.setItem(KEYS.CAREGIVER_PIN_LEN, legacyPin.length.toString());
        localStorage.setItem(KEYS.CAREGIVER_PIN_CHANGED, 'true');
        // Safely remove plaintext PIN from persistent storage
        localStorage.removeItem(KEYS.LEGACY_CAREGIVER_PIN);
      }
    } catch (e) {
      console.error('Failed to migrate legacy PIN storage', e);
    }
  }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memora_patient_updated', { detail: patient }));
      }
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memora_routines_updated', { detail: routines }));
      }
    } catch (e) {
      console.error('Failed to save routines', e);
    }
  }

  addRoutine(routine: RoutineItem): void {
    const list = this.getRoutines();
    list.push(routine);
    this.saveRoutines(list);
  }

  updateRoutine(routine: RoutineItem): void {
    const list = this.getRoutines().map(r => (r.id === routine.id ? routine : r));
    this.saveRoutines(list);
  }

  reorderRoutines(routines: RoutineItem[]): void {
    const normalized = routines.map((r, idx) => ({
      ...r,
      order: idx + 1,
    }));
    this.saveRoutines(normalized);
  }

  toggleRoutineCompleted(id: string, completed?: boolean): void {
    const list = this.getRoutines().map(r => {
      if (r.id === id) {
        const nextState = completed !== undefined ? completed : !r.completed;
        return {
          ...r,
          completed: nextState,
        };
      }
      return r;
    });
    this.saveRoutines(list);
  }

  deleteRoutine(id: string): void {
    const list = this.getRoutines().filter(r => r.id !== id);
    const reordered = list.map((r, idx) => ({ ...r, order: idx + 1 }));
    this.saveRoutines(reordered);
  }

  // --- Reminders ---
  getReminders(): ReminderItem[] {
    try {
      const data = localStorage.getItem(KEYS.REMINDERS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load reminders', e);
    }
    this.saveReminders(INITIAL_REMINDERS);
    return INITIAL_REMINDERS;
  }

  saveReminders(reminders: ReminderItem[]): void {
    try {
      localStorage.setItem(KEYS.REMINDERS, JSON.stringify(reminders));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memora_reminders_updated', { detail: reminders }));
      }
    } catch (e) {
      console.error('Failed to save reminders', e);
    }
  }

  addReminder(reminder: ReminderItem): void {
    const list = this.getReminders();
    list.push(reminder);
    this.saveReminders(list);
  }

  updateReminder(reminder: ReminderItem): void {
    const list = this.getReminders().map(r => (r.id === reminder.id ? reminder : r));
    this.saveReminders(list);
  }

  toggleReminder(id: string, enabled?: boolean): void {
    const list = this.getReminders().map(r => {
      if (r.id === id) {
        return { ...r, enabled: enabled !== undefined ? enabled : !r.enabled };
      }
      return r;
    });
    this.saveReminders(list);
  }

  toggleReminderCompleted(id: string, completed?: boolean): void {
    let markedDone = false;
    const list = this.getReminders().map(r => {
      if (r.id === id) {
        const nextState = completed !== undefined ? completed : !r.completedToday;
        markedDone = nextState;
        return {
          ...r,
          completedToday: nextState,
          lastAcknowledgedAt: nextState ? new Date().toISOString() : r.lastAcknowledgedAt,
        };
      }
      return r;
    });
    this.saveReminders(list);

    if (markedDone) {
      const alerts = this.getAlerts().map(a => {
        if (a.relevantItemId === id && a.status !== 'resolved') {
          return { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() };
        }
        return a;
      });
      this.saveAlerts(alerts);
    }
  }

  deleteReminder(id: string): void {
    const list = this.getReminders().filter(r => r.id !== id);
    this.saveReminders(list);
  }

  // --- Caregiver Alerts ---
  getAlerts(): CaregiverAlert[] {
    try {
      const data = localStorage.getItem(KEYS.ALERTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load alerts', e);
    }
    this.saveAlerts(INITIAL_ALERTS);
    return INITIAL_ALERTS;
  }

  saveAlerts(alerts: CaregiverAlert[]): void {
    try {
      localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memora_alerts_updated', { detail: alerts }));
      }
    } catch (e) {
      console.error('Failed to save alerts', e);
    }
  }

  markAlertRead(id: string): void {
    const list = this.getAlerts().map(a => {
      if (a.id === id && a.status !== 'resolved') {
        return { ...a, status: 'read' as const, readAt: new Date().toISOString() };
      }
      return a;
    });
    this.saveAlerts(list);
  }

  markAlertResolved(id: string): void {
    const list = this.getAlerts().map(a => {
      if (a.id === id) {
        return { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() };
      }
      return a;
    });
    this.saveAlerts(list);
  }

  deleteAlert(id: string): void {
    const list = this.getAlerts().filter(a => a.id !== id);
    this.saveAlerts(list);
  }

  checkAndRefreshAlerts(): CaregiverAlert[] {
    const currentAlerts = this.getAlerts();
    const evaluated = evaluateCaregiverAlerts({
      patient: this.getPatient(),
      reminders: this.getReminders(),
      gameAttempts: this.getGameAttempts(),
      routines: this.getRoutines(),
      existingAlerts: currentAlerts,
    });
    this.saveAlerts(evaluated);
    return evaluated;
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
            const FAKE_ATTEMPT_IDS = new Set(['att-1', 'att-2', 'att-3', 'att-4', 'att-5', 'att-6', 'att-7']);
            const realAttempts = parsed.filter((a: GameAttempt) => a && a.id && !FAKE_ATTEMPT_IDS.has(a.id));
            if (realAttempts.length !== parsed.length) {
              this.saveGameAttempts(realAttempts);
            }
            return realAttempts;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load game attempts', e);
    }
    return [];
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memora_attempts_updated', { detail: current }));
    }
    return fullAttempt;
  }

  // --- Caregiver Password / PIN ---
  isCaregiverPinChanged(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(KEYS.CAREGIVER_PIN_CHANGED) === 'true';
  }

  getCaregiverPinLength(): number {
    if (typeof localStorage === 'undefined') return 4;
    const len = localStorage.getItem(KEYS.CAREGIVER_PIN_LEN);
    return len ? parseInt(len, 10) : 4;
  }

  getCaregiverPin(): string {
    // For backwards-compatibility with callers reading .length
    return '*'.repeat(this.getCaregiverPinLength());
  }

  verifyCaregiverPin(inputPin: string): boolean {
    if (!inputPin) return false;
    if (typeof localStorage === 'undefined') return inputPin === '1234';

    const inputHash = sha256(inputPin.trim());
    const isChanged = this.isCaregiverPinChanged();

    if (isChanged) {
      const storedHash = localStorage.getItem(KEYS.CAREGIVER_PIN_HASH);
      return Boolean(storedHash && inputHash === storedHash);
    }
    // Default initial PIN is 1234
    return inputHash === DEFAULT_PIN_HASH;
  }

  setCaregiverPin(pin: string): void {
    if (typeof localStorage === 'undefined') return;
    const trimmed = pin.trim();
    localStorage.setItem(KEYS.CAREGIVER_PIN_HASH, sha256(trimmed));
    localStorage.setItem(KEYS.CAREGIVER_PIN_LEN, trimmed.length.toString());
    localStorage.setItem(KEYS.CAREGIVER_PIN_CHANGED, 'true');
    // Ensure no plaintext remains
    localStorage.removeItem(KEYS.LEGACY_CAREGIVER_PIN);
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

  verifyHealthcarePin(inputPin: string): boolean {
    if (!inputPin) return false;
    if (typeof localStorage === 'undefined') return inputPin === '4321' || inputPin === '1234';

    const inputHash = sha256(inputPin.trim());
    // Accepts healthcare PIN (4321) or caregiver credentials
    return inputHash === DEFAULT_HEALTHCARE_PIN_HASH || this.verifyCaregiverPin(inputPin);
  }

  // --- Active Role ---
  getActiveRole(): UserRole {
    return (localStorage.getItem(KEYS.ACTIVE_ROLE) as UserRole) || 'patient';
  }

  setActiveRole(role: UserRole): void {
    localStorage.setItem(KEYS.ACTIVE_ROLE, role);
  }

  // Reset to initial demo state if needed
  resetToDefault() {
    localStorage.clear();
    this.savePatient(INITIAL_PATIENT);
    this.saveFamilyMembers(INITIAL_FAMILY_MEMBERS);
    this.saveRoutines(INITIAL_ROUTINES);
    this.saveReminders(INITIAL_REMINDERS);
    this.saveAlerts(INITIAL_ALERTS);
    this.saveMusicTracks(INITIAL_MUSIC);
    this.saveGameAttempts([]);
  }
}

export const db = new DatabaseService();
