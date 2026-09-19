import React, { useState } from 'react';
import { Plus, Clock, Trash2, Sun, Moon, Coffee, Utensils, Footprints, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { RoutineItem, RoutinePeriod } from '../../types';
import { db } from '../../services/db';
import { getRoutineItemTitle } from '../../services/seedData';
import { AccessibleButton } from '../common/AccessibleButton';

interface RoutineManagerTabProps {
  routines: RoutineItem[];
  patientId: string;
  onRefresh: () => void;
}

export const RoutineManagerTab: React.FC<RoutineManagerTabProps> = ({
  routines,
  patientId,
  onRefresh,
}) => {
  const { t, language } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [time, setTime] = useState('08:00 AM');
  const [period, setPeriod] = useState<RoutinePeriod>('morning');
  const [titleEn, setTitleEn] = useState('');
  const [titleAs, setTitleAs] = useState('');
  const [icon, setIcon] = useState('coffee');

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoutine: RoutineItem = {
      id: 'routine-' + Date.now(),
      patientId,
      time,
      period,
      titleEn,
      titleAs: titleAs || titleEn,
      icon,
      order: routines.length + 1,
      completed: false,
    };

    db.addRoutine(newRoutine);
    onRefresh();
    setShowAddModal(false);
    setTitleEn('');
    setTitleAs('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this routine activity?')) {
      db.deleteRoutine(id);
      onRefresh();
    }
  };

  const getPeriodIcon = (period: RoutinePeriod) => {
    switch (period) {
      case 'morning':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'afternoon':
        return <Sun className="w-4 h-4 text-orange-500" />;
      case 'evening':
        return <Moon className="w-4 h-4 text-indigo-500" />;
      case 'night':
        return <Moon className="w-4 h-4 text-purple-500" />;
    }
  };

  const sortedRoutines = [...routines].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">
            {t.caregiver.routine.title}
          </h2>
          <p className="text-sm text-gray-500">
            {t.caregiver.routine.subtitle}
          </p>
        </div>

        <AccessibleButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowAddModal(true)}
          className="flex-shrink-0"
        >
          {t.caregiver.routine.addItem}
        </AccessibleButton>
      </div>

      {/* Routine Timeline Cards */}
      {sortedRoutines.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-base text-gray-600 font-medium max-w-md mx-auto">
            {t.caregiver.routine.emptyRoutine}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRoutines.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-sage-100 hover:border-sage-300 flex items-center justify-between shadow-xs transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sage-50 text-sage-800 font-extrabold flex items-center justify-center border border-sage-200">
                  {idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sage-600" />
                      {item.time}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-warm-100 px-2 py-0.5 rounded-full text-warm-800">
                      {getPeriodIcon(item.period)}
                      <span>{t.caregiver.routine.periods[item.period] || item.period}</span>
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-gray-900">
                    {getRoutineItemTitle(item, language)}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {language === 'en' ? item.titleAs : item.titleEn}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                title={t.caregiver.routine.deleteItem}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Routine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-sage-200">
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {t.caregiver.routine.addItem}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t.caregiver.routine.subtitle}
            </p>

            <form onSubmit={handleAddRoutine} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t.caregiver.routine.time} *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold"
                    placeholder="e.g. 08:30 AM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t.caregiver.routine.period}
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as RoutinePeriod)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold bg-white"
                  >
                    <option value="morning">{t.caregiver.routine.periods.morning}</option>
                    <option value="afternoon">{t.caregiver.routine.periods.afternoon}</option>
                    <option value="evening">{t.caregiver.routine.periods.evening}</option>
                    <option value="night">{t.caregiver.routine.periods.night}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.routine.titleEn} *
                </label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold"
                  placeholder="e.g. Breakfast & Morning Medicine"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.routine.titleAs}
                </label>
                <input
                  type="text"
                  value={titleAs}
                  onChange={(e) => setTitleAs(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold"
                  placeholder="e.g. পুৱাৰ আহাৰ আৰু ঔষধ"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 text-sm"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-sage-600 text-white hover:bg-sage-700 text-sm shadow-md"
                >
                  {t.caregiver.routine.saveRoutine}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
