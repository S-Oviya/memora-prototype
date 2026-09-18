import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, CheckCircle2, RotateCcw, Heart } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { FamilyMember } from '../../types';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';

import { createAvatarSvg } from '../../services/seedData';

interface FamiliarFacesGameProps {
  familyMembers: FamilyMember[];
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

const FALLBACK_EXTENDED_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-kavita-ext',
    patientId: 'patient-ramesh-1',
    name: 'Kavita Baruah',
    relationship: 'Sister',
    relationshipAs: 'ভনী',
    photoUrl: createAvatarSvg('Kavita (Sister)', 'Sister', '#EC4899', '#374151', '#9D174D'),
    voiceTranscriptEn: 'Hello Ramesh, this is Kavita!',
    voiceTranscriptAs: 'নমস্কাৰ ৰমেশ, মই কবিতা!',
  },
  {
    id: 'fam-biren-ext',
    patientId: 'patient-ramesh-1',
    name: 'Biren Baruah',
    relationship: 'Brother',
    relationshipAs: 'ভাই',
    photoUrl: createAvatarSvg('Biren (Brother)', 'Brother', '#3B82F6', '#1F2937', '#1E40AF'),
    voiceTranscriptEn: 'Ramesh, brother, good to see you!',
    voiceTranscriptAs: 'ৰমেশ ভাই, সকলো ভালে আছে নে!',
  },
  {
    id: 'fam-anita-ext',
    patientId: 'patient-ramesh-1',
    name: 'Anita Baruah',
    relationship: 'Daughter-in-law',
    relationshipAs: 'বোৱাৰী',
    photoUrl: createAvatarSvg('Anita (Daughter-in-law)', 'Daughter-in-law', '#F59E0B', '#1E293B', '#B45309'),
    voiceTranscriptEn: 'Namaskar Deuta, tea is ready.',
    voiceTranscriptAs: 'নমস্কাৰ দেউতা, চাহ তৈয়াৰ হৈছে।',
  },
];

