import React from 'react';
import { TrendingUp, CheckCircle, Clock, Calendar, Sparkles, Award, ArrowUpRight, BarChart2, Brain, ShieldAlert, Target, Bell, Pill, Droplets, Stethoscope, Activity as ActivityIcon, ChevronRight, AlertTriangle, Eye } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { GameAttempt, Patient, GameId, CognitiveSkillId, GAME_COGNITIVE_SKILL_MAP, ReminderItem, ReminderType, CaregiverAlert } from '../../types';
import { AdaptiveDifficultyEngine } from '../../services/adaptiveEngine';
import { getReminderTitle, getReminderNotes, getAlertTitle, getAlertDescription } from '../../services/seedData';

interface PatientOverviewTabProps {
  patient: Patient;
  attempts: GameAttempt[];
  reminders?: ReminderItem[];
  alerts?: CaregiverAlert[];
  onMarkAlertRead?: (id: string) => void;
  onMarkAlertResolved?: (id: string) => void;
  onSwitchToPatient: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const PatientOverviewTab: React.FC<PatientOverviewTabProps> = ({
  patient,
  attempts,
  reminders = [],
  alerts = [],
  onMarkAlertRead,
  onMarkAlertResolved,
  onSwitchToPatient,
  onNavigateTab,
}) => {
  const { t, language } = useLanguage();

  const totalAttempts = attempts.length;
  const successfulAttempts = attempts.filter((a) => a.success).length;
  const successRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0;
  const avgTime =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.timeTakenSeconds, 0) / totalAttempts)
      : 0;

  // Active days count
  const uniqueDays = new Set(
    attempts.map((a) => new Date(a.timestamp).toISOString().split('T')[0])
  ).size;

  // Adaptive engine report
  const adaptiveProfile = AdaptiveDifficultyEngine.evaluate(attempts);

  // Group attempts by game
  const gamesMap: Record<GameId, { name: string; attempts: GameAttempt[] }> = {
    'photo-puzzle': { name: t.games.puzzle.title, attempts: [] },
    'familiar-faces': { name: t.games.faces.title, attempts: [] },
    'familiar-voices': { name: t.games.voices.title, attempts: [] },
    'routine-recall': { name: t.games.routine.title, attempts: [] },
    'odd-one-out': { name: (t.games as any).oddOneOut?.title || 'Odd One Out', attempts: [] },
    'shape-fit': { name: (t.games as any).shapeFit?.title || 'Shape Fit', attempts: [] },
    'matching-family': { name: (t.games as any).matchingFamily?.title || 'Family Match', attempts: [] },
  };

  attempts.forEach((a) => {
    if (gamesMap[a.gameId]) {
      gamesMap[a.gameId].attempts.push(a);
    }
  });

  const getGameBadge = (gameId: GameId) => {
    switch (gameId) {
      case 'photo-puzzle':
        return { icon: '🧩', bg: 'bg-emerald-100 text-emerald-800' };
      case 'familiar-faces':
        return { icon: '🌸', bg: 'bg-rose-100 text-rose-800' };
      case 'familiar-voices':
        return { icon: '🎵', bg: 'bg-amber-100 text-amber-800' };
      case 'routine-recall':
        return { icon: '📅', bg: 'bg-sky-100 text-sky-800' };
      case 'odd-one-out':
        return { icon: '🔍', bg: 'bg-purple-100 text-purple-800' };
      case 'shape-fit':
        return { icon: '⭐', bg: 'bg-teal-100 text-teal-800' };
      case 'matching-family':
      default:
        return { icon: '👨‍👩‍👧', bg: 'bg-indigo-100 text-indigo-800' };
    }
  };

  // 6 Cognitive Skills calculation (non-medical performance indicators)
  const skillTypes: CognitiveSkillId[] = [
    'recall',
    'recognition',
    'associative_memory',
    'problem_solving',
    'categorization',
    'visual_spatial',
  ];

  const getSkillTitle = (skill: CognitiveSkillId) => {
    switch (skill) {
      case 'recall': return t.cognitiveSkills?.recall || 'Recall';
      case 'recognition': return t.cognitiveSkills?.recognition || 'Recognition';
      case 'associative_memory': return t.cognitiveSkills?.associativeMemory || 'Associative Memory';
      case 'problem_solving': return t.cognitiveSkills?.problemSolving || 'Problem-solving';
      case 'categorization': return t.cognitiveSkills?.categorization || 'Categorization';
      case 'visual_spatial': return t.cognitiveSkills?.visualSpatial || 'Visual-spatial';
    }
  };

  const getSkillIcon = (skill: CognitiveSkillId) => {
    switch (skill) {
      case 'recall': return '🧠';
      case 'recognition': return '🌸';
      case 'associative_memory': return '🔗';
      case 'problem_solving': return '🧩';
      case 'categorization': return '🔍';
      case 'visual_spatial': return '📐';
    }
  };

  const skillMetrics = skillTypes.map((skill) => {
    const matching = attempts.filter(
      (a) => a.cognitiveSkill === skill || (!a.cognitiveSkill && GAME_COGNITIVE_SKILL_MAP[a.gameId] === skill)
    );
    const total = matching.length;
    const wins = matching.filter((a) => a.success).length;
    const rate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { skill, total, wins, rate };
  });

  const practicedSkills = skillMetrics.filter((s) => s.total > 0);
  const strongestSkill = practicedSkills.length > 0
    ? [...practicedSkills].sort((a, b) => b.rate - a.rate || b.total - a.total)[0]
    : null;
  const practiceAreaSkill = practicedSkills.length > 0
    ? [...practicedSkills].sort((a, b) => a.rate - b.rate || a.total - b.total)[0]
    : null;

  // Recent 5 attempts
  const recentAttempts = [...attempts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Action Card */}
      <div className="bg-gradient-to-r from-sage-700 to-sage-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-sage-100">
            {language === 'as' ? 'ৰোগীৰ পৰ্যবেক্ষণ' : 'Patient Monitored'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2">{patient.name}</h2>
          <p className="text-sage-100 text-sm mt-1">
            {patient.age} {language === 'as' ? 'বছৰ' : 'years'} • {patient.dementiaType} •{' '}
            <span className="capitalize font-semibold">{patient.dementiaStage}</span>
          </p>
        </div>

        <button
          onClick={onSwitchToPatient}
          className="bg-white text-sage-900 hover:bg-sage-50 font-bold px-5 py-3 rounded-2xl shadow-md transition flex items-center gap-2 text-sm sm:text-base flex-shrink-0"
        >
          <span>{t.app.switchToPatient}</span>
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>

      {/* Prominent Caregiver Alerts Banner */}
      {alerts.length > 0 && (
        <div
          className={`rounded-3xl p-5 sm:p-6 border-2 transition-all shadow-sm ${
            alerts.some((a) => a.status !== 'resolved')
              ? 'bg-rose-50/40 border-rose-200'
              : 'bg-emerald-50/40 border-emerald-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                  alerts.some((a) => a.status !== 'resolved')
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {alerts.some((a) => a.status !== 'resolved') ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-gray-900">
                    {t.caregiver.alerts.bannerTitle}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      alerts.filter((a) => a.status !== 'resolved').length > 0
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {alerts.filter((a) => a.status !== 'resolved').length}{' '}
                    {t.caregiver.alerts.unread}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {t.caregiver.alerts.bannerSubtitle}
                </p>
              </div>
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('alerts')}
                className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white border border-sage-200 text-sage-800 font-bold text-xs sm:text-sm hover:bg-sage-50 transition flex items-center gap-1.5 shadow-xs"
              >
                <span>{t.caregiver.alerts.viewAllAlerts}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Alert Cards List (Top 3 Unresolved or Recent) */}
          <div className="space-y-2.5">
            {alerts
              .filter((a) => a.status !== 'resolved')
              .slice(0, 3)
              .map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                      {alert.type === 'missed_medicine' && <Pill className="w-4 h-4" />}
                      {alert.type === 'missed_hydration' && <Droplets className="w-4 h-4" />}
                      {alert.type === 'missed_activity' && <ActivityIcon className="w-4 h-4" />}
                      {alert.type === 'missed_appointment' && <Stethoscope className="w-4 h-4" />}
                      {alert.type === 'inactivity' && <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">
                          {getAlertTitle(alert, language)}
                        </span>
                        {alert.dueTime && (
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                            {alert.dueTime}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <span className="font-semibold text-gray-700">{alert.relevantItemTitle}</span>
                        {' • '}
                        <span>{getAlertDescription(alert, language)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    {onMarkAlertResolved && (
                      <button
                        onClick={() => onMarkAlertResolved(alert.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{t.caregiver.alerts.markAsResolved}</span>
                      </button>
                    )}
                    {alert.status === 'unread' && onMarkAlertRead && (
                      <button
                        onClick={() => onMarkAlertRead(alert.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200 transition flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t.caregiver.alerts.markAsRead}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {alerts.filter((a) => a.status !== 'resolved').length === 0 && (
              <div className="bg-white p-4 rounded-2xl border border-emerald-200 text-center text-sm font-medium text-emerald-800">
                {t.caregiver.alerts.emptyUnresolved}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Games Played */}
        <div className="bg-white p-5 rounded-3xl border-2 border-sage-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sage-100 text-sage-700 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {t.caregiver.stats.gamesPlayed}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            {totalAttempts}
          </p>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-5 rounded-3xl border-2 border-sage-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {t.caregiver.stats.overallSuccessRate}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {totalAttempts > 0 ? `${successRate}%` : '—'}
          </p>
        </div>

        {/* Active Days */}
        <div className="bg-white p-5 rounded-3xl border-2 border-sage-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {t.caregiver.stats.activeStreak}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            {totalAttempts > 0 ? `${uniqueDays} ${language === 'as' ? 'দিন' : 'Days'}` : `0 ${language === 'as' ? 'দিন' : 'Days'}`}
          </p>
        </div>

        {/* Average Time */}
        <div className="bg-white p-5 rounded-3xl border-2 border-sage-100 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {t.caregiver.stats.averageTime}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            {totalAttempts > 0 ? `${avgTime}s` : '—'}
          </p>
        </div>
      </div>

      {/* Adaptive Rule-Based Intelligence Report Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-extrabold text-amber-950">
              {t.caregiver.stats.adaptiveRecommendation}
            </h3>
            <p className="text-sm font-medium text-amber-900 mt-1 leading-relaxed">
              {language === 'as' ? adaptiveProfile.reasonAs : adaptiveProfile.reasonEn}
            </p>

            {/* Level allocations per game */}
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(adaptiveProfile.recommendedLevels).map(([gameId, lvl]) => {
                const info = gamesMap[gameId as GameId];
                return (
                  <span
                    key={gameId}
                    className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl text-xs font-bold text-gray-800 border border-amber-300 shadow-xs"
                  >
                    <span>{info.name}:</span>
                    <span className="text-amber-700 font-extrabold">
                      {t.patient.level} {lvl}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Care Reminders Widget (Caregiver Dashboard Overview) */}
      <div className="bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">
                {t.caregiver.reminders.upcomingTitle}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {reminders.filter((r) => r.enabled).length} {t.caregiver.reminders.active}
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('reminders')}
              className="inline-flex items-center gap-1.5 text-xs font-black text-sage-700 hover:text-sage-900 bg-sage-50 hover:bg-sage-100 px-3.5 py-2 rounded-xl border border-sage-200 transition"
            >
              <span>{t.caregiver.reminders.manageReminders}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {reminders.filter((r) => r.enabled).length === 0 ? (
          <div className="p-6 rounded-2xl bg-warm-50/50 border border-dashed border-gray-300 text-center">
            <p className="text-sm text-gray-500 font-medium mb-3">
              {t.caregiver.reminders.emptyList}
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('reminders')}
                className="inline-flex items-center gap-1 text-xs font-bold text-sage-800 bg-white px-3 py-1.5 rounded-xl border border-sage-300 hover:bg-sage-50 transition shadow-xs"
              >
                <span>{t.caregiver.reminders.addItem}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {reminders
              .filter((r) => r.enabled)
              .slice(0, 4)
              .map((rem) => {
                const title = getReminderTitle(rem, language);
                const notes = getReminderNotes(rem, language);

                const getIcon = (type: ReminderType) => {
                  switch (type) {
                    case 'medicine':
                      return <Pill className="w-4 h-4 text-rose-600" />;
                    case 'hydration':
                      return <Droplets className="w-4 h-4 text-sky-600" />;
                    case 'activity':
                      return <ActivityIcon className="w-4 h-4 text-emerald-600" />;
                    case 'appointment':
                      return <Stethoscope className="w-4 h-4 text-indigo-600" />;
                  }
                };

                const getStyle = (type: ReminderType) => {
                  switch (type) {
                    case 'medicine':
                      return 'border-rose-200 bg-rose-50/30';
                    case 'hydration':
                      return 'border-sky-200 bg-sky-50/30';
                    case 'activity':
                      return 'border-emerald-200 bg-emerald-50/30';
                    case 'appointment':
                      return 'border-indigo-200 bg-indigo-50/30';
                  }
                };

                return (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-2xl border ${getStyle(
                      rem.type
                    )} flex flex-col justify-between hover:shadow-xs transition`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-gray-600">
                          {getIcon(rem.type)}
                          <span>{t.caregiver.reminders.types[rem.type] || rem.type}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                          <Clock className="w-3 h-3 text-sage-600" />
                          <span>{rem.time}</span>
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-gray-900 leading-snug line-clamp-2 mb-1">
                        {title}
                      </h4>

                      {notes && (
                        <p className="text-[11px] text-gray-500 font-medium line-clamp-2">
                          {notes}
                        </p>
                      )}
                    </div>

                    {rem.schedule && (
                      <div className="pt-2 mt-2 border-t border-gray-200/50 flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                        <span className="truncate">{rem.schedule}</span>
                        {rem.completedToday && (
                          <span className="text-emerald-700 font-black flex items-center gap-0.5 flex-shrink-0">
                            <CheckCircle className="w-3 h-3" />
                            <span>{t.patient.reminders.completed}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Cognitive Activity Performance (Non-Medical Activity Performance Indicators) */}
      <div className="bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">
                {t.cognitiveSkills?.title || 'Cognitive Activity Performance'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {language === 'as' ? '৬টা কাৰ্য্যকলাপ ভিত্তিক সূচক' : '6 activity-based engagement indicators'}
              </p>
            </div>
          </div>

          {/* Quick Badges: Strongest & Practice */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {strongestSkill && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.cognitiveSkills?.strongestArea || 'Strongest Area'}: {getSkillTitle(strongestSkill.skill)}</span>
              </span>
            )}
            {practiceAreaSkill && practiceAreaSkill.skill !== strongestSkill?.skill && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-bold">
                <Target className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.cognitiveSkills?.practiceArea || 'Practice Area'}: {getSkillTitle(practiceAreaSkill.skill)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Non-Medical Disclaimer Banner */}
        <div className="mb-5 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600 font-medium">
          <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>
            {t.cognitiveSkills?.disclaimer ||
              'Activity performance indicators reflect engagement and are not clinical or medical measurements.'}
          </span>
        </div>

        {/* 6 Cognitive Skill Indicators Grid */}
        {totalAttempts === 0 ? (
          <div className="p-8 text-center bg-warm-50/50 rounded-2xl border border-dashed border-warm-200">
            <p className="text-sm font-semibold text-gray-500">
              {language === 'as'
                ? 'এতিয়ালৈকে কোনো খেল খেলা হোৱা নাই। জ্ঞানমূলক কাৰ্য্যকলাপ সম্পন্ন কৰাৰ পাছত সূচকসমূহ প্ৰদৰ্শিত হ’ব।'
                : 'No games played yet. Activity indicators will appear after completing cognitive exercises.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {skillMetrics.map((sm) => {
              const isTop = strongestSkill?.skill === sm.skill;
              const isNeedsPractice = practiceAreaSkill?.skill === sm.skill && sm.rate < 70;

              return (
                <div
                  key={sm.skill}
                  className={`p-4 rounded-2xl border transition-all ${
                    isTop
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : isNeedsPractice
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-warm-50/40 border-warm-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getSkillIcon(sm.skill)}</span>
                      <span className="font-bold text-gray-900 text-sm">{getSkillTitle(sm.skill)}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {sm.total} {language === 'as' ? 'বাৰ' : 'sessions'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        sm.rate >= 80 ? 'bg-emerald-600' : sm.rate >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${sm.total > 0 ? sm.rate : 0}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-medium text-gray-600">
                    <span>{language === 'as' ? 'সফলতা' : 'Accuracy'}</span>
                    <span className="font-bold text-gray-900">
                      {sm.total > 0 ? `${sm.rate}%` : (language === 'as' ? 'অপ্ৰশিক্ষিত' : 'Not yet tested')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress Breakdown by Game */}
      <div className="bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-sage-600" />
          {t.caregiver.stats.performanceByGame}
        </h3>

        {totalAttempts === 0 ? (
          <div className="p-8 text-center bg-warm-50/50 rounded-2xl border border-dashed border-warm-200">
            <p className="text-sm font-semibold text-gray-500">
              {language === 'as' ? 'এতিয়ালৈকে কোনো খেল খেলা হোৱা নাই।' : 'No games played yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(gamesMap) as GameId[]).map((gId) => {
              const gameData = gamesMap[gId];
              const count = gameData.attempts.length;
              const wins = gameData.attempts.filter((a) => a.success).length;
              const rate = count > 0 ? Math.round((wins / count) * 100) : 0;
              const badge = getGameBadge(gId);

              return (
                <div key={gId} className="p-4 rounded-2xl bg-warm-50 border border-warm-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <span className="font-bold text-gray-900 text-base">{gameData.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      {count} {language === 'as' ? 'বাৰ' : 'plays'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-sage-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${rate}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-semibold text-gray-600">
                    <span>{language === 'as' ? 'সফলতাৰ হাৰ' : 'Accuracy'}</span>
                    <span className="text-sage-800 font-bold">{count > 0 ? `${rate}%` : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-4">
          {t.caregiver.stats.recentSessions}
        </h3>

        {recentAttempts.length === 0 ? (
          <div className="p-8 text-center bg-warm-50/50 rounded-2xl border border-dashed border-warm-200">
            <p className="text-sm font-semibold text-gray-500">
              {language === 'as'
                ? 'এতিয়ালৈকে কোনো খেল খেলা হোৱা নাই। অনুৰোধ কৰা খেলৰ ফলাফলসমূহ ইয়াত দেখা যাব।'
                : 'No games played yet. Recorded sessions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-bold">
                  <th className="pb-3 px-2">{language === 'as' ? 'খেল' : 'Activity'}</th>
                  <th className="pb-3 px-2">{t.patient.level}</th>
                  <th className="pb-3 px-2">{language === 'as' ? 'ফলাফল' : 'Result'}</th>
                  <th className="pb-3 px-2">{language === 'as' ? 'সময়' : 'Duration'}</th>
                  <th className="pb-3 px-2">{language === 'as' ? 'তাৰিখ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAttempts.map((att) => {
                  const badge = getGameBadge(att.gameId);
                  const gameName = gamesMap[att.gameId]?.name || att.gameId;
                  const dateStr = new Date(att.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={att.id} className="hover:bg-warm-50/50">
                      <td className="py-3.5 px-2 font-bold text-gray-900 flex items-center gap-2">
                        <span>{badge.icon}</span>
                        <span>{gameName}</span>
                      </td>
                      <td className="py-3.5 px-2 font-semibold text-gray-700">
                        {t.patient.level} {att.level}
                      </td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              att.success ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {att.success ? (language === 'as' ? 'সফল' : 'Success') : (language === 'as' ? 'সহায় দিয়া হ’ল' : 'Assisted')}
                          </span>
                          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                            {att.score}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-gray-600 font-medium">
                        {att.timeTakenSeconds}s
                      </td>
                      <td className="py-3.5 px-2 text-gray-500 text-xs">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
