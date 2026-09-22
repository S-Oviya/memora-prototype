import { db } from './db';
import { INITIAL_ALERTS, getAlertTitle, getAlertDescription } from './seedData';
import { evaluateCaregiverAlerts, isReminderOverdue, parseTimeToMinutes } from './alertService';
import { ReminderItem, GameAttempt, Language, CaregiverAlert } from '../types';

// Mock localStorage for Node environment test
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => storage.get(key) || null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};
(globalThis as any).window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

console.log('--- Starting Caregiver Alert System Verification Tests ---');

// 1. Verify Initial Seed Alerts & Required Types
console.log('Test 1: Verify Initial Alerts have all required types...');
const initialAlerts = db.getAlerts();
assert(initialAlerts.length >= 5, `Expected at least 5 initial alerts, got ${initialAlerts.length}`);

const typesPresent = new Set(initialAlerts.map(a => a.type));
assert(typesPresent.has('missed_medicine'), 'Must contain missed_medicine alert');
assert(typesPresent.has('missed_hydration'), 'Must contain missed_hydration alert');
assert(typesPresent.has('missed_activity'), 'Must contain missed_activity alert');
assert(typesPresent.has('missed_appointment'), 'Must contain missed_appointment alert');
assert(typesPresent.has('inactivity'), 'Must contain inactivity alert');
console.log('✓ Test 1 Passed: All 5 alert types present with valid categories.');

// 2. Verify Alert Details: Type, Patient, Relevant Activity/Reminder, Date/Time
console.log('Test 2: Verify Alert metadata fields (Patient, Item, Date/Time)...');
for (const alert of initialAlerts) {
  assert(Boolean(alert.id), 'Alert must have an id');
  assert(Boolean(alert.patientId), 'Alert must have a patientId');
  assert(Boolean(alert.patientName), 'Alert must have patientName');
  assert(Boolean(alert.relevantItemTitle), 'Alert must display relevantItemTitle');
  assert(Boolean(alert.timestamp), 'Alert must display detection timestamp');
  assert(['high', 'medium', 'low'].includes(alert.severity), 'Alert must have valid severity');
  assert(['unread', 'read', 'resolved'].includes(alert.status), 'Alert must have valid status');
}
console.log('✓ Test 2 Passed: Alert metadata strictly includes patient, relevant item, and timestamp.');

// 3. Verify Offline Persistence & Mark as Read / Resolved
console.log('Test 3: Verify Offline Persistence and Mark as Read / Resolved...');
const testAlert = initialAlerts.find(a => a.type === 'missed_medicine')!;
assert(testAlert.status === 'unread', 'Test alert should initially be unread');

// Mark as Read
db.markAlertRead(testAlert.id);
let reloaded = db.getAlerts().find(a => a.id === testAlert.id)!;
assert(reloaded.status === 'read', 'Alert status must transition to read');
assert(Boolean(reloaded.readAt), 'Alert readAt timestamp must be recorded');

// Mark as Resolved
db.markAlertResolved(testAlert.id);
reloaded = db.getAlerts().find(a => a.id === testAlert.id)!;
assert(reloaded.status === 'resolved', 'Alert status must transition to resolved');
assert(Boolean(reloaded.resolvedAt), 'Alert resolvedAt timestamp must be recorded');
console.log('✓ Test 3 Passed: Offline persistence correctly updates status to read and resolved.');

// 4. Verify Time Parsing and Overdue Evaluation
console.log('Test 4: Verify Time Parsing and Overdue Calculation...');
assert(parseTimeToMinutes('09:00 AM') === 540, '09:00 AM should be 540 minutes');
assert(parseTimeToMinutes('11:30 AM') === 690, '11:30 AM should be 690 minutes');
assert(parseTimeToMinutes('04:30 PM') === 990, '04:30 PM should be 990 minutes');

const simNow1 = new Date();
simNow1.setHours(10, 0, 0, 0); // 10:00 AM
assert(isReminderOverdue('09:00 AM', simNow1) === true, '09:00 AM should be overdue at 10:00 AM');
assert(isReminderOverdue('11:00 AM', simNow1) === false, '11:00 AM should NOT be overdue at 10:00 AM');
console.log('✓ Test 4 Passed: Time calculation properly detects when reminders are past due.');

// 5. Test Dynamic Alert Evaluation for Missed Reminders & Auto-Resolution
console.log('Test 5: Test Alert Engine Evaluation & Auto-Resolution...');
const testReminders: ReminderItem[] = [
  {
    id: 'rem-dyn-med',
    patientId: 'patient-ramesh-1',
    title: 'Donepezil Test Dose',
    type: 'medicine',
    time: '08:00 AM',
    enabled: true,
    completedToday: false,
  },
  {
    id: 'rem-dyn-water',
    patientId: 'patient-ramesh-1',
    title: 'Hydration Glass Test',
    type: 'hydration',
    time: '08:30 AM',
    enabled: true,
    completedToday: false,
  },
  {
    id: 'rem-dyn-walk',
    patientId: 'patient-ramesh-1',
    title: 'Morning Walk Test',
    type: 'activity',
    time: '07:00 AM',
    enabled: true,
    completedToday: false,
  },
  {
    id: 'rem-dyn-doc',
    patientId: 'patient-ramesh-1',
    title: 'Doctor Appointment Test',
    type: 'appointment',
    time: '08:45 AM',
    enabled: true,
    completedToday: false,
  },
];

const simNowMidday = new Date();
simNowMidday.setHours(12, 0, 0, 0); // All 4 above are overdue

