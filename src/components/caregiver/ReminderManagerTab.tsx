import React, { useState } from 'react';
import {
  Plus,
  Clock,
  Trash2,
  Edit3,
  Check,
  Pill,
  Droplets,
  Calendar,
  Stethoscope,
  Activity,
  Bell,
  Search,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { ReminderItem, ReminderType } from '../../types';
import { db } from '../../services/db';
import { getReminderTitle, getReminderNotes } from '../../services/seedData';
import { AccessibleButton } from '../common/AccessibleButton';

interface ReminderManagerTabProps {
  reminders: ReminderItem[];
  patientId: string;
  onRefresh: () => void;
}

export const ReminderManagerTab: React.FC<ReminderManagerTabProps> = ({
  reminders,
  patientId,
  onRefresh,
}) => {
  const { t, language } = useLanguage();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  // Filter & Search State
  const [activeFilter, setActiveFilter] = useState<ReminderType | 'all'>('all');
  const [onlyActive, setOnlyActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [titleEn, setTitleEn] = useState('');
  const [titleAs, setTitleAs] = useState('');
  const [type, setType] = useState<ReminderType>('medicine');
  const [time, setTime] = useState('09:00 AM');
  const [schedule, setSchedule] = useState('Daily');
  const [notesEn, setNotesEn] = useState('');
  const [notesAs, setNotesAs] = useState('');
  const [enabled, setEnabled] = useState(true);

  const openAddModal = () => {
    setEditingReminder(null);
    setTitleEn('');
    setTitleAs('');
    setType('medicine');
    setTime('09:00 AM');
    setSchedule('Daily');
    setNotesEn('');
    setNotesAs('');
    setEnabled(true);
    setShowModal(true);
  };

  const openEditModal = (item: ReminderItem) => {
    setEditingReminder(item);
    setTitleEn(item.titleEn || item.title || '');
    setTitleAs(item.titleAs || '');
    setType(item.type);
    setTime(item.time);
    setSchedule(item.schedule || 'Daily');
    setNotesEn(item.notesEn || item.notes || '');
    setNotesAs(item.notesAs || '');
    setEnabled(item.enabled);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) return;

    if (editingReminder) {
      const updated: ReminderItem = {
        ...editingReminder,
        title: titleEn.trim(),
        titleEn: titleEn.trim(),
        titleAs: titleAs.trim() || undefined,
        type,
        time: time.trim(),
        schedule: schedule.trim() || 'Daily',
        notes: notesEn.trim() || undefined,
        notesEn: notesEn.trim() || undefined,
        notesAs: notesAs.trim() || undefined,
        enabled,
      };
      db.updateReminder(updated);
    } else {
      const newReminder: ReminderItem = {
        id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        patientId,
        title: titleEn.trim(),
        titleEn: titleEn.trim(),
        titleAs: titleAs.trim() || undefined,
        type,
        time: time.trim(),
        schedule: schedule.trim() || 'Daily',
        notes: notesEn.trim() || undefined,
        notesEn: notesEn.trim() || undefined,
        notesAs: notesAs.trim() || undefined,
        enabled,
        completedToday: false,
        createdAt: new Date().toISOString(),
      };
      db.addReminder(newReminder);
    }

    onRefresh();
    setShowModal(false);
  };

  const handleToggle = (id: string, currentStatus: boolean) => {
    db.toggleReminder(id, !currentStatus);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (confirm(t.caregiver.reminders.confirmDelete)) {
      db.deleteReminder(id);
      onRefresh();
    }
  };

  const getTypeIcon = (remType: ReminderType, sizeClass = 'w-5 h-5') => {
    switch (remType) {
      case 'medicine':
        return <Pill className={`${sizeClass} text-rose-600`} />;
      case 'hydration':
        return <Droplets className={`${sizeClass} text-sky-600`} />;
      case 'activity':
        return <Activity className={`${sizeClass} text-emerald-600`} />;
      case 'appointment':
        return <Stethoscope className={`${sizeClass} text-indigo-600`} />;
    }
  };

  const getTypeBadgeStyle = (remType: ReminderType) => {
    switch (remType) {
      case 'medicine':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'hydration':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'activity':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'appointment':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  // Filter and sort reminders
  const filteredReminders = reminders.filter((item) => {
    if (activeFilter !== 'all' && item.type !== activeFilter) return false;
    if (onlyActive && !item.enabled) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = getReminderTitle(item, language).toLowerCase();
      const notes = getReminderNotes(item, language).toLowerCase();
      const sched = (item.schedule || '').toLowerCase();
      const tStr = item.time.toLowerCase();
      return title.includes(q) || notes.includes(q) || sched.includes(q) || tStr.includes(q);
    }
    return true;
  });

  const activeCount = reminders.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-gray-900">
              {t.caregiver.reminders.title}
            </h2>
            <span className="bg-sage-100 text-sage-800 text-xs font-black px-2.5 py-1 rounded-full">
              {activeCount} {t.caregiver.reminders.active}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {t.caregiver.reminders.subtitle}
          </p>
        </div>

        <AccessibleButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={openAddModal}
          className="flex-shrink-0"
        >
          {t.caregiver.reminders.addItem}
        </AccessibleButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border-2 border-sage-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeFilter === 'all'
                ? 'bg-sage-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.caregiver.reminders.filterAll} ({reminders.length})
          </button>
          <button
            onClick={() => setActiveFilter('medicine')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeFilter === 'medicine'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>{t.caregiver.reminders.types.medicine}</span>
          </button>
          <button
            onClick={() => setActiveFilter('hydration')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeFilter === 'hydration'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>{t.caregiver.reminders.types.hydration}</span>
          </button>
          <button
            onClick={() => setActiveFilter('activity')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeFilter === 'activity'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t.caregiver.reminders.types.activity}</span>
          </button>
          <button
            onClick={() => setActiveFilter('appointment')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              activeFilter === 'appointment'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>{t.caregiver.reminders.types.appointment}</span>
          </button>
        </div>

        {/* Search & Active-Only Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600 select-none">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="w-4 h-4 rounded text-sage-600 focus:ring-sage-500"
            />
            <span>{t.caregiver.reminders.filterActive}</span>
          </label>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reminders..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 focus:border-sage-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-base text-gray-600 font-medium max-w-md mx-auto">
            {t.caregiver.reminders.emptyList}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReminders.map((item) => {
            const displayTitle = getReminderTitle(item, language);
            const displayNotes = getReminderNotes(item, language);
            const typeLabel = t.caregiver.reminders.types[item.type] || item.type;

            return (
              <div
                key={item.id}
                className={`bg-white p-5 rounded-3xl border-2 transition-all shadow-xs flex flex-col justify-between ${
                  item.enabled
                    ? 'border-sage-100 hover:border-sage-300 hover:shadow-md'
                    : 'border-gray-200 bg-gray-50/70 opacity-75'
                }`}
              >
                <div>
                  {/* Card Header: Type Badge & Enable/Disable toggle */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${getTypeBadgeStyle(
                          item.type
                        )}`}
                      >
                        {getTypeIcon(item.type, 'w-3.5 h-3.5')}
                        <span>{typeLabel}</span>
                      </span>

                      {item.completedToday && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t.patient.reminders.completed}</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggle(item.id, item.enabled)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                        item.enabled
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      title={item.enabled ? t.caregiver.reminders.disable : t.caregiver.reminders.enable}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.enabled ? 'bg-emerald-600 animate-pulse' : 'bg-gray-400'
                        }`}
                      />
                      <span>{item.enabled ? t.caregiver.reminders.active : t.caregiver.reminders.inactive}</span>
                    </button>
                  </div>

                  {/* Title & Timing */}
                  <h3 className="text-lg font-black text-gray-900 leading-snug mb-1">
                    {displayTitle}
                  </h3>

                  {/* Subtitle / Alternate language if present */}
                  {language === 'en' && item.titleAs && (
                    <p className="text-xs text-gray-500 font-medium mb-2">{item.titleAs}</p>
                  )}
                  {language !== 'en' && item.titleEn && item.titleEn !== displayTitle && (
                    <p className="text-xs text-gray-500 font-medium mb-2">{item.titleEn}</p>
                  )}

                  {/* Schedule & Time Pills */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-sage-50 px-2.5 py-1 rounded-lg border border-sage-200">
                      <Clock className="w-3.5 h-3.5 text-sage-600" />
                      <span>{item.time}</span>
                    </span>

                    {item.schedule && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{item.schedule}</span>
                      </span>
                    )}
                  </div>

                  {/* Notes if available */}
                  {displayNotes && (
                    <div className="bg-warm-50/70 p-2.5 rounded-xl border border-warm-200/60 text-xs text-gray-700 font-medium leading-relaxed mb-4">
                      {displayNotes}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                  <span className="text-[11px] text-gray-400 font-medium">
                    ID: {item.id}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-2 text-gray-500 hover:text-sage-700 rounded-xl hover:bg-sage-50 transition"
                      title={t.caregiver.reminders.editItem}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                      title={t.caregiver.reminders.deleteItem}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-sage-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {editingReminder
                ? t.caregiver.reminders.editItem
                : t.caregiver.reminders.addItem}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t.caregiver.reminders.subtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t.caregiver.reminders.type} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['medicine', 'hydration', 'activity', 'appointment'] as ReminderType[]).map(
                    (cat) => {
                      const isSelected = type === cat;
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setType(cat)}
                          className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-xs font-bold transition text-left ${
                            isSelected
                              ? 'border-sage-600 bg-sage-50 text-sage-950 shadow-xs'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-sage-300'
                          }`}
                        >
                          {getTypeIcon(cat, 'w-4 h-4')}
                          <span>{t.caregiver.reminders.types[cat]}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Title (English) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.reminders.titleEn} *
                </label>
                <input
                  type="text"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold focus:border-sage-500 focus:outline-none text-sm"
                  placeholder="e.g. Afternoon Blood Pressure Tablet"
                />
              </div>

              {/* Title (Regional / Optional) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.reminders.titleAs}
                </label>
                <input
                  type="text"
                  value={titleAs}
                  onChange={(e) => setTitleAs(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold focus:border-sage-500 focus:outline-none text-sm"
                  placeholder="e.g. দুপৰীয়াৰ ৰক্তচাপৰ ঔষধ"
                />
              </div>

              {/* Time & Schedule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t.caregiver.reminders.time} *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold focus:border-sage-500 focus:outline-none text-sm"
                    placeholder="e.g. 09:00 AM or 14:30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t.caregiver.reminders.schedule}
                  </label>
                  <input
                    type="text"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold focus:border-sage-500 focus:outline-none text-sm"
                    placeholder="e.g. Daily, Every 2 hours, Mon/Wed/Fri"
                  />
                </div>
              </div>

              {/* Notes (English) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.reminders.notes}
                </label>
                <textarea
                  rows={2}
                  value={notesEn}
                  onChange={(e) => setNotesEn(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-medium focus:border-sage-500 focus:outline-none text-xs"
                  placeholder="e.g. Take with a glass of warm water after lunch."
                />
              </div>

              {/* Notes (Regional / Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Notes in Regional Language (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notesAs}
                  onChange={(e) => setNotesAs(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-medium focus:border-sage-500 focus:outline-none text-xs"
                  placeholder="e.g. দুপৰীয়াৰ আহাৰৰ পাছত এগিলাচ কুহুমীয়া পানীৰ সৈতে খাব।"
                />
              </div>

              {/* Enabled Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-sage-50 rounded-2xl border border-sage-200">
                <input
                  type="checkbox"
                  id="reminder-enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-sage-600 focus:ring-sage-500"
                />
                <label
                  htmlFor="reminder-enabled"
                  className="text-sm font-bold text-sage-950 cursor-pointer select-none"
                >
                  {t.caregiver.reminders.status}: {enabled ? t.caregiver.reminders.active : t.caregiver.reminders.inactive}
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 text-sm transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-sage-600 text-white hover:bg-sage-700 text-sm shadow-md transition"
                >
                  {t.caregiver.reminders.saveReminder}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
