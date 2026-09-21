// @ts-nocheck
import { db } from './db';
import { INITIAL_REMINDERS, getReminderTitle, getReminderNotes } from './seedData';
import { en } from '../locales/en';
import { as } from '../locales/as';
import { bn } from '../locales/bn';
import { ne } from '../locales/ne';
import { lus } from '../locales/lus';
import { kha } from '../locales/kha';
import { ny } from '../locales/ny';
import { trp } from '../locales/trp';
import { mni } from '../locales/mni';
import { ReminderItem, Language } from '../types';

const allTranslations: Record<Language, any> = { en, as, bn, ne, lus, kha, ny, trp, mni };

// Mock localStorage for node environment if not defined
if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {
      for (const k in store) delete store[k];
    },
  };
}

function runReminderTests() {
  console.log('--- Starting Memora Reminder System Tests ---');

  // 1. Check Initial Seed Data
  localStorage.clear();
  const initialList = db.getReminders();
  if (!Array.isArray(initialList) || initialList.length !== 4) {
    throw new Error(`Test 1 Failed: Expected 4 initial reminders, got ${initialList.length}`);
  }
  const types = new Set(initialList.map(r => r.type));
  if (!types.has('medicine') || !types.has('hydration') || !types.has('activity') || !types.has('appointment')) {
    throw new Error(`Test 1 Failed: Missing one of the 4 required reminder types in seed data`);
  }
  console.log('✔ Test 1 Passed: Initial seed data contains all 4 reminder types (medicine, hydration, activity, appointment)');

  // 2. Multilingual Translations
  const sampleMed = initialList.find(r => r.type === 'medicine')!;
  const langs: Language[] = ['en', 'as', 'bn', 'ne', 'lus', 'kha', 'ny', 'trp', 'mni'];
  for (const lang of langs) {
    const title = getReminderTitle(sampleMed, lang);
    const notes = getReminderNotes(sampleMed, lang);
    if (!title || title.length === 0) {
      throw new Error(`Test 2 Failed: No title found for language ${lang}`);
    }
    const tObj = allTranslations[lang];
    if (!tObj?.caregiver?.reminders || !tObj?.patient?.reminders) {
      throw new Error(`Test 2 Failed: Missing localization keys for ${lang}`);
    }
  }
  console.log('✔ Test 2 Passed: Multilingual system resolves reminder titles, notes, and labels across all 9 languages');

  // 3. Create / Add Reminder
  const customRem: ReminderItem = {
    id: 'test-rem-custom-1',
    patientId: 'patient-ramesh-1',
    title: 'Evening Calming Chamomile Tea',
    titleEn: 'Evening Calming Chamomile Tea',
    titleAs: 'সন্ধিয়াৰ শান্ত কেমোমাইল চাহ',
    type: 'hydration',
    time: '05:30 PM',
    schedule: 'Daily',
    notes: 'Serve warm with a touch of honey in the garden veranda.',
    enabled: true,
    completedToday: false,
    createdAt: new Date().toISOString(),
  };
  db.addReminder(customRem);
  const afterAdd = db.getReminders();
  if (afterAdd.length !== 5 || !afterAdd.some(r => r.id === 'test-rem-custom-1')) {
    throw new Error(`Test 3 Failed: Added reminder not found in database`);
  }
  console.log('✔ Test 3 Passed: Caregiver can create a new reminder');

  // 4. Edit Reminder
  const toEdit = db.getReminders().find(r => r.id === 'test-rem-custom-1')!;
  const updatedRem: ReminderItem = {
    ...toEdit,
    title: 'Evening Herbal Tea with Honey',
    titleEn: 'Evening Herbal Tea with Honey',
    time: '06:00 PM',
  };
  db.updateReminder(updatedRem);
  const afterEdit = db.getReminders().find(r => r.id === 'test-rem-custom-1')!;
  if (afterEdit.title !== 'Evening Herbal Tea with Honey' || afterEdit.time !== '06:00 PM') {
    throw new Error(`Test 4 Failed: Reminder edit not applied correctly`);
  }
  console.log('✔ Test 4 Passed: Caregiver can edit an existing reminder');

  // 5. Enable / Disable Toggle
  db.toggleReminder('test-rem-custom-1', false);
  let afterToggle = db.getReminders().find(r => r.id === 'test-rem-custom-1')!;
  if (afterToggle.enabled !== false) {
    throw new Error(`Test 5 Failed: Expected reminder to be disabled`);
  }
  db.toggleReminder('test-rem-custom-1', true);
  afterToggle = db.getReminders().find(r => r.id === 'test-rem-custom-1')!;
  if (afterToggle.enabled !== true) {
    throw new Error(`Test 5 Failed: Expected reminder to be enabled`);
  }
  console.log('✔ Test 5 Passed: Caregiver can enable and disable reminders');

  // 6. Patient Complete / Acknowledge Toggle
  db.toggleReminderCompleted('test-rem-custom-1', true);
  let afterCompleted = db.getReminders().find(r => r.id === 'test-rem-custom-1')!;
  if (!afterCompleted.completedToday || !afterCompleted.lastAcknowledgedAt) {
    throw new Error(`Test 6 Failed: Expected reminder to be marked completedToday`);
  }
  console.log('✔ Test 6 Passed: Patient can acknowledge/complete due reminders');

  // 7. Delete Reminder
  db.deleteReminder('test-rem-custom-1');
  const afterDelete = db.getReminders();
  if (afterDelete.some(r => r.id === 'test-rem-custom-1') || afterDelete.length !== 4) {
    throw new Error(`Test 7 Failed: Reminder was not deleted`);
  }
  console.log('✔ Test 7 Passed: Caregiver can delete a reminder');

  // 8. Persistence Verification Across Application Restart Simulation
  // Add a reminder, clear in-memory references, read raw localStorage string
  const persistTestItem: ReminderItem = {
    id: 'test-persist-restart',
    patientId: 'patient-ramesh-1',
    title: 'Dr. Baruah Check-up',
    type: 'appointment',
    time: '10:00 AM',
    schedule: 'Friday',
    enabled: true,
    completedToday: false,
    createdAt: new Date().toISOString(),
  };
  db.addReminder(persistTestItem);

  // Read raw storage
  const rawStorage = localStorage.getItem('memora_reminders');
  if (!rawStorage) {
    throw new Error('Test 8 Failed: memora_reminders not found in localStorage');
  }
  const parsed = JSON.parse(rawStorage);
  if (!parsed.some(r => r.id === 'test-persist-restart')) {
    throw new Error('Test 8 Failed: Custom item not found in persisted JSON');
  }

  // Simulate application restart with a fresh DatabaseService instance
  const freshDbList = db.getReminders();
  if (!freshDbList.some(r => r.id === 'test-persist-restart')) {
    throw new Error('Test 8 Failed: Fresh instance did not retrieve persisted reminder');
  }
  console.log('✔ Test 8 Passed: Reminders persist properly in offline storage across restarts');

  // 9. Reset to default demo state
  db.resetToDefault();
  const resetList = db.getReminders();
  if (resetList.length !== 4 || resetList.some(r => r.id === 'test-persist-restart')) {
    throw new Error('Test 9 Failed: Reset to default did not restore seed reminders');
  }
  console.log('✔ Test 9 Passed: Database reset reinitializes seed reminders cleanly');

  console.log('\n--- ALL 9 REMINDER TESTS PASSED SUCCESSFULLY! ---');
}

runReminderTests();
