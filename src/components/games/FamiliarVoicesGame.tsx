import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, RotateCcw, CheckCircle2, Ear, Sparkles } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { FamilyMember } from '../../types';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';

interface FamiliarVoicesGameProps {
  familyMembers: FamilyMember[];
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

export const FamiliarVoicesGame: React.FC<FamiliarVoicesGameProps> = ({
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
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Performance tracking
  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  const numChoices = level === 1 ? 2 : level === 2 ? 3 : 4;

  const playVoiceClip = async (member: FamilyMember) => {
    setIsPlayingAudio(true);
    if (member.voiceAudioUrl) {
      try {
        await audioService.playVoice(member.voiceAudioUrl);
      } catch {
        // Fallback tone if audio cannot play
        audioService.playEncourageSound();
      }
    } else {
      // Speech synthesis fallback
      const transcript =
        language === 'as'
          ? member.voiceTranscriptAs || `মই ${member.name}`
          : member.voiceTranscriptEn || `Hello, it is ${member.name}`;
      audioService.speakText(transcript, language);
    }
    setIsPlayingAudio(false);
  };

  const startRound = (targetLevel: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setSelectedId(null);
    setIsCorrect(null);
    setShowFeedbackModal(false);

    if (familyMembers.length === 0) return;

    // Pick target with voice
    const target = familyMembers[Math.floor(Math.random() * familyMembers.length)];
    setTargetMember(target);

    // Pick choices
    const others = familyMembers.filter((m) => m.id !== target.id);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

    const neededChoices = targetLevel === 1 ? 2 : targetLevel === 2 ? 3 : 4;
    const currentChoices = [target, ...shuffledOthers.slice(0, neededChoices - 1)].sort(
      () => Math.random() - 0.5
    );

    setChoices(currentChoices);

    // Automatic voice playback on round start (crucial requirement: patient should not need to find a play button)
    setTimeout(() => {
      playVoiceClip(target);
    }, 400);
  };

  useEffect(() => {
    startRound(level);
    return () => {
      audioService.stopCurrentAudio();
    };
  }, [level, familyMembers]);

  const handleChoice = (member: FamilyMember) => {
    if (isCorrect) return;

    audioService.playTapSound();
    setSelectedId(member.id);

    if (member.id === targetMember?.id) {
      // Correct match!
      setIsCorrect(true);
      const timeTaken = Math.max(3, Math.round((Date.now() - startTimeRef.current) / 1000));
      const score = Math.max(60, 100 - mistakesCountRef.current * 15);

      db.recordGameAttempt({
        patientId: member.patientId || 'patient-ramesh-1',
        gameId: 'familiar-voices',
        level,
        success: true,
        score,
        timeTakenSeconds: timeTaken,
        mistakesCount: mistakesCountRef.current,
      });

      audioService.playSuccessChime();

      setTimeout(() => {
        setShowFeedbackModal(true);
      }, 1200);
    } else {
      mistakesCountRef.current += 1;
      setIsCorrect(false);
      audioService.playEncourageSound();

      setTimeout(() => {
        setIsCorrect(null);
        setSelectedId(null);
        // Automatically replay audio gently so patient gets another chance
        if (targetMember) {
          playVoiceClip(targetMember);
        }
      }, 1200);
    }
  };

  if (!targetMember) return null;

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
          <span>🎵</span> {t.games.voices.title}
        </h1>

        <button
          onClick={() => startRound(level)}
          className="p-2.5 rounded-2xl bg-white border-2 border-warm-200 text-warm-800 hover:bg-warm-50 transition shadow-sm"
          title="Restart"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Dementia-Friendly Instruction Banner */}
      <div className="w-full bg-sage-50 border-3 border-sage-300 rounded-3xl p-5 mb-5 text-center shadow-sm">
        <p className="text-sm font-bold text-sage-700 uppercase tracking-wider mb-1">
          {t.games.voices.instruction}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-sage-950 leading-tight">
          {t.games.voices.autoVoicePrompt}
        </h2>
      </div>

      {/* Auto-Playing Voice Status Box & Replay Button */}
      <div className="w-full bg-gradient-to-r from-sage-100 via-amber-50 to-sage-100 border-3 border-sage-300 rounded-3xl p-4 sm:p-5 mb-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all shadow-md ${
              isPlayingAudio ? 'bg-amber-600 animate-bounce' : 'bg-sage-600'
            }`}
          >
            {isPlayingAudio ? <Volume2 className="w-8 h-8" /> : <Ear className="w-8 h-8" />}
          </div>
          <div>
            <p className="text-sm font-bold text-sage-800 uppercase tracking-wide">
              {isPlayingAudio
                ? t.games.voices.playingAudio
                : language === 'as'
                ? 'পৰিয়ালৰ মাত সাজু হৈছে'
                : 'Family voice ready'}
            </p>
            <p className="text-xs text-gray-600">
              {language === 'as' ? 'মন দি মাতটো শুনক' : 'Listen carefully to the voice'}
            </p>
          </div>
        </div>

        {/* Large Replay Button with Ear Icon */}
        <button
          onClick={() => playVoiceClip(targetMember)}
          disabled={isPlayingAudio}
          className="flex items-center gap-2 bg-white hover:bg-warm-100 text-sage-900 border-2 border-sage-300 font-bold px-4 py-3 rounded-2xl shadow-sm transition active:scale-95 disabled:opacity-60"
        >
          <RotateCcw className="w-5 h-5 text-sage-600" />
          <span className="text-sm font-extrabold">{t.games.voices.replayVoice}</span>
        </button>
      </div>

      {/* Choices: Who is speaking? */}
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

      {/* Gentle notice on incorrect tap */}
      {isCorrect === false && (
        <p className="text-base font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 mb-4 animate-fadeIn">
          {t.games.faces.tryAgain}
        </p>
      )}

      {/* Level Selector */}
      <div className="w-full max-w-sm flex items-center justify-center gap-2 mt-2">
        {[1, 2, 3].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevel(lvl)}
            className={`flex-1 py-3 px-3 rounded-2xl font-bold text-sm sm:text-base border-2 transition-all ${
              level === lvl
                ? 'bg-sage-600 text-white border-sage-700 shadow-md scale-105'
                : 'bg-white text-gray-700 border-sage-200 hover:bg-sage-50'
            }`}
          >
            {t.patient.level} {lvl}
          </button>
        ))}
      </div>

      {/* Celebration Feedback Modal */}
      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={t.games.voices.title}
        customMessage={format(t.games.voices.correctMessage, {
          name: targetMember.name,
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
