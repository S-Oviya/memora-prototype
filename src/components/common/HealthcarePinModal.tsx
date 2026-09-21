import React, { useState, useEffect } from 'react';
import { Stethoscope, Delete, X, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { db } from '../../services/db';
import { audioService } from '../../services/audioService';

interface HealthcarePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const HealthcarePinModal: React.FC<HealthcarePinModalProps> = ({ isOpen, onClose, onSuccess }) => {
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

  const targetLength = 4;

  const verifyPin = (code: string) => {
    if (!code) return;
    const isValid = db.verifyHealthcarePin(code);
    if (isValid) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('memora_session_healthcare_pin', code);
      }
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border-4 border-teal-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-gray-900">
                {language === 'as' ? 'স্বাস্থ্যকৰ্মী প্ৰৱেশ' : 'Healthcare Worker'}
              </h3>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {language === 'as' ? 'কেৱল পঢ়িব পৰা অধিকাৰ' : 'Read-Only Observational Access'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 mb-5 text-left leading-relaxed">
          {language === 'as'
            ? 'ৰোগীৰ অগ্ৰগতি আৰু কাৰ্যকলাপ পৰ্যবেক্ষণৰ বাবে ৪-অংকৰ পিন দিয়ক।'
            : 'Enter the 4-digit Healthcare Worker PIN to view authorized patient progress and activity history.'}
        </p>

        {/* PIN Indicators Display */}
        <div className="flex justify-center items-center gap-3 mb-6 relative">
          {[...Array(targetLength)].map((_, i) => (
            <div
              key={i}
              className={`w-11 h-13 rounded-2xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                error
                  ? 'border-rose-400 bg-rose-50 text-rose-600 animate-shake'
                  : i < pin.length
                  ? 'border-teal-500 bg-teal-50 text-teal-900 shadow-sm'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {i < pin.length ? (showPassword ? pin[i] : '•') : ''}
            </div>
          ))}

          {/* Toggle show/hide PIN */}
          {pin.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 text-gray-400 hover:text-gray-600 p-1"
              title={showPassword ? 'Hide PIN' : 'Show PIN'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-bold mb-4 animate-bounce">
            {language === 'as' ? 'ভুল পিন। পুনৰ চেষ্টা কৰক।' : 'Incorrect Healthcare PIN. Please try again.'}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-gray-50 hover:bg-teal-50 active:bg-teal-100 text-gray-800 text-lg font-bold border border-gray-200 hover:border-teal-300 transition active:scale-95 shadow-xs"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-gray-50 hover:bg-teal-50 active:bg-teal-100 text-gray-800 text-lg font-bold border border-gray-200 hover:border-teal-300 transition active:scale-95 shadow-xs"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-gray-50 hover:bg-rose-50 active:bg-rose-100 text-gray-600 hover:text-rose-600 flex items-center justify-center border border-gray-200 hover:border-rose-200 transition active:scale-95"
            aria-label="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Hint */}
        <p className="text-[11px] text-gray-400">
          {language === 'as' ? 'প্ৰাৰম্ভিক ডেমো পিন হৈছে ৪৩২১' : 'Default healthcare PIN is 4321'}
        </p>
      </div>
    </div>
  );
};
