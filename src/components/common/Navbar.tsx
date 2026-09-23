import React, { useState } from 'react';
import { Sparkles, Globe, Heart, Shield, Play, LogOut, Stethoscope } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../locales/LanguageContext';
import { UserRole } from '../../types';
import { CaregiverPinModal } from './CaregiverPinModal';
import { HealthcarePinModal } from './HealthcarePinModal';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  patientName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRole, onRoleChange, patientName }) => {
  const { language, setLanguage, t } = useLanguage();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showHealthcarePinModal, setShowHealthcarePinModal] = useState(false);

  const handlePatientExit = () => {
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    onRoleChange('caregiver');
  };

  const handleHealthcareSuccess = () => {
    setShowHealthcarePinModal(false);
    onRoleChange('healthcare_worker');
  };

  const getRoleLabel = () => {
    if (currentRole === 'caregiver') return t.app.roleCaregiver;
    if (currentRole === 'healthcare_worker') {
      return language === 'as' ? 'স্বাস্থ্যকৰ্মী পৰ্যবেক্ষণ (কেৱল পঢ়িব পৰা)' : 'Healthcare Worker (Read-Only)';
    }
    return t.app.tagline;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-sage-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                currentRole === 'healthcare_worker'
                  ? 'bg-gradient-to-br from-teal-600 to-teal-800 shadow-teal-900/10'
                  : 'bg-gradient-to-br from-sage-500 to-sage-700 shadow-sage-900/10'
              }`}
            >
              {currentRole === 'healthcare_worker' ? (
                <Stethoscope className="w-6 h-6 sm:w-7 sm:h-7 text-teal-100" />
              ) : (
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white/20" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-sage-900">
                  Memora
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 hidden xs:block">
                {getRoleLabel()}
              </p>
            </div>
          </div>

          {/* Right Controls: Language & Role Switch */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
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

            {/* Role Switcher Buttons */}
            {currentRole === 'patient' && (
              <>
                <button
                  onClick={() => setShowHealthcarePinModal(true)}
                  className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-teal-200 transition"
                  title={language === 'as' ? 'স্বাস্থ্যকৰ্মী পৰ্যবেক্ষণলৈ যাওক' : 'Healthcare Worker View'}
                >
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  <span className="hidden sm:inline">
                    {language === 'as' ? 'স্বাস্থ্যকৰ্মী' : 'Healthcare'}
                  </span>
                </button>
                <button
                  onClick={handlePatientExit}
                  className="flex items-center gap-1.5 bg-warm-100 hover:bg-warm-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-warm-300 transition"
                  title={t.app.switchToCaregiver}
                >
                  <Shield className="w-4 h-4 text-sage-700" />
                  <span className="hidden sm:inline">{t.app.roleCaregiver}</span>
                  <LogOut className="w-3.5 h-3.5 sm:hidden" />
                </button>
              </>
            )}

            {currentRole === 'caregiver' && (
              <>
                <button
                  onClick={() => setShowHealthcarePinModal(true)}
                  className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-teal-200 transition"
                  title={language === 'as' ? 'স্বাস্থ্যকৰ্মী পৰ্যবেক্ষণলৈ যাওক' : 'Healthcare Worker View'}
                >
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  <span className="hidden sm:inline">
                    {language === 'as' ? 'স্বাস্থ্যকৰ্মী' : 'Healthcare'}
                  </span>
                </button>
                <button
                  onClick={() => onRoleChange('patient')}
                  className="flex items-center gap-2 bg-sage-600 hover:bg-sage-700 active:bg-sage-800 text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition border-2 border-sage-700"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span className="hidden sm:inline">{t.app.switchToPatient}</span>
                  <span className="sm:hidden">{language === 'as' ? 'খেলক' : 'Play'}</span>
                </button>
              </>
            )}

            {currentRole === 'healthcare_worker' && (
              <>
                <button
                  onClick={() => setShowPinModal(true)}
                  className="flex items-center gap-1.5 bg-warm-100 hover:bg-warm-200 text-gray-700 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-warm-300 transition"
                  title={t.app.switchToCaregiver}
                >
                  <Shield className="w-4 h-4 text-sage-700" />
                  <span className="hidden sm:inline">{t.app.roleCaregiver}</span>
                </button>
                <button
                  onClick={() => onRoleChange('patient')}
                  className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition border-2 border-teal-800"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span className="hidden sm:inline">{t.app.switchToPatient}</span>
                  <span className="sm:hidden">{language === 'as' ? 'খেলক' : 'Play'}</span>
                </button>
              </>
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

      {/* Healthcare PIN Verification Modal */}
      <HealthcarePinModal
        isOpen={showHealthcarePinModal}
        onClose={() => setShowHealthcarePinModal(false)}
        onSuccess={handleHealthcareSuccess}
      />
    </>
  );
};
