import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';
import { AccessibleButton } from '../common/AccessibleButton';

interface OddOneOutGameProps {
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

interface Item {
  id: string;
  nameEn: string;
  nameAs: string;
  icon: string;
  category: string;
}

interface PuzzleSet {
  items: Item[];
  oddItemId: string;
  explanationEn: string;
  explanationAs: string;
}

const PUZZLE_SETS: Record<number, PuzzleSet[]> = {
  1: [
    {
      items: [
        { id: 'apple', nameEn: 'Apple', nameAs: 'আপেল', icon: '🍎', category: 'fruit' },
        { id: 'banana', nameEn: 'Banana', nameAs: 'কল', icon: '🍌', category: 'fruit' },
        { id: 'spoon', nameEn: 'Spoon', nameAs: 'চামুচ', icon: '🥄', category: 'utensil' },
      ],
      oddItemId: 'spoon',
      explanationEn: 'The spoon is an eating utensil, while the others are sweet fruits.',
      explanationAs: 'চামুচখন খাদ্য খোৱা সঁজুলি, কিন্তু বাকী দুটা খাবলৈ সোৱাদ ফল।',
    },
    {
      items: [
        { id: 'cup', nameEn: 'Tea Cup', nameAs: 'চাহৰ কাপ', icon: '☕', category: 'tea' },
        { id: 'teapot', nameEn: 'Teapot', nameAs: 'চাহৰ চচপেন', icon: '🫖', category: 'tea' },
        { id: 'shoe', nameEn: 'Shoe', nameAs: 'জোতা', icon: '👞', category: 'footwear' },
      ],
      oddItemId: 'shoe',
      explanationEn: 'Shoes are for walking, while the cup and teapot are for warm tea.',
      explanationAs: 'জোতা পিন্ধিবলৈ ব্যৱহাৰ হয়, চাহৰ কাপ আৰু চচপেন পুৱাৰ চাহৰ বাবে।',
    },
  ],
  2: [
    {
      items: [
        { id: 'tea', nameEn: 'Assam Tea', nameAs: 'অসম চাহ', icon: '🍵', category: 'hot_drink' },
        { id: 'coffee', nameEn: 'Hot Coffee', nameAs: 'গৰম কফি', icon: '☕', category: 'hot_drink' },
        { id: 'icecream', nameEn: 'Ice Cream', nameAs: 'আইচক্ৰীম', icon: '🍦', category: 'cold_dessert' },
      ],
      oddItemId: 'icecream',
      explanationEn: 'Ice cream is a cold dessert, while tea and coffee are hot drinks.',
      explanationAs: 'আইচক্ৰীম ঠাণ্ডা খাদ্য, কিন্তু চাহ আৰু কফি গৰম পানীয়।',
    },
    {
      items: [
        { id: 'shirt', nameEn: 'Shirt', nameAs: 'চোলা', icon: '👔', category: 'top' },
        { id: 'kurta', nameEn: 'Kurta', nameAs: 'কুৰ্তা', icon: '👕', category: 'top' },
        { id: 'shoe', nameEn: 'Shoe', nameAs: 'জোতা', icon: '👞', category: 'footwear' },
      ],
      oddItemId: 'shoe',
      explanationEn: 'Shoes are footwear for walking, while the others are shirts worn on the upper body.',
      explanationAs: 'জোতা ভৰিত পিন্ধা হয়, বাকীবোৰ গাৰ চোলা।',
    },
  ],
  3: [
    {
      items: [
        { id: 'rose', nameEn: 'Rose Flower', nameAs: 'গোলাপ ফুল', icon: '🌹', category: 'flower' },
        { id: 'lotus', nameEn: 'Lotus Flower', nameAs: 'পদুম ফুল', icon: '🪷', category: 'flower' },
        { id: 'marigold', nameEn: 'Marigold', nameAs: 'গেন্ধেলাই ফুল', icon: '🌼', category: 'flower' },
        { id: 'chair', nameEn: 'Chair', nameAs: 'চকী', icon: '🪑', category: 'furniture' },
      ],
      oddItemId: 'chair',
      explanationEn: 'The chair is furniture, while the others are garden flowers.',
      explanationAs: 'চকীখন বহাৰ আচবাব, বাকীবোৰ ফুলনিৰ ধুনীয়া ফুল।',
    },
    {
      items: [
        { id: 'shirt', nameEn: 'Kurta / Shirt', nameAs: 'চোলা', icon: '👔', category: 'clothing' },
        { id: 'gamosa', nameEn: 'Assamese Gamosa', nameAs: 'গামোচা', icon: '🧣', category: 'clothing' },
        { id: 'cap', nameEn: 'Winter Cap', nameAs: 'টুপী', icon: '🧢', category: 'clothing' },
        { id: 'plate', nameEn: 'Dinner Plate', nameAs: 'কাঁহী', icon: '🍽️', category: 'utensil' },
      ],
      oddItemId: 'plate',
      explanationEn: 'The plate is for eating, while the others are clothes.',
      explanationAs: 'কাঁহীখন ভাত খাবলৈ ব্যৱহাৰ হয়, বাকীবোৰ পিন্ধা কাপোৰ।',
    },
  ],
  4: [
    {
      items: [
        { id: 'flute', nameEn: 'Bamboo Flute', nameAs: 'বাঁহী', icon: '🪈', category: 'music' },
        { id: 'dhol', nameEn: 'Dhol Drum', nameAs: 'ঢোল', icon: '🥁', category: 'music' },
        { id: 'pepa', nameEn: 'Hornpipe / Pepa', nameAs: 'পেঁপা', icon: '🎺', category: 'music' },
        { id: 'bell', nameEn: 'Temple Bell', nameAs: 'ঘণ্টা', icon: '🔔', category: 'music' },
        { id: 'umbrella', nameEn: 'Umbrella', nameAs: 'ছাটি', icon: '☂️', category: 'rainwear' },
      ],
      oddItemId: 'umbrella',
      explanationEn: 'The umbrella shields from rain, while the others are musical instruments.',
      explanationAs: 'ছাতি বৰষুণৰ পৰা ৰক্ষা কৰে, বাকীবোৰ আনন্দৰ বাদ্যযন্ত্ৰ।',
    },
  ],
  5: [
    {
      items: [
        { id: 'bed', nameEn: 'Bed', nameAs: 'বিচনা', icon: '🛏️', category: 'bedroom' },
        { id: 'pillow', nameEn: 'Pillow', nameAs: 'গাৰু', icon: '🛌', category: 'bedroom' },
        { id: 'blanket', nameEn: 'Warm Blanket', nameAs: 'কম্বল', icon: '🧶', category: 'bedroom' },
        { id: 'alarm', nameEn: 'Clock', nameAs: 'ঘড়ী', icon: '⏰', category: 'bedroom' },
        { id: 'spade', nameEn: 'Garden Spade', nameAs: 'কোৰ', icon: '🪴', category: 'outdoor' },
      ],
      oddItemId: 'spade',
      explanationEn: 'The garden spade is for outdoor soil, while the others belong in a restful bedroom.',
      explanationAs: 'কোৰ ফুলনিত মাটি খান্দিবলৈ লাগে, বাকীবোৰ জিৰণি লোৱা কোঠাৰ সামগ্ৰী।',
    },
    {
      items: [
        { id: 'guitar', nameEn: 'Guitar', nameAs: 'গীটাৰ', icon: '🎸', category: 'string_instrument' },
        { id: 'violin', nameEn: 'Violin', nameAs: 'বেহেলা', icon: '🎻', category: 'string_instrument' },
        { id: 'sitar', nameEn: 'Sitar', nameAs: 'চেতাৰ', icon: '🪕', category: 'string_instrument' },
        { id: 'ektara', nameEn: 'Dotara / Ektara', nameAs: 'দোতাৰা', icon: '🪕', category: 'string_instrument' },
        { id: 'flute', nameEn: 'Bamboo Flute', nameAs: 'বাঁহী', icon: '🪈', category: 'wind_instrument' },
      ],
      oddItemId: 'flute',
      explanationEn: 'The bamboo flute is a wind instrument played by breath, while all the others are string instruments.',
      explanationAs: 'বাঁহী ফুঁ দি বজোৱা বাদ্যযন্ত্ৰ, বাকীবোৰ তাঁৰৰ বাদ্যযন্ত্ৰ।',
    },
  ],
};

export const OddOneOutGame: React.FC<OddOneOutGameProps> = ({
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { t, language } = useLanguage();
  const [level, setLevel] = useState<number>(Math.min(5, Math.max(1, initialLevel)));
  const [currentSet, setCurrentSet] = useState<PuzzleSet>(() => PUZZLE_SETS[1][0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  const loadPuzzle = (lvl: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setSelectedId(null);
    setIsCorrect(null);
    setShowFeedbackModal(false);

    const availableSets = PUZZLE_SETS[lvl] || PUZZLE_SETS[1];
    const picked = availableSets[Math.floor(Math.random() * availableSets.length)];
    // Shuffle items so odd item is not in predictable position
    const shuffledItems = [...picked.items].sort(() => Math.random() - 0.5);
    setCurrentSet({ ...picked, items: shuffledItems });

    // Voice instruction
    const promptText = t.games.oddOneOut.autoVoicePrompt;
    audioService.speakText(promptText, language);
  };

  useEffect(() => {
    setLevel(Math.min(5, Math.max(1, initialLevel)));
  }, [initialLevel]);

  useEffect(() => {
    loadPuzzle(level);
  }, [level, language]);

  const handleItemClick = async (item: Item) => {
    if (isCorrect) return; // Already completed

    audioService.playTapSound();
    setSelectedId(item.id);

    if (item.id === currentSet.oddItemId) {
      // Correct!
      setIsCorrect(true);
      const timeTaken = Math.max(3, Math.round((Date.now() - startTimeRef.current) / 1000));
      const score = Math.max(60, 100 - mistakesCountRef.current * 12);

      const attemptPayload = {
        patientId: 'patient-ramesh-1',
        gameId: 'odd-one-out' as const,
        cognitiveSkill: 'categorization' as const,
        level,
        success: true,
        score,
        timeTakenSeconds: timeTaken,
        mistakesCount: mistakesCountRef.current,
      };

      // 1. Save to local database
      db.recordGameAttempt(attemptPayload);

      // 2. Asynchronously notify backend
      api.recordGameAttempt(attemptPayload).catch(() => {});

      audioService.playSuccessChime();
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1000);
    } else {
      // Gentle encouragement, no harsh buzzer
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
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-sage-200 text-sage-800 font-bold hover:bg-sage-50 transition shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 text-sage-700" />
          <span className="text-base">{t.common.back}</span>
        </button>

        {/* Level Indicator Badge */}
        <div className="flex items-center gap-2 bg-amber-100 text-amber-900 border-2 border-amber-300 px-4 py-1.5 rounded-full font-black text-sm">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <span>{t.patient.level} {level}</span>
        </div>
      </div>

      {/* Dementia-Friendly Instruction Banner */}
      <div className="w-full bg-white rounded-3xl p-5 sm:p-6 border-3 border-sage-200 shadow-md mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-sage-950 mb-2">
          {t.games.oddOneOut.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-700 font-medium">
          {t.games.oddOneOut.instruction}
        </p>
      </div>

      {/* Items Grid */}
      <div className={`w-full grid gap-4 sm:gap-6 ${
        currentSet.items.length <= 3
          ? 'grid-cols-1 sm:grid-cols-3'
          : currentSet.items.length === 4
          ? 'grid-cols-2 sm:grid-cols-2'
          : 'grid-cols-2 sm:grid-cols-3'
      } mb-6`}>
        {currentSet.items.map((item) => {
          const isSelected = selectedId === item.id;
          const isSuccess = isSelected && isCorrect === true;
          const isWrong = isSelected && isCorrect === false;

          let cardStyle = 'bg-white border-sage-200 hover:border-sage-400 hover:shadow-lg text-gray-900';
          if (isSuccess) {
            cardStyle = 'bg-emerald-100 border-emerald-500 shadow-xl ring-4 ring-emerald-300 scale-105';
          } else if (isWrong) {
            cardStyle = 'bg-rose-50 border-rose-300 shadow-md';
          }

          const itemName = language === 'as' ? item.nameAs : item.nameEn;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border-4 transition-all duration-200 active:scale-95 select-none ${cardStyle}`}
            >
              <span className="text-6xl sm:text-7xl mb-3 drop-shadow-sm filter">
                {item.icon}
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-center">
                {itemName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gentle Hint Prompt */}
      <div className="w-full flex justify-center mb-4">
        <button
          onClick={() => audioService.speakText(t.games.oddOneOut.autoVoicePrompt, language)}
          className="inline-flex items-center gap-2 text-sage-800 bg-sage-50 hover:bg-sage-100 px-4 py-2 rounded-2xl border border-sage-300 font-bold text-sm shadow-xs transition"
        >
          <span>🔊</span>
          <span>{t.patient.listenAgain}</span>
        </button>
      </div>


      {/* Success Celebration Feedback Modal */}
      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={(t.games as any).oddOneOut?.title || 'Odd One Out'}
        customMessage={language === 'as' ? currentSet.explanationAs : currentSet.explanationEn}
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
