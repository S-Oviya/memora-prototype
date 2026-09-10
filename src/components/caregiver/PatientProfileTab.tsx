import React, { useState } from 'react';
import { User, Heart, Shield, Check, Save } from 'lucide-react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.savePatient(formData);
    onUpdatePatient(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
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
    </div>
  );
};