const evaluated = evaluateCaregiverAlerts({
  patient: db.getPatient(),
  reminders: testReminders,
  gameAttempts: [],
  routines: [],
  existingAlerts: [],
  currentTime: simNowMidday,
});

const dynMedAlert = evaluated.find(a => a.relevantItemId === 'rem-dyn-med');
const dynWaterAlert = evaluated.find(a => a.relevantItemId === 'rem-dyn-water');
const dynWalkAlert = evaluated.find(a => a.relevantItemId === 'rem-dyn-walk');
const dynDocAlert = evaluated.find(a => a.relevantItemId === 'rem-dyn-doc');

assert(Boolean(dynMedAlert && dynMedAlert.type === 'missed_medicine' && dynMedAlert.severity === 'high'), 'Missed medicine detected with high severity');
assert(Boolean(dynWaterAlert && dynWaterAlert.type === 'missed_hydration'), 'Missed hydration detected');
assert(Boolean(dynWalkAlert && dynWalkAlert.type === 'missed_activity'), 'Missed activity detected');
assert(Boolean(dynDocAlert && dynDocAlert.type === 'missed_appointment' && dynDocAlert.severity === 'high'), 'Missed appointment detected with high severity');

// Now simulate patient marking medicine as completed
testReminders[0].completedToday = true;
const reEvaluated = evaluateCaregiverAlerts({
  patient: db.getPatient(),
  reminders: testReminders,
  gameAttempts: [],
  routines: [],
  existingAlerts: evaluated,
  currentTime: simNowMidday,
});

const resolvedMedAlert = reEvaluated.find(a => a.relevantItemId === 'rem-dyn-med')!;
assert(resolvedMedAlert.status === 'resolved', 'Completing reminder must auto-resolve corresponding missed alert');
console.log('✓ Test 5 Passed: Dynamic alert generation and auto-resolution succeed.');

// 6. Test Inactivity Detection from Activity History
console.log('Test 6: Test Significant Inactivity Detection...');
const oldAttempt: GameAttempt = {
  id: 'att-old',
  patientId: 'patient-ramesh-1',
  gameId: 'photo-puzzle',
  cognitiveSkill: 'problem_solving',
  level: 1,
  success: true,
  score: 100,
  timeTakenSeconds: 30,
  mistakesCount: 0,
  timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(), // 16 hours ago
};

const inactivityEval = evaluateCaregiverAlerts({
  patient: db.getPatient(),
  reminders: [],
  gameAttempts: [oldAttempt],
  routines: [],
  existingAlerts: [],
  currentTime: new Date(),
});

const inactAlert = inactivityEval.find(a => a.type === 'inactivity');
assert(Boolean(inactAlert), 'Inactivity alert should be generated when last attempt was 16 hours ago');
assert(inactAlert!.status === 'unread', 'Inactivity alert should be unread');

// Now simulate patient playing a game 30 minutes ago
const recentAttempt: GameAttempt = {
  ...oldAttempt,
  id: 'att-new',
  timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
};

const resolvedInactEval = evaluateCaregiverAlerts({
  patient: db.getPatient(),
  reminders: [],
  gameAttempts: [recentAttempt, oldAttempt],
  routines: [],
  existingAlerts: inactivityEval,
  currentTime: new Date(),
});

const resolvedInactAlert = resolvedInactEval.find(a => a.type === 'inactivity');
assert(resolvedInactAlert!.status === 'resolved', 'Inactivity alert should auto-resolve when patient becomes active');
console.log('✓ Test 6 Passed: Significant inactivity detection and resolution succeed.');

// 7. Test Multilingual Localization across all 9 Regional Languages
console.log('Test 7: Verify Localization across all 9 languages...');
const languages: Language[] = ['en', 'as', 'bn', 'ne', 'lus', 'kha', 'ny', 'trp', 'mni'];

for (const lang of languages) {
  for (const alert of initialAlerts) {
    const title = getAlertTitle(alert, lang);
    const desc = getAlertDescription(alert, lang);
    assert(Boolean(title && title.trim().length > 0), `Title for alert ${alert.id} in lang ${lang} must not be empty`);
    assert(Boolean(desc && desc.trim().length > 0), `Description for alert ${alert.id} in lang ${lang} must not be empty`);
  }
}
console.log('✓ Test 7 Passed: 100% localization coverage across English, Assamese, Bengali, Nepali, Mizo, Khasi, Nyishi, Kokborok, and Manipuri.');

// 8. Test Toggle Reminder Integration in DatabaseService
console.log('Test 8: Verify db.toggleReminderCompleted resolves matching alert...');
const rems = db.getReminders();
const medRem = rems.find(r => r.type === 'medicine')!;

// Ensure alert for this reminder is unread
const currentAlerts = db.getAlerts().map(a => {
  if (a.relevantItemId === medRem.id) {
    return { ...a, status: 'unread' as const, resolvedAt: undefined };
  }
  return a;
});
db.saveAlerts(currentAlerts);

// Now mark reminder completed
db.toggleReminderCompleted(medRem.id, true);
const alertAfterDone = db.getAlerts().find(a => a.relevantItemId === medRem.id)!;
assert(alertAfterDone.status === 'resolved', 'Calling toggleReminderCompleted must mark linked alert as resolved');
console.log('✓ Test 8 Passed: Reminder completion directly links to alert resolution.');

console.log('====================================================');
console.log('ALL 8 CAREGIVER ALERT SYSTEM TESTS PASSED SUCCESSFULLY!');
console.log('====================================================');
