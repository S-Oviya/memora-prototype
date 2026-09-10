import React from 'react';
import { TrendingUp, CheckCircle, Clock, Calendar, Sparkles, Award, ArrowUpRight, BarChart2 } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { GameAttempt, Patient, GameId } from '../../types';
import { AdaptiveDifficultyEngine } from '../../services/adaptiveEngine';

interface PatientOverviewTabProps {
  patient: Patient;
  attempts: GameAttempt[];
  onSwitchToPatient: () => void;
}

export const PatientOverviewTab: React.FC<PatientOverviewTabProps> = ({
  patient,
  attempts,
  onSwitchToPatient,
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
    }
  };

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
            {successRate}%
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
            {uniqueDays} {language === 'as' ? 'দিন' : 'Days'}
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
            {avgTime}s
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

      {/* Progress Breakdown by Game */}
      <div className="bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-sage-600" />
          {t.caregiver.stats.performanceByGame}
        </h3>

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
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-4">
          {t.caregiver.stats.recentSessions}
        </h3>

        {recentAttempts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            {t.caregiver.stats.noDataYet}
          </p>
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
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                            att.success ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {att.success ? (language === 'as' ? 'সফল' : 'Success') : (language === 'as' ? 'সহায় দিয়া হ’ল' : 'Assisted')}
                        </span>
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
