import React from 'react';
import { Sparkles, Play, Star, Bell, Pill, Droplets, Stethoscope, Activity as ActivityIcon, CheckCircle2, Clock, Heart, Check } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { Patient, GameId, ReminderItem, ReminderType } from '../../types';
import { getReminderTitle, getReminderNotes } from '../../services/seedData';
import { AccessibleButton } from '../common/AccessibleButton';

interface PatientHomeProps {
  patient: Patient;
  reminders?: ReminderItem[];
  onToggleReminderCompleted?: (id: string) => void;
  onSelectGame: (gameId: GameId) => void;
  recommendedGame: GameId;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  patient,
  reminders = [],
  onToggleReminderCompleted,
  onSelectGame,
  recommendedGame,
}) => {
  const { t, language } = useLanguage();

  // Get gentle time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.patient.greetingMorning;
    if (hour < 17) return t.patient.greetingAfternoon;
    return t.patient.greetingEvening;
  };

  const gamesConfig = [
    {
      id: 'photo-puzzle' as GameId,
      title: t.games.puzzle.title,
      desc: t.games.puzzle.desc,
      icon: '🧩',
      bgColor: 'bg-emerald-50 border-emerald-300 hover:border-emerald-500',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'familiar-faces' as GameId,
      title: t.games.faces.title,
      desc: t.games.faces.desc,
      icon: '🌸',
      bgColor: 'bg-rose-50 border-rose-300 hover:border-rose-500',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'familiar-voices' as GameId,
      title: t.games.voices.title,
      desc: t.games.voices.desc,
      icon: '🎵',
      bgColor: 'bg-amber-50 border-amber-300 hover:border-amber-500',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'routine-recall' as GameId,
      title: t.games.routine.title,
      desc: t.games.routine.desc,
      icon: '📅',
      bgColor: 'bg-sky-50 border-sky-300 hover:border-sky-500',
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      id: 'odd-one-out' as GameId,
      title: (t.games as any).oddOneOut?.title || 'Odd One Out',
      desc: (t.games as any).oddOneOut?.desc || 'Find the object that does not belong.',
      icon: '🔍',
      bgColor: 'bg-purple-50 border-purple-300 hover:border-purple-500',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'shape-fit' as GameId,
      title: (t.games as any).shapeFit?.title || 'Shape Fit',
      desc: (t.games as any).shapeFit?.desc || 'Match shapes into their outlines.',
      icon: '⭐',
      bgColor: 'bg-teal-50 border-teal-300 hover:border-teal-500',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
    {
      id: 'matching-family' as GameId,
      title: (t.games as any).matchingFamily?.title || 'Family Pairs',
      desc: (t.games as any).matchingFamily?.desc || 'Connect family members with their names.',
      icon: '👨‍👩‍👧',
      bgColor: 'bg-indigo-50 border-indigo-300 hover:border-indigo-500',
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
  ];

  const recommendedInfo = gamesConfig.find((g) => g.id === recommendedGame) || gamesConfig[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 flex flex-col items-center">
      {/* Warm Personalized Greeting */}
      <div className="w-full text-center mb-8 bg-gradient-to-b from-white to-warm-50 p-6 sm:p-8 rounded-3xl border-3 border-sage-200 shadow-md">
        <p className="text-xl sm:text-2xl font-bold text-sage-700 mb-1">
          {getGreeting()},
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-sage-950 mb-3 tracking-tight">
          {patient.name}
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 font-medium">
          {t.patient.welcomeSub}
        </p>
      </div>

      {/* Gentle Due/Upcoming Reminders Section for Senior Patient */}
      {reminders.filter((r) => r.enabled).length > 0 && (
        <div className="w-full mb-8">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-3 border-sage-200 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-sage-700" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-sage-950">
                    {t.patient.reminders.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    {t.patient.reminders.subtitle}
                  </p>
                </div>
              </div>

              {reminders.filter((r) => r.enabled && r.completedToday).length ===
                reminders.filter((r) => r.enabled).length && (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.patient.reminders.completed}</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              {reminders
                .filter((r) => r.enabled)
                .map((rem) => {
                  const title = getReminderTitle(rem, language);
                  const notes = getReminderNotes(rem, language);

                  const getPatientIcon = (type: ReminderType) => {
                    switch (type) {
                      case 'medicine':
                        return <Pill className="w-6 h-6 text-rose-600" />;
                      case 'hydration':
                        return <Droplets className="w-6 h-6 text-sky-600" />;
                      case 'activity':
                        return <ActivityIcon className="w-6 h-6 text-emerald-600" />;
                      case 'appointment':
                        return <Stethoscope className="w-6 h-6 text-indigo-600" />;
                    }
                  };

                  const getCardBg = (type: ReminderType, completed?: boolean) => {
                    if (completed) return 'bg-emerald-50/50 border-emerald-200';
                    switch (type) {
                      case 'medicine':
                        return 'bg-rose-50/40 border-rose-200';
                      case 'hydration':
                        return 'bg-sky-50/40 border-sky-200';
                      case 'activity':
                        return 'bg-emerald-50/40 border-emerald-200';
                      case 'appointment':
                        return 'bg-indigo-50/40 border-indigo-200';
                    }
                  };

                  return (
                    <div
                      key={rem.id}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${getCardBg(
                        rem.type,
                        rem.completedToday
                      )}`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center flex-shrink-0 border border-gray-100">
                          {getPatientIcon(rem.type)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-white/80 px-2.5 py-0.5 rounded-md border border-gray-200">
                              <Clock className="w-3 h-3 text-sage-600" />
                              <span>{rem.time}</span>
                            </span>
                            {rem.schedule && (
                              <span className="text-[11px] font-semibold text-gray-500">
                                • {rem.schedule}
                              </span>
                            )}
                          </div>

                          <h4 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
                            {title}
                          </h4>

                          {notes && (
                            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5 leading-relaxed">
                              {notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tactile Large Tap Target for Senior Acknowledgment */}
                      <button
                        onClick={() => onToggleReminderCompleted?.(rem.id)}
                        className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-black text-sm sm:text-base transition-all select-none shadow-xs active:scale-95 flex-shrink-0 ${
                          rem.completedToday
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            : 'bg-sage-600 text-white hover:bg-sage-700 shadow-sm'
                        }`}
                      >
                        {rem.completedToday ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>{t.patient.reminders.completed}</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            <span>{t.patient.reminders.markDone}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Featured / Recommended Activity Hero Card */}
      <div className="w-full mb-8">
        <div className="relative bg-gradient-to-br from-sage-600 to-sage-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl border-4 border-sage-500 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {/* Recommended badge */}
          <div className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-950 font-black px-3.5 py-1.5 rounded-full text-sm sm:text-base mb-4 shadow-md">
            <Star className="w-4 h-4 fill-amber-950" />
            <span>{t.patient.recommendedBadge}</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl sm:text-6xl flex-shrink-0 drop-shadow-md">
              {recommendedInfo.icon}
            </span>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-1">
                {recommendedInfo.title}
              </h2>
              <p className="text-base sm:text-lg text-sage-100 font-medium leading-snug">
                {recommendedInfo.desc}
              </p>
            </div>
          </div>

          <AccessibleButton
            variant="accent"
            size="xl"
            icon={<Play className="w-7 h-7 fill-white" />}
            onClick={() => onSelectGame(recommendedInfo.id)}
            className="w-full text-xl py-5"
          >
            {t.patient.playNow}
          </AccessibleButton>
        </div>
      </div>

      {/* All 4 Games Grid */}
      <div className="w-full">
        <h3 className="text-2xl font-black text-gray-900 mb-4 px-1 flex items-center gap-2">
          <span>🎯</span> {t.patient.chooseGame}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {gamesConfig.map((game) => {
            const isRec = game.id === recommendedGame;

            return (
              <button
                key={game.id}
                onClick={() => onSelectGame(game.id)}
                className={`flex flex-col text-left p-5 sm:p-6 rounded-3xl border-4 transition-all duration-200 active:scale-95 shadow-md hover:shadow-xl select-none ${game.bgColor} relative overflow-hidden`}
              >
                {isRec && (
                  <div className="absolute top-3 right-3 text-amber-500">
                    <Star className="w-6 h-6 fill-amber-400" />
                  </div>
                )}

                <div className="text-4xl sm:text-5xl mb-3 drop-shadow-sm">
                  {game.icon}
                </div>

                <h4 className="text-2xl font-black text-gray-950 mb-1.5">
                  {game.title}
                </h4>

                <p className="text-base text-gray-600 font-medium leading-relaxed">
                  {game.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
