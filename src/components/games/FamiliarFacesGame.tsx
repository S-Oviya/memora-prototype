import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, CheckCircle2, RotateCcw, Heart } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { FamilyMember } from '../../types';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';

interface FamiliarFacesGameProps {
  familyMembers: FamilyMember[];
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

export const FamiliarFacesGame: React.FC<FamiliarFacesGameProps> = ({
  familyMembers,
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { t, language, format } = useLanguage();
  const [level, setLevel] = useState<number>(initialLevel);
  const [targetMember, setTargetMember] = useState<FamilyMember | null>(null);
  const [choices, setChoices] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [voicePlaying, setVoicePlaying] = useState<boolean>(false);

  // Performance tracking
  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  const numChoices = level === 1 ? 2 : level === 2 ? 3 : level === 3 ? 4 : Math.min(familyMembers.length, level === 4 ? 4 : 5);

  const startRound = (targetLevel: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setSelectedId(null);
    setIsCorrect(null);
    setShowFeedbackModal(false);
    setVoicePlaying(false);

    if (familyMembers.length === 0) return;

    // Pick target
    const target = familyMembers[Math.floor(Math.random() * familyMembers.length)];
    setTargetMember(target);

    // Pick distractors
    const others = familyMembers.filter((m) => m.id !== target.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

    const neededChoices = targetLevel === 1 ? 2 : targetLevel === 2 ? 3 : targetLevel === 3 ? 4 : Math.min(familyMembers.length, targetLevel === 4 ? 4 : 5);
    const currentChoices = [target, ...shuffledOthers.slice(0, neededChoices - 1)].sort(
      () => Math.random() - 0.5
    );

    setChoices(currentChoices);

    // Auto-voice prompt: Level 4/5 uses short relation prompt for higher cognitive stimulation
    const promptText =
      targetLevel >= 4
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
    setLevel(initialLevel);
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
            : 'grid-cols-2'
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
