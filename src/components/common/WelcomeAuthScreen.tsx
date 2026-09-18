import React, { useState } from 'react';
import { Heart, Shield, Play, Sparkles, UserCheck, ArrowRight, Globe } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../locales/LanguageContext';
import { UserRole } from '../../types';
import { AccessibleButton } from './AccessibleButton';
import { CaregiverPinModal } from './CaregiverPinModal';

interface WelcomeAuthScreenProps {
  onSelectRole: (role: UserRole) => void;
}

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({ onSelectRole }) => {
  const { t, language, setLanguage } = useLanguage();
  const [showPinModal, setShowPinModal] = useState(false);

  const handleCaregiverClick = () => {
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    onSelectRole('caregiver');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE6] to-[#EAE0D2] flex flex-col justify-center items-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-sage-200 text-center">
        {/* Language selector at top of login */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-warm-100 hover:bg-warm-200 px-3 py-1.5 rounded-2xl border border-warm-300 transition">
            <Globe className="w-4 h-4 text-sage-700 flex-shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer pr-1"
              aria-label="Select Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-gray-900 bg-white font-medium">
                  {lang.nativeLabel} ({lang.label})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand Icon & Heading */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-sage-500 to-sage-700 flex items-center justify-center text-white shadow-xl shadow-sage-900/15 mb-4">
          <Heart className="w-10 h-10 fill-white/20" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-3xl font-black text-sage-900 tracking-tight">
            Memora
          </h1>
          <span className="text-lg font-bold text-sage-600 bg-sage-50 px-2 py-0.5 rounded-lg border border-sage-200">
            মেমোৰা
          </span>
        </div>

        <p className="text-xs font-bold text-sage-700 uppercase tracking-widest mb-3">
          {t.app.subtitle}
        </p>

        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          {t.auth.welcomeSubtitle}
        </p>

        {/* Two Role Options */}
        <div className="space-y-4 mb-6">
          {/* Patient Role Button */}
          <button
            onClick={() => onSelectRole('patient')}
            className="w-full text-left p-5 rounded-3xl bg-gradient-to-br from-sage-50 to-emerald-50 hover:from-sage-100 hover:to-emerald-100 border-3 border-sage-300 hover:border-sage-500 transition-all duration-200 active:scale-95 shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sage-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition">
                <Play className="w-7 h-7 fill-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-sage-950">
                  {t.auth.continueAsPatient}
                </h3>
                <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-0.5">
                  {t.auth.patientRoleDesc}
                </p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-sage-700 group-hover:translate-x-1 transition flex-shrink-0" />
          </button>

          {/* Caregiver Role Button */}
          <button
            onClick={handleCaregiverClick}
            className="w-full text-left p-5 rounded-3xl bg-white hover:bg-warm-50 border-3 border-warm-300 hover:border-warm-400 transition-all duration-200 active:scale-95 shadow-sm flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-warm-100 text-warm-800 flex items-center justify-center border border-warm-300 group-hover:scale-105 transition">
                <Shield className="w-7 h-7 text-sage-700" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  {t.auth.continueAsCaregiver}
                </h3>
                <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-0.5">
                  {t.auth.caregiverRoleDesc}
                </p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition flex-shrink-0" />
          </button>
        </div>

        {/* Demo Notice */}
        <p className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          {t.auth.demoNotice}
        </p>
      </div>

      <CaregiverPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
};
