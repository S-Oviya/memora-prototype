import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { FamilyMember } from '../../types';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';

interface MatchingFamilyMembersGameProps {
  familyMembers: FamilyMember[];
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

export const MatchingFamilyMembersGame: React.FC<MatchingFamilyMembersGameProps> = ({
  familyMembers,
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { t, language } = useLanguage();
  const [level, setLevel] = useState<number>(Math.min(5, Math.max(1, initialLevel)));
  const [targetMember, setTargetMember] = useState<FamilyMember | null>(null);
  const [relationChoices, setRelationChoices] = useState<{ en: string; as: string }[]>([]);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  // Standard family relationships pool in Assam / North-East
  const ALL_RELATIONS = [
    { en: 'Daughter', as: 'জীয়াৰী (কন্যা)' },
    { en: 'Son', as: 'পুত্ৰ' },
    { en: 'Grandson', as: 'নাতি (মৰমৰ নাতি)' },
    { en: 'Wife', as: 'পত্নী' },
    { en: 'Sister', as: 'ভনী / বায়েক' },
    { en: 'Brother', as: 'ভাই / ককাই' },
    { en: 'Daughter-in-law', as: 'বোৱাৰী' },
  ];

  const setupRound = (lvl: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setSelectedRelation(null);
    setIsCorrect(null);
    setShowFeedbackModal(false);

    if (familyMembers.length === 0) return;

    // Pick target family member
    const target = familyMembers[Math.floor(Math.random() * familyMembers.length)];
    setTargetMember(target);

    // Number of choices by level: L1=2, L2=3, L3=4, L4=4, L5=4
    const numChoices = lvl === 1 ? 2 : lvl === 2 ? 3 : 4;

    const correctChoice = {
      en: target.relationship,
      as: target.relationshipAs || target.relationship,
    };

    // Filter out correct relationship from pool
    const otherChoices = ALL_RELATIONS.filter(
      (r) => r.en.toLowerCase() !== target.relationship.toLowerCase()
    ).sort(() => Math.random() - 0.5);

    const choicesPool = [correctChoice, ...otherChoices.slice(0, numChoices - 1)].sort(
      () => Math.random() - 0.5
    );

    setRelationChoices(choicesPool);

    audioService.speakText(t.games.matchingFamily.autoVoicePrompt, language);
  };

  useEffect(() => {
    setupRound(level);
  }, [level, familyMembers, language]);

  const handleSelectRelation = (choice: { en: string; as: string }) => {
    if (isCorrect || !targetMember) return;

    audioService.playTapSound();
    setSelectedRelation(choice.en);

    const isMatch = choice.en.toLowerCase() === targetMember.relationship.toLowerCase();

    if (isMatch) {
      setIsCorrect(true);
      const timeTaken = Math.max(3, Math.round((Date.now() - startTimeRef.current) / 1000));
      const score = Math.max(60, 100 - mistakesCountRef.current * 12);

      const payload = {
        patientId: targetMember.patientId || 'patient-ramesh-1',
        gameId: 'matching-family' as const,
        cognitiveSkill: 'associative_memory' as const,
        level,
        success: true,
        score,
        timeTakenSeconds: timeTaken,
        mistakesCount: mistakesCountRef.current,
      };

      db.recordGameAttempt(payload);
      api.recordGameAttempt(payload).catch(() => {});

      // Play soothing voice or chime
      if (targetMember.voiceAudioUrl) {
        audioService.playVoice(targetMember.voiceAudioUrl).catch(() => {
          audioService.playSuccessChime();
        });
      } else {
        audioService.playSuccessChime();
      }

      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1100);
    } else {
      mistakesCountRef.current += 1;
      setIsCorrect(false);
      audioService.playEncourageSound();
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedRelation(null);
      }, 900);
    }
  };

  if (!targetMember) return null;

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

        <div className="flex items-center gap-2 bg-rose-100 text-rose-900 border-2 border-rose-300 px-4 py-1.5 rounded-full font-black text-sm">
          <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
          <span>{t.patient.level} {level}</span>
        </div>
      </div>

      {/* Target Family Photo Card */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border-4 border-sage-200 shadow-lg mb-6 flex flex-col items-center text-center">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-4 border-sage-300 shadow-md mb-4 bg-sage-50 flex items-center justify-center">
          <img
            src={targetMember.photoUrl}
            alt={targetMember.name}
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-sage-950 mb-1">
          {targetMember.name}
        </h2>
        <p className="text-base sm:text-lg text-sage-700 font-medium">
          {t.games.matchingFamily.instruction}
        </p>
      </div>

      {/* Relationship Choices Buttons */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {relationChoices.map((choice) => {
          const isSelected = selectedRelation === choice.en;
          const isMatch = isSelected && isCorrect === true;
          const isWrong = isSelected && isCorrect === false;

          let btnStyle = 'bg-white border-sage-200 hover:border-sage-400 hover:bg-sage-50 text-gray-900';
          if (isMatch) btnStyle = 'bg-emerald-100 border-emerald-500 text-emerald-950 ring-4 ring-emerald-300 scale-105';
          else if (isWrong) btnStyle = 'bg-rose-50 border-rose-300 text-rose-900';

          const label = language === 'as' ? choice.as : choice.en;

          return (
            <button
              key={choice.en}
              onClick={() => handleSelectRelation(choice)}
              className={`p-5 sm:p-6 rounded-3xl border-4 text-xl sm:text-2xl font-black shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 text-center ${btnStyle}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Repeat Audio Prompt Button */}
      <div className="w-full flex justify-center">
        <button
          onClick={() => audioService.speakText(t.games.matchingFamily.autoVoicePrompt, language)}
          className="inline-flex items-center gap-2 text-sage-800 bg-sage-50 hover:bg-sage-100 px-4 py-2 rounded-2xl border border-sage-300 font-bold text-sm shadow-xs transition"
        >
          <span>🔊</span>
          <span>{t.patient.listenAgain}</span>
        </button>
      </div>

      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={t.games.matchingFamily.title}
        customMessage={t.games.matchingFamily.correctMessage}
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
