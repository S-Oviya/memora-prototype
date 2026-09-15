import React, { useState } from 'react';
import { Sparkles, Globe, Heart, Shield, Play, LogOut } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../locales/LanguageContext';
import { UserRole } from '../../types';
import { CaregiverPinModal } from './CaregiverPinModal';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  patientName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange, patientName }) => {
  const { language, setLanguage, t } = useLanguage();
  const [showPinModal, setShowPinModal] = useState(false);

  const handlePatientExit = () => {
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    onRoleChange('caregiver');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-sage-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-sage-500 to-sage-700 flex items-center justify-center text-white shadow-md shadow-sage-900/10">
              <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-sage-900">
                  Memora
                </span>
                <span className="text-sm sm:text-base font-semibold text-sage-600 bg-sage-50 px-2 py-0.5 rounded-lg border border-sage-200">
                  মেমোৰা
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 hidden xs:block">
                {currentRole === 'caregiver' ? t.app.roleCaregiver : t.app.tagline}
              </p>
            </div>
          </div>

          {/* Right Controls: Language & Role Switch */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector supporting 8 Northeast & Regional Languages */}
            <div className="relative flex items-center bg-warm-100 hover:bg-warm-200 px-2.5 py-1 rounded-xl border border-warm-300 transition">
              <Globe className="w-4 h-4 text-sage-700 mr-1.5 flex-shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-transparent text-xs sm:text-sm font-bold text-gray-800 focus:outline-none cursor-pointer py-1 pr-1"
                aria-label="Select Language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-gray-900 bg-white font-medium">
                    {lang.nativeLabel} ({lang.label})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher Button */}
            {currentRole === 'caregiver' ? (
              <button
                onClick={() => onRoleChange('patient')}
                className="flex items-center gap-2 bg-sage-600 hover:bg-sage-700 active:bg-sage-800 text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition border-2 border-sage-700"
              >
                <Play className="w-4 h-4 fill-white" />
                <span className="hidden sm:inline">{t.app.switchToPatient}</span>
                <span className="sm:hidden">{language === 'as' ? 'খেলক' : 'Play'}</span>
              </button>
            ) : (
              <button
                onClick={handlePatientExit}
                className="flex items-center gap-1.5 bg-warm-100 hover:bg-warm-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-warm-300 transition"
                title={t.app.switchToCaregiver}
              >
                <Shield className="w-4 h-4 text-sage-700" />
                <span className="hidden sm:inline">{t.app.roleCaregiver}</span>
                <LogOut className="w-3.5 h-3.5 sm:hidden" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Caregiver PIN Verification Modal */}
      <CaregiverPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
      />
    </>
  );
};
