import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Music, ArrowRight, Home, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { audioService } from '../../services/audioService';
import { AccessibleButton } from '../common/AccessibleButton';

interface GameFeedbackModalProps {
  isOpen: boolean;
  onPlayNext: () => void;
  onBackHome: () => void;
  gameTitle: string;
  customMessage?: string;
  musicTitle?: string;
  nextButtonText?: string;
}

export const GameFeedbackModal: React.FC<GameFeedbackModalProps> = ({
  isOpen,
  onPlayNext,
  onBackHome,
  gameTitle,
  customMessage,
  musicTitle,
  nextButtonText,
}) => {
  const { t, language } = useLanguage();
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Play celebratory chime
      audioService.playSuccessChime();

      // Trigger gentle celebratory flower confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4E8762', '#E07A5F', '#F4A261', '#E76F51', '#2A9D8F'],
        });
      } catch {
        // ignore
      }

      // Automatically play soothing flute reward melody
      setIsPlayingMusic(true);
      audioService.playSoothingFluteReward(12, () => {
        setIsPlayingMusic(false);
      });
    } else {
      audioService.stopSynthesizedMelody();
      setIsPlayingMusic(false);
    }

    return () => {
      audioService.stopSynthesizedMelody();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleMusic = () => {
    if (isPlayingMusic) {
      audioService.stopSynthesizedMelody();
      setIsPlayingMusic(false);
    } else {
      setIsPlayingMusic(true);
      audioService.playSoothingFluteReward(15, () => {
        setIsPlayingMusic(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-sage-300 text-center animate-gentle-celebrate">
        {/* Blooming floral icon badge */}
        <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-gradient-to-tr from-sage-100 to-amber-100 flex items-center justify-center border-4 border-sage-200 shadow-inner">
          <Sparkles className="w-12 h-12 text-sage-600 animate-pulse" />
        </div>

        {/* Praise Message */}
        <h2 className="text-3xl font-extrabold text-sage-900 mb-2">
          {t.patient.wellDone}
        </h2>
        <p className="text-xl font-semibold text-terracotta-600 mb-4">
          {t.patient.veryGood}
        </p>

        {customMessage && (
          <p className="text-elderly-base text-gray-700 mb-6 bg-sage-50 p-4 rounded-2xl border border-sage-200 leading-relaxed">
            {customMessage}
          </p>
        )}

        {/* Calming Music Reward Banner */}
        <div className="bg-warm-100 p-4 rounded-2xl border-2 border-warm-200 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-sage-500 text-white flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {language === 'as' ? 'শান্ত সুৰৰ সংগীত' : 'Soothing Reward Music'}
              </p>
              <p className="text-sm font-bold text-gray-800">
                {musicTitle || (language === 'as' ? 'অসমীয়া শান্ত বাঁহীৰ সুৰ' : 'Peaceful Assamese Flute Melody')}
              </p>
            </div>
          </div>
          <button
            onClick={toggleMusic}
            className="p-3 bg-white rounded-xl text-sage-700 hover:bg-sage-50 border border-warm-300 shadow-sm transition"
            title="Toggle music"
          >
            {isPlayingMusic ? <Volume2 className="w-5 h-5 animate-pulse text-sage-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <AccessibleButton
            variant="primary"
            size="xl"
            icon={<ArrowRight className="w-7 h-7" />}
            onClick={() => {
              audioService.stopSynthesizedMelody();
              onPlayNext();
            }}
            className="w-full"
          >
            {nextButtonText || t.patient.playNextGame}
          </AccessibleButton>

          <AccessibleButton
            variant="secondary"
            size="lg"
            icon={<Home className="w-6 h-6" />}
            onClick={() => {
              audioService.stopSynthesizedMelody();
              onBackHome();
            }}
            className="w-full"
          >
            {t.patient.backToHome}
          </AccessibleButton>
        </div>
      </div>
    </div>
  );
};
