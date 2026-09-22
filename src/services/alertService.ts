import { Patient, ReminderItem, GameAttempt, RoutineItem, CaregiverAlert, CaregiverAlertType, AlertSeverity } from '../types';

interface EvaluationContext {
  patient: Patient;
  reminders: ReminderItem[];
  gameAttempts: GameAttempt[];
  routines: RoutineItem[];
  existingAlerts: CaregiverAlert[];
  currentTime?: Date;
}

/**
 * Parses time strings such as "09:00 AM" into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

/**
 * Returns whether a scheduled reminder time has arrived or passed for today.
 */
export function isReminderOverdue(timeStr: string, now: Date = new Date()): boolean {
  const reminderMinutes = parseTimeToMinutes(timeStr);
  if (reminderMinutes === null) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= reminderMinutes;
}

/**
 * Evaluates patient reminders, cognitive games, and routines to generate, update,
 * or resolve caregiver alerts without generating clinical diagnoses.
 */
export function evaluateCaregiverAlerts(context: EvaluationContext): CaregiverAlert[] {
  const { patient, reminders, gameAttempts, existingAlerts, currentTime = new Date() } = context;

  // Map of existing alerts by ID and by relevantItemId for quick reconciliation
  const alertsById = new Map<string, CaregiverAlert>();
  const alertsByItem = new Map<string, CaregiverAlert>();

  for (const alert of existingAlerts) {
    alertsById.set(alert.id, { ...alert });
    if (alert.relevantItemId) {
      alertsByItem.set(alert.relevantItemId, alert);
    }
  }

  // 1. Process Reminders: Medicine, Hydration, Activity, Appointment
  for (const reminder of reminders) {
    if (!reminder.enabled) {
      // If reminder was disabled, we do not raise new alerts; if an unread alert exists, we can keep or resolve
      continue;
    }

    const isOverdue = isReminderOverdue(reminder.time, currentTime);
    const existing = alertsByItem.get(reminder.id);

    // If patient marked the reminder completed today, resolve any active missed alert
    if (reminder.completedToday) {
      if (existing && existing.status !== 'resolved') {
        alertsById.set(existing.id, {
          ...existing,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
        });
      }
      continue;
    }

    // If reminder is overdue and not completed, ensure an alert exists
    if (isOverdue && !reminder.completedToday) {
      if (existing) {
        // If alert exists already, preserve user read/resolved actions unless reopened
        continue;
      }

      // Generate new alert according to reminder category
      let alertType: CaregiverAlertType = 'missed_medicine';
      let severity: AlertSeverity = 'medium';
      let titleEn = 'Missed Reminder';
      let titleAs = 'সোঁৱৰণি বাকী';
      let descEn = `Scheduled reminder for ${reminder.title} at ${reminder.time} was not confirmed.`;
      let descAs = `${reminder.titleAs || reminder.title}ৰ বাবে সময় পাৰ হ’ল, নিশ্চিত হোৱা নাই।`;

      switch (reminder.type) {
        case 'medicine':
          alertType = 'missed_medicine';
          severity = 'high';
          titleEn = `Missed Medication: ${reminder.title}`;
          titleAs = `ঔষধ খোৱা হোৱা নাই: ${reminder.titleAs || reminder.title}`;
          descEn = `Scheduled medication prompt at ${reminder.time} was not acknowledged by ${patient.name}.`;
          descAs = `ৰোগীয়ে টেবলেটত ${reminder.time} বজাৰ ঔষধৰ জাননী নিশ্চিত কৰা নাই।`;
          break;
        case 'hydration':
          alertType = 'missed_hydration';
          severity = 'medium';
          titleEn = `Hydration Reminder Overdue: ${reminder.title}`;
          titleAs = `পানী খোৱাৰ সময় পাৰ হ’ল: ${reminder.titleAs || reminder.title}`;
          descEn = `Hydration prompt at ${reminder.time} is overdue. Offer a comforting glass of water.`;
          descAs = `${reminder.time} বজাৰ পানী খোৱাৰ সোঁৱৰণি নিশ্চিত হোৱা নাই। কুহুমীয়া পানী খাবলৈ দিয়ক।`;
          break;
        case 'activity':
          alertType = 'missed_activity';
          severity = 'low';
          titleEn = `Daily Activity Pending: ${reminder.title}`;
          titleAs = `দৈনন্দিন কাৰ্যসূচী বাকী: ${reminder.titleAs || reminder.title}`;
          descEn = `Scheduled activity for ${reminder.time} has not been completed.`;
          descAs = `${reminder.time} বজাৰ কাৰ্যসূচী সম্পূৰ্ণ কৰা বুলি পঞ্জীয়ন হোৱা নাই।`;
          break;
        case 'appointment':
          alertType = 'missed_appointment';
          severity = 'high';
          titleEn = `Medical Appointment Check-in: ${reminder.title}`;
          titleAs = `চিকিৎসকৰ পৰামৰ্শৰ সময় উপস্থিত: ${reminder.titleAs || reminder.title}`;
          descEn = `Scheduled consultation at ${reminder.time} requires caregiver preparation.`;
          descAs = `${reminder.time} বজাত চিকিৎসকৰ পৰামৰ্শৰ বাবে প্ৰস্তুতি চাব লাগে।`;
          break;
      }

      const newAlert: CaregiverAlert = {
        id: `alert-gen-${reminder.id}-${Date.now().toString(36)}`,
        patientId: patient.id,
        patientName: patient.name,
        type: alertType,
        severity,
        status: 'unread',
        title: titleEn,
        titleEn,
        titleAs,
        description: descEn,
        descriptionEn: descEn,
        descriptionAs: descAs,
        relevantItemTitle: reminder.title,
        relevantItemId: reminder.id,
        dueTime: reminder.time,
        timestamp: new Date().toISOString(),
      };

      alertsById.set(newAlert.id, newAlert);
      alertsByItem.set(reminder.id, newAlert);
    }
  }

  // 2. Process Inactivity Detection from existing GameAttempt history
  const sortedAttempts = [...gameAttempts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestAttempt = sortedAttempts[0];

  const existingInactivityAlert = Array.from(alertsById.values()).find(
    (a) => a.type === 'inactivity'
  );

  const INACTIVITY_THRESHOLD_HOURS = 12;
  const nowMs = currentTime.getTime();

  if (latestAttempt) {
    const hoursSinceLastAttempt = (nowMs - new Date(latestAttempt.timestamp).getTime()) / (3600 * 1000);

    if (hoursSinceLastAttempt >= INACTIVITY_THRESHOLD_HOURS) {
      if (!existingInactivityAlert) {
        const roundedHours = Math.floor(hoursSinceLastAttempt);
        const inactAlert: CaregiverAlert = {
          id: `alert-inactivity-${Date.now().toString(36)}`,
          patientId: patient.id,
          patientName: patient.name,
          type: 'inactivity',
          severity: 'medium',
          status: 'unread',
          title: `Significant Inactivity: No Engagement in ${roundedHours} Hours`,
          titleEn: `Significant Inactivity: No Engagement in ${roundedHours} Hours`,
          titleAs: `সক্ৰিয়তাহীনতাৰ জাননী: ${roundedHours} ঘণ্টা ধৰি কোনো কাৰ্যসূচী হোৱা নাই`,
          description: `No cognitive activity or routine engagement recorded for ${patient.name} in over ${roundedHours} hours. Check in to ensure the patient is comfortable.`,
          descriptionEn: `No cognitive activity or routine engagement recorded for ${patient.name} in over ${roundedHours} hours. Check in to ensure the patient is comfortable.`,
          descriptionAs: `${patient.name}ৰ কোনো জ্ঞানমূলক খেল বা কাৰ্যসূচী পঞ্জীয়ন হোৱা নাই। অনুগ্ৰহ কৰি ৰোগীৰ খবৰ লওক।`,
          relevantItemTitle: 'Cognitive Activity & Daily Engagement',
          dueTime: 'Continuous Monitoring',
          timestamp: new Date().toISOString(),
        };
        alertsById.set(inactAlert.id, inactAlert);
      }
    } else if (hoursSinceLastAttempt <= 4 && existingInactivityAlert && existingInactivityAlert.status !== 'resolved') {
      // Patient has been active recently; auto-resolve the inactivity alert
      alertsById.set(existingInactivityAlert.id, {
        ...existingInactivityAlert,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
    }
  }

  // Return sorted alerts: Unread first, then by timestamp descending
  return Array.from(alertsById.values()).sort((a, b) => {
    if (a.status === 'unread' && b.status !== 'unread') return -1;
    if (a.status !== 'unread' && b.status === 'unread') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
