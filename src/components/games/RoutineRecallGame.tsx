import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle2, Clock, Coffee, Sparkles, Sun, Moon, Utensils, Heart } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { RoutineItem } from '../../types';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';
import { INITIAL_ROUTINES, getRoutineItemTitle } from '../../services/seedData';

interface RoutineRecallGameProps {
  routines: RoutineItem[];
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

export const RoutineRecallGame: React.FC<RoutineRecallGameProps> = ({
  routines,
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { t, language, format } = useLanguage();
  const [level, setLevel] = useState<number>(Math.max(1, Math.min(5, initialLevel)));
  const [nextLevel, setNextLevel] = useState<number>(() => Math.max(1, Math.min(5, initialLevel)));
  const [isLevel5Passed, setIsLevel5Passed] = useState<boolean>(false);

  // Challenge items to be arranged in chronological order
  const [targetItems, setTargetItems] = useState<RoutineItem[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<RoutineItem[]>([]);
  const [placedItems, setPlacedItems] = useState<RoutineItem[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Performance tracking
  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  const startRound = (targetLevel: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setPlacedItems([]);
    setIsCompleted(false);
    setShowFeedbackModal(false);

    const currentLvl = Math.max(1, Math.min(5, targetLevel));
    // Number of sequence items: Level 1: 2, Level 2: 3, Level 3: 4, Level 4: 5, Level 5: 6
    const targetCount = currentLvl === 1 ? 2 : currentLvl === 2 ? 3 : currentLvl === 3 ? 4 : currentLvl === 4 ? 5 : 6;

    // Build comprehensive pool of at least 6 routines
    const allRoutines = [...routines];
    for (const initR of INITIAL_ROUTINES) {
      if (!allRoutines.some((r) => r.id === initR.id) && allRoutines.length < 6) {
        allRoutines.push(initR);
      }
    }

    if (allRoutines.length < 2) return;

    const sorted = [...allRoutines].sort((a, b) => a.order - b.order);

    let selected: RoutineItem[] = [];
    if (currentLvl === 1) {
      // Pick 2 items with clear time difference
      selected = [sorted[0], sorted[Math.min(sorted.length - 1, 3)]];
    } else if (currentLvl === 2) {
      // Pick 3 items across the day
      selected = [
        sorted[0],
        sorted[Math.floor(sorted.length / 2)],
        sorted[sorted.length - 1],
      ];
    } else {
      // Level 3: 4 items, Level 4: 5 items, Level 5: 6 items
      selected = sorted.slice(0, targetCount);
    }

    setTargetItems(selected);

    // Shuffle options so patient places them in chronological order
    const shuffled = [...selected].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);

    const voicePrompt = t.games.routine.autoVoicePrompt;
    audioService.speakText(voicePrompt, language);
  };

  useEffect(() => {
    const clamped = Math.max(1, Math.min(5, initialLevel));
    setLevel(clamped);
    setNextLevel(clamped);
    setIsLevel5Passed(false);
  }, [initialLevel]);

  useEffect(() => {
    startRound(level);
  }, [level, routines, language]);

  const handleSelectOption = (item: RoutineItem) => {
    if (isCompleted) return;

    audioService.playTapSound();

    const nextIndex = placedItems.length;
    const expectedItem = targetItems[nextIndex];

    if (item.id === expectedItem.id) {
      // Correct sequence choice!
      const newPlaced = [...placedItems, item];
      setPlacedItems(newPlaced);
      setShuffledOptions(prev => prev.filter(i => i.id !== item.id));

      if (newPlaced.length === targetItems.length) {
        // Complete!
        setIsCompleted(true);
        const timeTaken = Math.max(4, Math.round((Date.now() - startTimeRef.current) / 1000));
        const score = Math.max(60, 100 - mistakesCountRef.current * 10);

        const payload = {
          patientId: item.patientId || 'patient-ramesh-1',
          gameId: 'routine-recall' as const,
          cognitiveSkill: 'recall' as const,
          level,
          success: true,
          score,
          timeTakenSeconds: timeTaken,
          mistakesCount: mistakesCountRef.current,
        };
        db.recordGameAttempt(payload);
        api.recordGameAttempt(payload).catch(() => {});

        // Evaluate progression: pass moves up a level (max 5), struggle/fail moves down (min 1)
        const isPass = payload.success && payload.mistakesCount <= 2 && payload.score >= 70;
        const computedNext = isPass ? Math.min(5, level + 1) : Math.max(1, level - 1);
        setNextLevel(computedNext);
        setIsLevel5Passed(isPass && level >= 5);

        audioService.playSuccessChime();
        setTimeout(() => {
          setShowFeedbackModal(true);
        }, 1100);
      } else {
        audioService.playEncourageSound();
      }
    } else {
      // Gentle hint, no buzzer
      mistakesCountRef.current += 1;
      audioService.playEncourageSound();
    }
  };

  const handleResetPlacement = () => {
    audioService.playTapSound();
    setPlacedItems([]);
    setShuffledOptions([...targetItems].sort(() => Math.random() - 0.5));
  };

  const getPeriodBadge = (period: string) => {
    const periods = t.caregiver.routine.periods;
    switch (period) {
      case 'morning':
        return {
          icon: <Sun className="w-4 h-4 text-amber-500" />,
          label: periods.morning || 'Morning',
          bg: 'bg-amber-100 text-amber-800',
        };
      case 'afternoon':
        return {
          icon: <Sun className="w-4 h-4 text-orange-500" />,
          label: periods.afternoon || 'Afternoon',
          bg: 'bg-orange-100 text-orange-800',
        };
      case 'evening':
        return {
          icon: <Moon className="w-4 h-4 text-indigo-500" />,
          label: periods.evening || 'Evening',
          bg: 'bg-indigo-100 text-indigo-800',
        };
      case 'night':
        return {
          icon: <Moon className="w-4 h-4 text-purple-500" />,
          label: periods.night || 'Night',
          bg: 'bg-purple-100 text-purple-800',
        };
      default:
        return {
          icon: <Sun className="w-4 h-4 text-sage-600" />,
          label: t.caregiver.tabs.routine || 'Daily',
          bg: 'bg-sage-100 text-sage-800',
        };
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-sage-200 text-sage-800 font-bold hover:bg-sage-50 transition shadow-sm"
        >
          <ArrowLeft className="w-6 h-6 text-sage-700" />
          <span className="text-base">{t.common.back}</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-sage-900 flex items-center gap-2">
          <span>📅</span> {t.games.routine.title}
        </h1>

        <button
          onClick={() => startRound(level)}
          className="p-2.5 rounded-2xl bg-white border-2 border-warm-200 text-warm-800 hover:bg-warm-50 transition shadow-sm"
          title="Restart"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Dementia Instruction */}
      <div className="w-full bg-sage-50 border-3 border-sage-300 rounded-3xl p-5 mb-5 text-center shadow-sm">
        <p className="text-sm font-bold text-sage-700 uppercase tracking-wider mb-1">
          {t.games.routine.instruction}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-sage-950 leading-tight">
          {t.games.routine.autoVoicePrompt}
        </h2>
      </div>

      {/* Target Slots: First, Then, Later */}
      <div className="w-full mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
          {t.games.routine.instruction}
        </p>

        <div className="flex flex-col gap-3">
          {targetItems.map((_, index) => {
            const placed = placedItems[index];
            const stepLabels: Record<number, string> = {
              0: t.games.routine.step1 || 'First',
              1: t.games.routine.step2 || 'Then',
              2: t.games.routine.step3 || 'Third',
              3: (t.games.routine as any).step4 || 'Fourth',
              4: (t.games.routine as any).step5 || 'Fifth',
              5: (t.games.routine as any).step6 || 'Sixth',
            };
            const stepLabel = stepLabels[index] || `${t.patient.level || 'Step'} ${index + 1}`;

            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border-3 transition-all ${
                  placed
                    ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                    : 'bg-warm-50 border-dashed border-warm-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 ${
                    placed ? 'bg-emerald-600 text-white' : 'bg-warm-200 text-gray-600'
                  }`}
                >
                  {index + 1}
                </div>

                {placed ? (
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        {getRoutineItemTitle(placed, language)}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {placed.time}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  </div>
                ) : (
                  <div className="text-gray-400 font-semibold text-base">
                    {index > 0 && placedItems[index - 1]
                      ? format(t.games.routine.questionWhatNext, {
                          current: getRoutineItemTitle(placedItems[index - 1], language),
                        })
                      : format(t.games.routine.questionWhatNext, { current: stepLabel })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Choices To Tap */}
      {shuffledOptions.length > 0 && (
        <div className="w-full mb-6">
          <p className="text-sm font-bold text-sage-800 mb-3 text-center">
            {t.games.routine.tapToPlace}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shuffledOptions.map((item) => {
              const badge = getPeriodBadge(item.period);
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectOption(item)}
                  className="flex flex-col text-left bg-white p-4 rounded-2xl border-3 border-sage-200 hover:border-sage-500 hover:shadow-lg transition active:scale-95 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.time}
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
                    {getRoutineItemTitle(item, language)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}


      {/* Celebration Feedback Modal */}
      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={t.games.routine.title}
        customMessage={t.games.routine.correctMessage}
        nextButtonText={isLevel5Passed ? t.patient.playNextGame : `${t.patient.level} ${nextLevel}`}
        onPlayNext={() => {
          setShowFeedbackModal(false);
          if (isLevel5Passed) {
            onPlayNext();
          } else {
            setLevel(nextLevel);
            startRound(nextLevel);
          }
        }}
        onBackHome={() => {
          setShowFeedbackModal(false);
          onBack();
        }}
      />
    </div>
  );
};
