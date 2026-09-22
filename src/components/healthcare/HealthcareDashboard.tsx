import React, { useState } from 'react';
import {
  Stethoscope,
  BarChart3,
  Calendar,
  Bell,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  Pill,
  Droplets,
  Activity as ActivityIcon,
  ShieldCheck,
  Eye,
  Info,
  Play,
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import {
  Patient,
  GameAttempt,
  ReminderItem,
  CaregiverAlert,
  GameId,
  CognitiveSkillId,
  ReminderType,
} from '../../types';
import { PatientOverviewTab } from '../caregiver/PatientOverviewTab';
import { getReminderTitle, getReminderNotes, getAlertTitle, getAlertDescription } from '../../services/seedData';

type HealthcareTabId = 'overview' | 'activity' | 'adherence' | 'alerts';

interface HealthcareDashboardProps {
  patient: Patient;
  gameAttempts: GameAttempt[];
  reminders: ReminderItem[];
  alerts: CaregiverAlert[];
  onSwitchToPatient: () => void;
}

export const HealthcareDashboard: React.FC<HealthcareDashboardProps> = ({
  patient,
  gameAttempts,
  reminders,
  alerts,
  onSwitchToPatient,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<HealthcareTabId>('overview');

  const tabsConfig = [
    {
      id: 'overview' as HealthcareTabId,
      label: language === 'as' ? 'সামগ্ৰিক অগ্ৰগতি' : 'Progress & Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'activity' as HealthcareTabId,
      label: language === 'as' ? 'কাৰ্যকলাপৰ ইতিহাস' : 'Game & Activity History',
      icon: <History className="w-4 h-4" />,
      badge: gameAttempts.length,
    },
    {
      id: 'adherence' as HealthcareTabId,
      label: language === 'as' ? 'নিয়ম আৰু ঔষধ পালন' : 'Care & Routine Adherence',
      icon: <Calendar className="w-4 h-4" />,
      badge: reminders.filter((r) => r.completedToday).length,
    },
    {
      id: 'alerts' as HealthcareTabId,
      label: language === 'as' ? 'ঘটনাবলী আৰু সতৰ্কতা' : 'Alert & Event History',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: alerts.filter((a) => a.status !== 'resolved').length,
    },
  ];

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case 'medicine':
        return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'hydration':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'appointment':
        return <Stethoscope className="w-4 h-4 text-purple-600" />;
      case 'activity':
      default:
        return <ActivityIcon className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Healthcare Worker Observational Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-teal-950 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-xl border-2 border-teal-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-700/60 border border-teal-500/30 flex items-center justify-center text-teal-200 shadow-inner flex-shrink-0">
            <Stethoscope className="w-7 h-7 text-teal-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {language === 'as' ? 'স্বাস্থ্যকৰ্মী পৰ্যবেক্ষণ পোৰ্টেল' : 'Healthcare Worker Portal'}
              </h1>
              <span className="bg-teal-600/60 text-teal-100 text-xs font-bold px-2.5 py-0.5 rounded-full border border-teal-400/30 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {language === 'as' ? 'কেৱল পঢ়িব পৰা অধিকাৰ' : 'Read-Only Mode'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-1">
              {language === 'as'
                ? `ৰোগী: ${patient.name} (${patient.age} বছৰ, ${patient.dementiaStage})`
                : `Patient: ${patient.name} (${patient.age} yrs, ${patient.dementiaStage} stage)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={onSwitchToPatient}
            className="flex items-center gap-1.5 bg-teal-700/80 hover:bg-teal-700 text-teal-50 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-teal-500/40 transition"
          >
            <Play className="w-4 h-4 fill-teal-100" />
            <span>{t.app.switchToPatient}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 border-2 ${
                isActive
                  ? 'bg-teal-700 text-white border-teal-800 shadow-sm'
                  : 'bg-white text-gray-700 border-teal-100 hover:border-teal-300 hover:bg-teal-50/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-black leading-none ${
                    isActive ? 'bg-white text-teal-800' : 'bg-teal-600 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Cognitive Analytics */}
      {activeTab === 'overview' && (
        <PatientOverviewTab
          patient={patient}
          attempts={gameAttempts}
          reminders={reminders}
          alerts={alerts}
          onSwitchToPatient={onSwitchToPatient}
          // Intentionally omitted alert mutation handlers so healthcare worker view is strictly read-only
          onMarkAlertRead={undefined}
          onMarkAlertResolved={undefined}
        />
      )}

      {/* Tab 2: Activity & Game History Log */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-teal-600" />
                  {language === 'as' ? 'সম্পূৰ্ণ কাৰ্যকলাপৰ ইতিহাস' : 'Detailed Activity Log'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'as'
                    ? 'ৰোগীয়ে খেলি থকা খেল আৰু মানসিক কাৰ্যকলাপৰ অভিলেখ'
                    : 'Log of cognitive game sessions, engagement scores, and completion metrics'}
                </p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                {gameAttempts.length} {language === 'as' ? 'অভিলেখ' : 'Sessions Recorded'}
              </span>
            </div>

            {gameAttempts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-40 text-teal-600" />
                <p className="text-sm font-medium">
                  {language === 'as' ? 'কোনো কাৰ্যকলাপ পোৱা নগল।' : 'No activity sessions recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {gameAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-teal-50/30 px-3 rounded-2xl transition"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm flex-shrink-0">
                        {attempt.score}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-gray-900 capitalize">
                            {attempt.gameId.replace(/-/g, ' ')}
                          </h4>
                          <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            Level {attempt.level}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(attempt.timestamp).toLocaleString(language === 'as' ? 'as' : 'en', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-600 pl-13 sm:pl-0">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{attempt.timeTakenSeconds}s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{language === 'as' ? 'ভুল' : 'Mistakes'}: {attempt.mistakesCount}</span>
                      </div>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          attempt.success
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {attempt.success
                          ? language === 'as'
                            ? 'সফল'
                            : 'Completed'
                          : language === 'as'
                          ? 'সহায় লাগিছে'
                          : 'Assisted'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Care & Routine Adherence */}
      {activeTab === 'adherence' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-600" />
                  {language === 'as' ? 'দৈনন্দিন নিয়ম আৰু ঔষধ পালন' : 'Daily Routine & Reminder Adherence'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'as'
                    ? 'যত্নশীলৰ দ্বাৰা নিৰ্ধাৰিত ঔষধ, জলপান আৰু স্বাস্থ্য সূচীৰ নিৰীক্ষণ'
                    : 'Observational overview of caregiver-configured reminders and today’s completion status'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.map((r) => {
                const title = getReminderTitle(r, language);
                const notes = getReminderNotes(r, language);
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border-2 transition ${
                      r.completedToday
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                          {getReminderIcon(r.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {r.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {r.time} • {r.schedule || 'Daily'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          r.completedToday
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {r.completedToday ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            {language === 'as' ? 'সম্পূৰ্ণ' : 'Done Today'}
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-gray-400" />
                            {language === 'as' ? 'বাকী আছে' : 'Pending'}
                          </>
                        )}
                      </span>
                    </div>

                    {notes && (
                      <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl mt-3 border border-gray-100">
                        {notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Alert & Event History */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-100 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-teal-600" />
                  {language === 'as' ? 'ঘটনাবলী আৰু সতৰ্কতাৰ ইতিহাস' : 'Alert & Caregiver Event History'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'as'
                    ? 'সময়মতে নোখোৱা ঔষধ, জলপান আৰু নিষ্ক্ৰিয়তাৰ সতৰ্কবাৰ্তা'
                    : 'Chronological history of missed routines, hydration alerts, and inactivity events'}
                </p>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40 text-emerald-600" />
                <p className="text-sm font-medium">
                  {language === 'as' ? 'কোনো সতৰ্কতা পোৱা নগল।' : 'No alerts recorded. Adherence is on track.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {alerts.map((a) => {
                  const title = getAlertTitle(a, language);
                  const desc = getAlertDescription(a, language);
                  return (
                    <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            a.severity === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : a.severity === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {a.type.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                a.status === 'resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : a.status === 'read'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{desc}</p>
                          <p className="text-[11px] text-gray-400 mt-1">
                            {new Date(a.timestamp).toLocaleString(language === 'as' ? 'as' : 'en', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                            {a.dueTime && ` • Due: ${a.dueTime}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-Clinical Observational Guidance Disclaimer */}
      <div className="mt-8 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-start gap-3 text-teal-900 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">
            {language === 'as' ? 'অনা-চিকিৎসা পৰ্যবেক্ষণ তথ্য: ' : 'Observational Caregiver Guidance Notice: '}
          </span>
          {language === 'as'
            ? 'মেমোৰাৰ কাৰ্যকলাপ পৰ্যবেক্ষণ আৰু মানসিক ব্যস্ততাৰ সূচকবোৰ কেৱল ঘৰুৱা সহায় আৰু স্মৃতি উদ্দীপনাৰ বাবে। এইবোৰে কোনো চিকিৎসাজনিত নিদান, ৰোগৰ পৰীক্ষা বা ঔষধৰ নিৰ্দেশনা নিদিয়ে।'
            : 'Memora’s activity performance and cognitive indicators are designed exclusively for daily observational guidance, routine tracking, and non-clinical memory stimulation. They do not constitute a medical diagnosis, clinical evaluation, or treatment prescription.'}
        </div>
      </div>
    </div>
  );
};
