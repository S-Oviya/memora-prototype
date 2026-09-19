import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Volume2, RotateCcw, CheckCircle2, Ear, Sparkles } from 'lucide-react';
import { useLanguage, getTranslations } from '../../locales/LanguageContext';
import { FamilyMember, Language, Patient } from '../../types';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';

import { createAvatarSvg, generateVoiceAudioDataUrl, getFamilyMemberRelation, getFamilyMemberTranscript } from '../../services/seedData';

interface FamiliarVoicesGameProps {
  patient?: Patient;
  familyMembers: FamilyMember[];
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

const FALLBACK_EXTENDED_VOICE_MEMBERS: FamilyMember[] = [
  {
    id: 'fam-kavita-voice',
    patientId: 'patient-ramesh-1',
    name: 'Kavita Baruah',
    relationship: 'Sister',
    relationshipAs: 'ভনী',
    photoUrl: createAvatarSvg('Kavita (Sister)', 'Sister', '#EC4899', '#374151', '#9D174D'),
    voiceTranscriptEn: 'Hello Ramesh, it is Kavita speaking!',
    voiceTranscriptAs: 'নমস্কাৰ ৰমেশ, মই কবিতা বাইদেউ!',
    voiceAudioUrl: generateVoiceAudioDataUrl(360, 2.9),
  },
  {
    id: 'fam-biren-voice',
    patientId: 'patient-ramesh-1',
    name: 'Biren Baruah',
    relationship: 'Brother',
    relationshipAs: 'ভাই',
    photoUrl: createAvatarSvg('Biren (Brother)', 'Brother', '#3B82F6', '#1F2937', '#1E40AF'),
    voiceTranscriptEn: 'Ramesh brother, Biren here!',
    voiceTranscriptAs: 'ৰমেশ ভাই, মই বীৰেন!',
    voiceAudioUrl: generateVoiceAudioDataUrl(270, 3.0),
  },
  {
    id: 'fam-anita-voice',
    patientId: 'patient-ramesh-1',
    name: 'Anita Baruah',
    relationship: 'Daughter-in-law',
    relationshipAs: 'বোৱাৰী',
    photoUrl: createAvatarSvg('Anita (Daughter-in-law)', 'Daughter-in-law', '#F59E0B', '#1E293B', '#B45309'),
    voiceTranscriptEn: 'Namaskar, this is Anita.',
    voiceTranscriptAs: 'নমস্কাৰ, মই অনিতা।',
    voiceAudioUrl: generateVoiceAudioDataUrl(400, 2.6),
  },
];

export const FamiliarVoicesGame: React.FC<FamiliarVoicesGameProps> = ({
  patient,
  familyMembers,
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { format } = useLanguage();
  const resolvedPatient = patient || db.getPatient();
  // Strictly use the patient's saved preferredLanguage from Patient Profile; never use caretaker UI language
  const preferredLanguage: Language = resolvedPatient.preferredLanguage;
  const currentT = getTranslations(preferredLanguage);
  const [level, setLevel] = useState<number>(Math.max(1, Math.min(5, initialLevel)));
  const [nextLevel, setNextLevel] = useState<number>(() => Math.max(1, Math.min(5, initialLevel)));
  const [isLevel5Passed, setIsLevel5Passed] = useState<boolean>(false);
  const [targetMember, setTargetMember] = useState<FamilyMember | null>(null);
  const [choices, setChoices] = useState<FamilyMember[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Performance tracking
  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  const clampedLevel = Math.max(1, Math.min(5, level));
  const numChoices = clampedLevel === 1 ? 2 : clampedLevel === 2 ? 3 : clampedLevel === 3 ? 4 : 5;

  const playVoiceClip = async (member: FamilyMember) => {
    setIsPlayingAudio(true);
    const transcript = getFamilyMemberTranscript(member, preferredLanguage);
    try {
      await audioService.speakText(transcript, preferredLanguage);
    } catch {
      if (member.voiceAudioUrl) {
        try {
          await audioService.playVoice(member.voiceAudioUrl);
        } catch {
          audioService.playEncourageSound();
        }
      }
    }
    setIsPlayingAudio(false);
  };

  const speakPrompt = () => {
    const prompt = currentT.games.voices.autoVoicePrompt || currentT.games.voices.instruction;
    audioService.speakText(prompt, preferredLanguage);
  };

  const handleSpeakOption = (e: React.MouseEvent, member: FamilyMember) => {
    e.stopPropagation();
    const optionText = `${member.name}, ${getFamilyMemberRelation(member, preferredLanguage)}`;
    audioService.speakText(optionText, preferredLanguage);
  };

  const startRound = (targetLevel: number) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setSelectedId(null);
    setIsCorrect(null);
    setShowFeedbackModal(false);

    // Build comprehensive pool of at least 5 members
    const allMembers = [...familyMembers];
    for (const ext of FALLBACK_EXTENDED_VOICE_MEMBERS) {
      if (!allMembers.some((m) => m.id === ext.id) && allMembers.length < 6) {
        allMembers.push(ext);
      }
    }

    if (allMembers.length === 0) return;

    // Pick target with voice
    const targetPool = familyMembers.length > 0 ? familyMembers : allMembers;
    const target = targetPool[Math.floor(Math.random() * targetPool.length)];
    setTargetMember(target);

    // Filter out target
    const others = allMembers.filter((m) => m.id !== target.id);
    const currentLvl = Math.max(1, Math.min(5, targetLevel));
    const neededChoices = currentLvl === 1 ? 2 : currentLvl === 2 ? 3 : currentLvl === 3 ? 4 : 5;

    let selectedDistractors: FamilyMember[] = [];

    if (currentLvl === 5) {
      // Level 5: 5 choices with more similar/difficult distractors (similar vocal timbre/register)
      const isHigherPitch = (m: FamilyMember) =>
        /daughter|wife|sister|mother|নাতিনী|জীয়াৰী|পত্নী|ভনী|বোৱাৰী/i.test(
          `${m.relationship} ${m.relationshipAs || ''}`
        );
      const targetIsHigherPitch = isHigherPitch(target);

      const similarOthers = others.filter((m) => isHigherPitch(m) === targetIsHigherPitch);
      const differentOthers = others.filter((m) => isHigherPitch(m) !== targetIsHigherPitch);

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

    // Automatic voice playback on round start
    setTimeout(() => {
      playVoiceClip(target);
    }, 400);
  };

  useEffect(() => {
    const clamped = Math.max(1, Math.min(5, initialLevel));
    setLevel(clamped);
    setNextLevel(clamped);
    setIsLevel5Passed(false);
  }, [initialLevel]);

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

      // Record attempt for caregiver with recognition and associative memory
      const payload = {
        patientId: member.patientId || 'patient-ramesh-1',
        gameId: 'familiar-voices' as const,
        cognitiveSkill: 'recognition' as const,
        cognitiveSkills: ['recognition', 'associative_memory'] as ('recognition' | 'associative_memory')[],
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

      // Play voice greeting in patient's preferred language upon correct match
      const greeting = getFamilyMemberTranscript(member, preferredLanguage);
      audioService.speakText(greeting, preferredLanguage).catch(() => {
        audioService.playSuccessChime();
      });

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
      }, 1000);
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
          <span className="text-base">{currentT.common.back}</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-sage-900 flex items-center gap-2">
          <span>🎵</span> {currentT.games.voices.title}
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
      <div className="w-full bg-sage-50 border-3 border-sage-300 rounded-3xl p-5 mb-5 text-center shadow-sm flex flex-col items-center">
        <p className="text-sm font-bold text-sage-700 uppercase tracking-wider mb-1">
          {currentT.games.voices.instruction}
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-sage-950 leading-tight">
          {currentT.games.voices.autoVoicePrompt}
        </h2>
        <button
          type="button"
          onClick={speakPrompt}
          className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-sage-200/80 hover:bg-sage-300 text-sage-900 text-sm font-bold transition active:scale-95"
          title="Listen prompt"
          aria-label="Listen prompt"
        >
          <Volume2 className="w-5 h-5 text-sage-700" />
          <span>{currentT.games.voices.instruction}</span>
        </button>
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
                ? currentT.games.voices.playingAudio
                : currentT.games.voices.title}
            </p>
            <p className="text-xs text-gray-600">
              {currentT.games.voices.instruction}
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
          <span className="text-sm font-extrabold">{currentT.games.voices.replayVoice}</span>
        </button>
      </div>

      {/* Choices: Who is speaking? */}
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
                {getFamilyMemberRelation(member, preferredLanguage)}
              </span>

              {/* Spoken Answer Option Button */}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => handleSpeakOption(e, member)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSpeakOption(e as unknown as React.MouseEvent, member);
                  }
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-50 hover:bg-sage-100 text-sage-800 text-xs font-bold border border-sage-200 transition active:scale-95 cursor-pointer"
                title="Listen option"
                aria-label="Listen option"
              >
                <Volume2 className="w-3.5 h-3.5 text-sage-600" />
                <span>{member.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Gentle notice on incorrect tap */}
      {isCorrect === false && (
        <p className="text-base font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 mb-4 animate-fadeIn">
          {currentT.games.faces.tryAgain}
        </p>
      )}


      {/* Celebration Feedback Modal */}
      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={currentT.games.voices.title}
        customMessage={format(currentT.games.voices.correctMessage, {
          name: targetMember.name,
        })}
        nextButtonText={isLevel5Passed ? (currentT.patient?.playNextGame || 'Next Activity') : `${currentT.patient.level} ${nextLevel}`}
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