export const FamiliarFacesGame: React.FC<FamiliarFacesGameProps> = ({
  familyMembers,
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { t, language, format } = useLanguage();
  const [level, setLevel] = useState<number>(Math.max(1, Math.min(5, initialLevel)));
  const [nextLevel, setNextLevel] = useState<number>(() => Math.max(1, Math.min(5, initialLevel)));
  const [isLevel5Passed, setIsLevel5Passed] = useState<boolean>(false);
  const [targetMember, setTargetMember] = useState<FamilyMember | null>(null);
  const [choices, setChoices] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [voicePlaying, setVoicePlaying] = useState<boolean>(false);

  // Performance tracking
  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  const clampedLevel = Math.max(1, Math.min(5, level));
  const numChoices = clampedLevel === 1 ? 2 : clampedLevel === 2 ? 3 : clampedLevel === 3 ? 4 : 5;

  const startRound = (targetLevel: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setSelectedId(null);
    setIsCorrect(null);
    setShowFeedbackModal(false);
    setVoicePlaying(false);

    // Build comprehensive pool of at least 5 members
    const allMembers = [...familyMembers];
    for (const ext of FALLBACK_EXTENDED_MEMBERS) {
      if (!allMembers.some((m) => m.id === ext.id) && allMembers.length < 6) {
        allMembers.push(ext);
      }
    }

    if (allMembers.length === 0) return;

    // Pick target
    const targetPool = familyMembers.length > 0 ? familyMembers : allMembers;
    const target = targetPool[Math.floor(Math.random() * targetPool.length)];
    setTargetMember(target);

    // Filter out target
    const others = allMembers.filter((m) => m.id !== target.id);
    const currentLvl = Math.max(1, Math.min(5, targetLevel));
    const neededChoices = currentLvl === 1 ? 2 : currentLvl === 2 ? 3 : currentLvl === 3 ? 4 : 5;

    let selectedDistractors: FamilyMember[] = [];

    if (currentLvl === 5) {
      // Level 5: 5 choices with more similar/difficult distractors (e.g. matching gender/generation)
      const isFemale = (m: FamilyMember) =>
        /daughter|wife|sister|mother|নাতিনী|জীয়াৰী|পত্নী|ভনী|বোৱাৰী/i.test(
          `${m.relationship} ${m.relationshipAs || ''}`
        );
      const targetIsFemale = isFemale(target);

      const similarOthers = others.filter((m) => isFemale(m) === targetIsFemale);
      const differentOthers = others.filter((m) => isFemale(m) !== targetIsFemale);

      const shuffledSimilar = [...similarOthers].sort(() => Math.random() - 0.5);
      const shuffledDifferent = [...differentOthers].sort(() => Math.random() - 0.5);

      const combined = [...shuffledSimilar, ...shuffledDifferent];
      selectedDistractors = combined.slice(0, neededChoices - 1);
    } else {
      // Levels 1-4: random distractors
      const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
      selectedDistractors = shuffledOthers.slice(0, neededChoices - 1);
    }

    const currentChoices = [target, ...selectedDistractors].sort(() => Math.random() - 0.5);
    setChoices(currentChoices);

    // Auto-voice prompt: Level 4/5 uses short relation prompt for higher cognitive stimulation
    const promptText =
      currentLvl >= 4
        ? format(t.games.faces.questionFindShort, {
            relation: target.relationshipAs || target.relationship,
          })
        : language === 'as'
        ? format(t.games.faces.questionFind, {
            relation: target.relationshipAs || target.relationship,
            name: target.name,
          })
        : format(t.games.faces.questionFind, {
            relation: target.relationship,
            name: target.name,
          });

    audioService.speakText(promptText, language);
  };

  useEffect(() => {
    const clamped = Math.max(1, Math.min(5, initialLevel));
    setLevel(clamped);
    setNextLevel(clamped);
    setIsLevel5Passed(false);
  }, [initialLevel]);

  useEffect(() => {
    startRound(level);
  }, [level, familyMembers]);

  const handleChoice = async (member: FamilyMember) => {
    if (isCorrect) return; // already solved

    audioService.playTapSound();
    setSelectedId(member.id);

    if (member.id === targetMember?.id) {
      // Correct!
      setIsCorrect(true);
      const timeTaken = Math.max(3, Math.round((Date.now() - startTimeRef.current) / 1000));
      const score = Math.max(60, 100 - mistakesCountRef.current * 15);

      // Record attempt for caregiver
      const payload = {
        patientId: member.patientId || 'patient-ramesh-1',
        gameId: 'familiar-faces' as const,
        cognitiveSkill: 'recognition' as const,
        level,
        success: true,
        score,
        timeTakenSeconds: timeTaken,
        mistakesCount: mistakesCountRef.current,
      };
      db.recordGameAttempt(payload);
      api.recordGameAttempt(payload).catch(() => {});

      // Evaluate progression: pass moves up a level (max 5), struggle/fail moves down (min 1)
      const isPass = payload.success && payload.mistakesCount <= 1 && payload.score >= 70;
      const computedNext = isPass ? Math.min(5, level + 1) : Math.max(1, level - 1);
      setNextLevel(computedNext);
      setIsLevel5Passed(isPass && level >= 5);

      // Play family member voice recording automatically!
      if (member.voiceAudioUrl) {
        setVoicePlaying(true);
        try {
          await audioService.playVoice(member.voiceAudioUrl);
        } catch {
          audioService.playSuccessChime();
        }
        setVoicePlaying(false);
      } else {
        audioService.playSuccessChime();
      }

      // Show warm praise modal
      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1200);
    } else {
      // Gentle encourage, no scary buzzer
      mistakesCountRef.current += 1;
      setIsCorrect(false);
      audioService.playEncourageSound();
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedId(null);
      }, 1000);
    }
  };

  if (!targetMember) return null;

  const relationLabel =
    language === 'as'
      ? targetMember.relationshipAs || targetMember.relationship
      : targetMember.relationship;

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
          <span>🌸</span> {t.games.faces.title}
        </h1>

        <button
          onClick={() => startRound(level)}
          className="p-2.5 rounded-2xl bg-white border-2 border-warm-200 text-warm-800 hover:bg-warm-50 transition shadow-sm"
          title="Restart"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Dementia-Friendly Question Banner */}
      <div className="w-full bg-sage-50 border-3 border-sage-300 rounded-3xl p-5 mb-6 text-center shadow-sm">
        <p className="text-sm font-bold text-sage-700 uppercase tracking-wider mb-1">
          {t.patient.tapToChoose}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-sage-950 leading-tight">
          {format(t.games.faces.questionFind, {
            relation: relationLabel,
            name: targetMember.name,
          })}
        </h2>
      </div>

      {/* Voice Playing Indicator */}
      {voicePlaying && (
        <div className="w-full bg-amber-100 border-2 border-amber-300 text-amber-900 rounded-2xl p-3 mb-4 flex items-center justify-center gap-3 animate-soft-pulse">
          <Volume2 className="w-6 h-6 animate-bounce" />
          <span className="font-bold text-base">
            {targetMember.name}: {language === 'as' ? targetMember.voiceTranscriptAs : targetMember.voiceTranscriptEn}
          </span>
        </div>
      )}

      {/* Large Choice Cards */}
      <div
        className={`w-full grid gap-4 sm:gap-6 mb-6 ${
          numChoices === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : numChoices === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {choices.map((member) => {
          const isThisSelected = selectedId === member.id;
          const isThisCorrect = isThisSelected && isCorrect === true;
          const isThisWrong = isThisSelected && isCorrect === false;

          return (
            <button
              key={member.id}
              onClick={() => handleChoice(member)}
              disabled={isCorrect === true}
              className={`group flex flex-col items-center bg-white rounded-3xl p-4 border-4 transition-all duration-200 active:scale-95 shadow-lg select-none text-center ${
                isThisCorrect
                  ? 'border-emerald-500 ring-8 ring-emerald-200 bg-emerald-50 scale-105'
                  : isThisWrong
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-sage-200 hover:border-sage-400 hover:shadow-xl'
              }`}
            >
              {/* Photo */}
              <div className="relative w-full aspect-square max-w-[200px] rounded-2xl overflow-hidden mb-3 border-2 border-warm-200 shadow-inner">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {isThisCorrect && (
                  <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center backdrop-blur-[2px]">
                    <CheckCircle2 className="w-16 h-16 text-white drop-shadow-md animate-gentle-celebrate" />
                  </div>
                )}
              </div>

              {/* Name & Relation Label */}
              <span className="text-xl sm:text-2xl font-black text-gray-900 mb-1">
                {member.name}
              </span>
              <span className="text-base font-semibold text-sage-700 bg-sage-100 px-3 py-1 rounded-full">
                {language === 'as' ? member.relationshipAs || member.relationship : member.relationship}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gentle feedback prompt on incorrect tap */}
      {isCorrect === false && (
        <p className="text-base font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 mb-4 animate-fadeIn">
          {t.games.faces.tryAgain}
        </p>
      )}


      {/* Feedback Celebration Modal */}
      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={t.games.faces.title}
        customMessage={format(t.games.faces.correctMessage, {
          name: targetMember.name,
          relation: relationLabel,
        })}
        nextButtonText={isLevel5Passed ? 'Next Activity' : 'Next Level'}
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
