import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';

interface ShapeFitGameProps {
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

interface ShapeItem {
  id: string;
  nameEn: string;
  nameAs: string;
  symbol: string;
  color: string;
  borderColor: string;
  svgPath: string;
}

const ALL_SHAPES: ShapeItem[] = [
  {
    id: 'circle',
    nameEn: 'Circle',
    nameAs: 'বৃত্ত (ঘূৰণীয়া)',
    symbol: '⚪',
    color: '#3B82F6',
    borderColor: '#1D4ED8',
    svgPath: 'M 50 10 A 40 40 0 1 1 49.9 10 Z',
  },
  {
    id: 'square',
    nameEn: 'Square',
    nameAs: 'বৰ্গ (চাৰিকোণীয়া)',
    symbol: '🟦',
    color: '#10B981',
    borderColor: '#047857',
    svgPath: 'M 15 15 L 85 15 L 85 85 L 15 85 Z',
  },
  {
    id: 'triangle',
    nameEn: 'Triangle',
    nameAs: 'ত্ৰিভুজ (তিনিbaাহু)',
    symbol: '🔺',
    color: '#F59E0B',
    borderColor: '#B45309',
    svgPath: 'M 50 12 L 90 85 L 10 85 Z',
  },
  {
    id: 'star',
    nameEn: 'Star',
    nameAs: 'তৰা',
    symbol: '⭐',
    color: '#8B5CF6',
    borderColor: '#6D28D9',
    svgPath: 'M 50 5 L 61 38 L 95 38 L 68 58 L 78 92 L 50 72 L 22 92 L 32 58 L 5 38 L 39 38 Z',
  },
  {
    id: 'diamond',
    nameEn: 'Diamond',
    nameAs: 'হীৰা (ৰম্বাচ)',
    symbol: '🔶',
    color: '#EC4899',
    borderColor: '#BE185D',
    svgPath: 'M 50 10 L 90 50 L 50 90 L 10 50 Z',
  },
  {
    id: 'hexagon',
    nameEn: 'Hexagon',
    nameAs: 'ষড়ভুজ (ছয়কোণীয়া)',
    symbol: '🔷',
    color: '#06B6D4',
    borderColor: '#0E7490',
    svgPath: 'M 25 15 L 75 15 L 95 50 L 75 85 L 25 85 L 5 50 Z',
  },
];

export const ShapeFitGame: React.FC<ShapeFitGameProps> = ({
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { t, language } = useLanguage();
  const [level, setLevel] = useState<number>(Math.min(5, Math.max(1, initialLevel)));
  const [targetShape, setTargetShape] = useState<ShapeItem>(ALL_SHAPES[0]);
  const [choices, setChoices] = useState<ShapeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  const setupRound = (lvl: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setSelectedId(null);
    setIsCorrect(null);
    setShowFeedbackModal(false);

    // Number of available choices based on level
    const count = lvl === 1 ? 3 : lvl === 2 ? 4 : lvl === 3 ? 4 : lvl === 4 ? 5 : 6;
    const pool = ALL_SHAPES.slice(0, Math.max(count, 3));
    const target = pool[Math.floor(Math.random() * pool.length)];
    setTargetShape(target);

    // Shuffle choices
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setChoices(shuffled);

    audioService.speakText(t.games.shapeFit.autoVoicePrompt, language);
  };

  useEffect(() => {
    setupRound(level);
  }, [level, language]);

  const handleChoice = (shape: ShapeItem) => {
    if (isCorrect) return;

    audioService.playTapSound();
    setSelectedId(shape.id);

    if (shape.id === targetShape.id) {
      // Correct!
      setIsCorrect(true);
      const timeTaken = Math.max(3, Math.round((Date.now() - startTimeRef.current) / 1000));
      const score = Math.max(60, 100 - mistakesCountRef.current * 12);

      const payload = {
        patientId: 'patient-ramesh-1',
        gameId: 'shape-fit' as const,
        cognitiveSkill: 'visual_spatial' as const,
        level,
        success: true,
        score,
        timeTakenSeconds: timeTaken,
        mistakesCount: mistakesCountRef.current,
      };

      db.recordGameAttempt(payload);
      api.recordGameAttempt(payload).catch(() => {});

      audioService.playSuccessChime();
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1000);
    } else {
      mistakesCountRef.current += 1;
      setIsCorrect(false);
      audioService.playEncourageSound();
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedId(null);
      }, 900);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-sage-200 text-sage-800 font-bold hover:bg-sage-50 transition shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 text-sage-700" />
          <span className="text-base">{t.common.back}</span>
        </button>

        <div className="flex items-center gap-2 bg-purple-100 text-purple-900 border-2 border-purple-300 px-4 py-1.5 rounded-full font-black text-sm">
          <Sparkles className="w-4 h-4 text-purple-700" />
          <span>{t.patient.level} {level}</span>
        </div>
      </div>

      {/* Target Outline Slot Card */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border-4 border-dashed border-sage-300 shadow-md mb-8 flex flex-col items-center justify-center">
        <span className="text-xs font-bold text-sage-600 uppercase tracking-widest mb-3 bg-sage-50 px-3 py-1 rounded-full border border-sage-200">
          {t.games.shapeFit.instruction}
        </span>

        {/* SVG Slot Outline */}
        <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-3xl flex items-center justify-center transition-all duration-300 ${
          isCorrect ? 'bg-emerald-50 scale-105 border-4 border-emerald-400' : 'bg-warm-50/70 border-3 border-dashed border-gray-400'
        }`}>
          <svg viewBox="0 0 100 100" className="w-28 h-28 sm:w-36 sm:h-36">
            <path
              d={targetShape.svgPath}
              fill={isCorrect ? targetShape.color : 'rgba(0, 0, 0, 0.06)'}
              stroke={isCorrect ? targetShape.borderColor : '#94A3B8'}
              strokeWidth="4"
              strokeDasharray={isCorrect ? 'none' : '6, 6'}
              className="transition-all duration-500"
            />
          </svg>
        </div>

        <p className="text-xl sm:text-2xl font-black text-gray-800 mt-4 text-center">
          {language === 'as' ? targetShape.nameAs : targetShape.nameEn}
        </p>
      </div>

      {/* Choices Bar */}
      <div className="w-full">
        <h3 className="text-lg font-bold text-gray-700 mb-3 text-center">
          {t.patient.tapToChoose}
        </h3>

        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
          {choices.map((shape) => {
            const isSelected = selectedId === shape.id;
            const isMatch = isSelected && isCorrect === true;
            const isWrong = isSelected && isCorrect === false;

            let borderStyle = 'border-sage-200 hover:border-sage-400 bg-white';
            if (isMatch) borderStyle = 'border-emerald-500 bg-emerald-100 ring-4 ring-emerald-300';
            else if (isWrong) borderStyle = 'border-rose-300 bg-rose-50';

            return (
              <button
                key={shape.id}
                onClick={() => handleChoice(shape)}
                className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl border-3 shadow-md hover:shadow-xl transition-all duration-200 active:scale-90 ${borderStyle}`}
              >
                <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-20 sm:h-20 mb-2">
                  <path
                    d={shape.svgPath}
                    fill={shape.color}
                    stroke={shape.borderColor}
                    strokeWidth="3"
                  />
                </svg>
                <span className="text-sm sm:text-base font-bold text-gray-800 text-center line-clamp-1">
                  {language === 'as' ? shape.nameAs.split(' ')[0] : shape.nameEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Prompt Repeat Button */}
      <div className="w-full flex justify-center mt-6">
        <button
          onClick={() => audioService.speakText(t.games.shapeFit.autoVoicePrompt, language)}
          className="inline-flex items-center gap-2 text-sage-800 bg-sage-50 hover:bg-sage-100 px-4 py-2 rounded-2xl border border-sage-300 font-bold text-sm shadow-xs transition"
        >
          <span>🔊</span>
          <span>{t.patient.listenAgain}</span>
        </button>
      </div>

      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={(t.games as any).shapeFit?.title || 'Shape Fit'}
        customMessage={(t.games as any).shapeFit?.correctMessage}
        onPlayNext={() => {
          setShowFeedbackModal(false);
          onPlayNext();
        }}
        onBackHome={() => {
          setShowFeedbackModal(false);
          onBack();
        }}
      />
    </div>
  );
};
