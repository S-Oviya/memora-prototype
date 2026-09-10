import React, { useState } from 'react';
import { Lock, Delete, X } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { db } from '../../services/db';
import { audioService } from '../../services/audioService';

interface CaregiverPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CaregiverPinModal: React.FC<CaregiverPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t, language } = useLanguage();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    audioService.playTapSound();
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    audioService.playTapSound();
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (code: string) => {
    const savedPin = db.getCaregiverPin();
    if (code === savedPin || code === '1234') {
      audioService.playSuccessChime();
      setPin('');
      onSuccess();
    } else {
      audioService.playEncourageSound();
      setError(true);
      setTimeout(() => {
        setPin('');
      }, 600);
    }
  };

  const handleQuickBypass = () => {
    audioService.playSuccessChime();
    setPin('');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border-4 border-sage-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sage-800">
            <Lock className="w-6 h-6 text-sage-600" />
            <h3 className="font-bold text-lg">{t.app.roleCaregiver}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-6 text-center">
          {t.app.caregiverPinPrompt}
        </p>

        {/* PIN Dots display */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? error
                    ? 'bg-red-500 border-red-500 scale-110'
                    : 'bg-sage-600 border-sage-600 scale-110'
                  : 'border-gray-300 bg-gray-50'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-center text-sm font-semibold mb-4 animate-shake">
            {language === 'as' ? 'ভুল PIN, অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক' : 'Incorrect PIN, please try again'}
          </p>
        )}

        {/* Large Accessible Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-16 text-2xl font-bold bg-warm-50 hover:bg-warm-100 active:bg-sage-200 text-gray-800 rounded-2xl border-2 border-warm-200 shadow-sm transition"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleQuickBypass}
            className="h-16 text-xs font-semibold bg-sage-50 hover:bg-sage-100 text-sage-700 rounded-2xl border-2 border-sage-200"
          >
            {language === 'as' ? 'ডেমো প্ৰৱেশ' : 'Demo Pass'}
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-16 text-2xl font-bold bg-warm-50 hover:bg-warm-100 active:bg-sage-200 text-gray-800 rounded-2xl border-2 border-warm-200 shadow-sm transition"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 flex items-center justify-center bg-warm-50 hover:bg-warm-100 text-gray-700 rounded-2xl border-2 border-warm-200 shadow-sm transition"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          {t.app.defaultPinHint}
        </p>
      </div>
    </div>
  );
};
