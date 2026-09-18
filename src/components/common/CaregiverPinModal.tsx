import React, { useState, useEffect } from 'react';
import { Lock, Delete, X, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetLength = db.getCaregiverPin().length;

  const verifyPin = (code: string) => {
    if (!code) return;
    const isValid = db.verifyCaregiverPin(code);
    if (isValid) {
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

  const handleDigit = (digit: string) => {
    audioService.playTapSound();
    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);

    // Auto-verify if typed length matches the configured password length
    if (nextPin.length === targetLength) {
      verifyPin(nextPin);
    }
  };

  const handleBackspace = () => {
    audioService.playTapSound();
    setPin((prev) => prev.slice(0, -1));
    setError(false);
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

        <p className="text-sm text-gray-600 mb-5 text-center font-medium">
          {t.app.caregiverPinPrompt}
        </p>

        {/* Accessible Password Input with Show/Hide toggle */}
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={pin}
            onChange={(e) => {
              const val = e.target.value;
              setPin(val);
              setError(false);
              if (val.length === targetLength) {
                verifyPin(val);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                verifyPin(pin);
              }
            }}
            placeholder="••••"
            autoFocus
            className="w-full text-center text-xl sm:text-2xl tracking-widest font-bold py-3 pl-8 pr-12 rounded-2xl border-2 border-sage-300 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 outline-none bg-sage-50/50 text-gray-900 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg focus:outline-none"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-center text-sm font-semibold mb-3 animate-shake">
            {language === 'as' ? 'ভুল পাছৱৰ্ড / PIN, অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক' : 'Incorrect password, please try again'}
          </p>
        )}

        {/* Large Accessible Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 sm:h-16 text-2xl font-bold bg-warm-50 hover:bg-warm-100 active:bg-sage-200 text-gray-800 rounded-2xl border-2 border-warm-200 shadow-sm transition"
            >
              {digit}
            </button>
          ))}

          {/* Default Password Button */}
          <button
            type="button"
            onClick={() => {
              setPin('1234');
              verifyPin('1234');
            }}
            className="h-14 sm:h-16 flex items-center justify-center font-bold rounded-2xl border-2 border-warm-200 bg-warm-50 hover:bg-warm-100 active:bg-sage-200 text-gray-700 shadow-sm transition text-[11px] sm:text-xs text-center leading-tight p-1"
          >
            Default Password: 1234
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-14 sm:h-16 text-2xl font-bold bg-warm-50 hover:bg-warm-100 active:bg-sage-200 text-gray-800 rounded-2xl border-2 border-warm-200 shadow-sm transition"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 sm:h-16 flex items-center justify-center bg-warm-50 hover:bg-warm-100 text-gray-700 rounded-2xl border-2 border-warm-200 shadow-sm transition"
            aria-label="Backspace"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
