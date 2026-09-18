import React, { useState } from 'react';
import { User, Heart, Shield, Check, Save, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { Patient, DementiaStage, Language } from '../../types';
import { db } from '../../services/db';
import { AccessibleButton } from '../common/AccessibleButton';

interface PatientProfileTabProps {
  patient: Patient;
  onUpdatePatient: (updated: Patient) => void;
}

export const PatientProfileTab: React.FC<PatientProfileTabProps> = ({
  patient,
  onUpdatePatient,
}) => {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<Patient>({ ...patient });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Caregiver Password Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.savePatient(formData);
    onUpdatePatient(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (!newPassword || newPassword.trim() === '') {
      setPwdError('New password cannot be empty.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirm password do not match.');
      return;
    }

    if (!db.verifyCaregiverPin(currentPassword)) {
      setPwdError('Current password is incorrect.');
      return;
    }

    const result = db.changeCaregiverPassword(currentPassword, newPassword.trim());
    if (result.success) {
      setPwdSuccess("Password updated successfully! The initial setup password '1234' is now disabled.");
      // Clear fields to avoid displaying password in plain text after submission
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setTimeout(() => {
        setPwdSuccess(null);
      }, 5000);
    } else {
      setPwdError(result.error || 'Failed to update password.');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-sage-100 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-1">
          {t.caregiver.profile.title}
        </h2>
        <p className="text-sm text-gray-500">
          {t.caregiver.profile.subtitle}
        </p>
      </div>

      {savedSuccess && (
        <div className="mb-6 bg-emerald-50 border-2 border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-bold text-sm">{t.caregiver.profile.savedSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            {t.caregiver.profile.name}
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-semibold text-gray-900 outline-none transition"
            placeholder="e.g. Ramesh Chandra Baruah"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Age */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t.caregiver.profile.age}
            </label>
            <input
              type="number"
              min="40"
              max="115"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-semibold text-gray-900 outline-none transition"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {t.caregiver.profile.preferredLang}
            </label>
            <select
              value={formData.preferredLanguage}
              onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value as Language })}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-semibold text-gray-900 outline-none transition bg-white"
            >
              <option value="as">অসমীয়া (Assamese)</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Dementia Type */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            {t.caregiver.profile.dementiaType}
          </label>
          <input
            type="text"
            required
            value={formData.dementiaType}
            onChange={(e) => setFormData({ ...formData, dementiaType: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-semibold text-gray-900 outline-none transition"
            placeholder="e.g. Alzheimer's Disease / Vascular Dementia"
          />
        </div>

        {/* Dementia Stage */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            {t.caregiver.profile.stage}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'early', label: t.caregiver.profile.stages.early, desc: 'Mild forgetfulness, high independence' },
              { id: 'mild', label: t.caregiver.profile.stages.mild, desc: 'Needs gentle routine reminders' },
              { id: 'moderate', label: t.caregiver.profile.stages.moderate, desc: 'Requires family visual cues' },
              { id: 'advanced', label: t.caregiver.profile.stages.advanced, desc: 'Deep sensory and voice comfort' },
            ].map((st) => (
              <label
                key={st.id}
                className={`p-4 rounded-2xl border-2 flex flex-col cursor-pointer transition-all ${
                  formData.dementiaStage === st.id
                    ? 'border-sage-600 bg-sage-50 text-sage-900 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-sm">{st.label}</span>
                  <input
                    type="radio"
                    name="dementiaStage"
                    checked={formData.dementiaStage === st.id}
                    onChange={() => setFormData({ ...formData, dementiaStage: st.id as DementiaStage })}
                    className="w-4 h-4 text-sage-600 focus:ring-sage-500"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">{st.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            {t.caregiver.profile.notes}
          </label>
          <textarea
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-medium text-gray-900 outline-none transition"
            placeholder="e.g. Loved gardening in Tezpur; enjoys hearing grandson call him 'Koka'."
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <AccessibleButton
            type="submit"
            variant="primary"
            size="lg"
            icon={<Save className="w-5 h-5" />}
            className="w-full sm:w-auto"
          >
            {t.caregiver.profile.saveButton}
          </AccessibleButton>
        </div>
      </form>

      {/* Caregiver Security & Password Management Section */}
      <div className="mt-8 pt-8 border-t-2 border-sage-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-sage-100 text-sage-800 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5 text-sage-700" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900">Caregiver Security & Password</h3>
            <p className="text-xs text-gray-500 font-medium">
              Manage the password required to access the Caregiver Portal.
            </p>
          </div>
        </div>

        {pwdSuccess && (
          <div className="my-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-sm">{pwdSuccess}</span>
          </div>
        )}

        {pwdError && (
          <div className="my-4 bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-2xl flex items-center gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="font-bold text-sm">{pwdError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 mt-4 max-w-lg">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setPwdError(null);
                }}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-semibold text-gray-900 outline-none transition bg-white"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg focus:outline-none"
                title={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwdError(null);
                }}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-semibold text-gray-900 outline-none transition bg-white"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg focus:outline-none"
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPwdError(null);
                }}
                className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-200 focus:border-sage-500 focus:ring-4 focus:ring-sage-100 font-semibold text-gray-900 outline-none transition bg-white"
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg focus:outline-none"
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <AccessibleButton
              type="submit"
              variant="primary"
              size="md"
              icon={<KeyRound className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Change Password
            </AccessibleButton>
          </div>
        </form>
      </div>
    </div>
  );
};
