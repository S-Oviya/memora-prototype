import React from 'react';
import { Sparkles, Play, Star } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { Patient, GameId } from '../../types';
import { AccessibleButton } from '../common/AccessibleButton';

interface PatientHomeProps {
  patient: Patient;
  onSelectGame: (gameId: GameId) => void;
  recommendedGame: GameId;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  patient,
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
