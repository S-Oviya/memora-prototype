import React, { useState, useMemo } from 'react';
import {
  Plus,
  Clock,
  Trash2,
  Edit3,
  Sun,
  Moon,
  Coffee,
  Utensils,
  Footprints,
  Sparkles,
  Check,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Search,
  Pill,
  BookOpen,
  Heart,
  Calendar,
} from 'lucide-react';
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

const ICON_OPTIONS = [
  { id: 'coffee', labelEn: 'Tea / Drink', icon: <Coffee className="w-5 h-5 text-amber-600" /> },
  { id: 'utensils', labelEn: 'Meal / Food', icon: <Utensils className="w-5 h-5 text-orange-600" /> },
  { id: 'pill', labelEn: 'Medicine', icon: <Pill className="w-5 h-5 text-rose-600" /> },
  { id: 'footprints', labelEn: 'Walk / Veranda', icon: <Footprints className="w-5 h-5 text-emerald-600" /> },
  { id: 'sparkles', labelEn: 'Prayer / Music', icon: <Sparkles className="w-5 h-5 text-indigo-600" /> },
  { id: 'book', labelEn: 'Reading', icon: <BookOpen className="w-5 h-5 text-sky-600" /> },
  { id: 'sun', labelEn: 'Morning Sunlight', icon: <Sun className="w-5 h-5 text-yellow-500" /> },
  { id: 'moon', labelEn: 'Evening / Sleep', icon: <Moon className="w-5 h-5 text-purple-600" /> },
  { id: 'heart', labelEn: 'Rest / Relaxation', icon: <Heart className="w-5 h-5 text-pink-600" /> },
];

export const RoutineManagerTab: React.FC<RoutineManagerTabProps> = ({
  routines,
  patientId,
  onRefresh,
}) => {
  const { t, language } = useLanguage();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutineItem | null>(null);

  // Filters & Search
  const [periodFilter, setPeriodFilter] = useState<RoutinePeriod | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [time, setTime] = useState('08:00 AM');
  const [period, setPeriod] = useState<RoutinePeriod>('morning');
  const [titleEn, setTitleEn] = useState('');
  const [titleAs, setTitleAs] = useState('');
  const [icon, setIcon] = useState('coffee');

  const openAddModal = () => {
    setEditingItem(null);
    setTime('08:00 AM');
    setPeriod('morning');
    setTitleEn('');
    setTitleAs('');
    setIcon('coffee');
    setShowModal(true);
  };

  const openEditModal = (item: RoutineItem) => {
    setEditingItem(item);
    setTime(item.time);
    setPeriod(item.period);
    setTitleEn(item.titleEn);
    setTitleAs(item.titleAs || item.titles?.[language] || '');
    setIcon(item.icon || 'coffee');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim()) return;

    if (editingItem) {
      const updated: RoutineItem = {
        ...editingItem,
        time: time.trim(),
        period,
        titleEn: titleEn.trim(),
        titleAs: titleAs.trim() || titleEn.trim(),
        titles: {
          ...(editingItem.titles || {}),
          [language]: titleAs.trim() || titleEn.trim(),
          en: titleEn.trim(),
        },
        icon,
      };
      db.updateRoutine(updated);
    } else {
      const newRoutine: RoutineItem = {
        id: 'routine-' + Date.now(),
        patientId,
        time: time.trim(),
        period,
        titleEn: titleEn.trim(),
        titleAs: titleAs.trim() || titleEn.trim(),
        titles: {
          [language]: titleAs.trim() || titleEn.trim(),
          en: titleEn.trim(),
        },
        icon,
        order: routines.length + 1,
        completed: false,
      };
      db.addRoutine(newRoutine);
    }

    onRefresh();
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const promptText =
      (t.caregiver.routine as any).confirmDelete ||
      'Are you sure you want to delete this routine activity?';
    if (confirm(promptText)) {
      db.deleteRoutine(id);
      onRefresh();
    }
  };

  const handleToggleCompleted = (id: string) => {
    db.toggleRoutineCompleted(id);
    onRefresh();
  };

  const handleMoveUp = (index: number, sortedList: RoutineItem[]) => {
    if (index <= 0) return;
    const reordered = [...sortedList];
    const temp = reordered[index];
    reordered[index] = reordered[index - 1];
    reordered[index - 1] = temp;
    db.reorderRoutines(reordered);
    onRefresh();
  };

  const handleMoveDown = (index: number, sortedList: RoutineItem[]) => {
    if (index >= sortedList.length - 1) return;
    const reordered = [...sortedList];
    const temp = reordered[index];
    reordered[index] = reordered[index + 1];
    reordered[index + 1] = temp;
    db.reorderRoutines(reordered);
    onRefresh();
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

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'coffee':
        return <Coffee className="w-5 h-5 text-amber-700" />;
      case 'utensils':
        return <Utensils className="w-5 h-5 text-orange-700" />;
      case 'pill':
        return <Pill className="w-5 h-5 text-rose-700" />;
      case 'footprints':
        return <Footprints className="w-5 h-5 text-emerald-700" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-indigo-700" />;
      case 'book':
        return <BookOpen className="w-5 h-5 text-sky-700" />;
      case 'sun':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'moon':
        return <Moon className="w-5 h-5 text-purple-600" />;
      case 'heart':
      default:
        return <Heart className="w-5 h-5 text-rose-600" />;
    }
  };

  const sortedRoutines = useMemo(() => {
    return [...routines].sort((a, b) => a.order - b.order);
  }, [routines]);

  const filteredRoutines = useMemo(() => {
    return sortedRoutines.filter((item) => {
      if (periodFilter !== 'all' && item.period !== periodFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const title = getRoutineItemTitle(item, language).toLowerCase();
        const timeStr = item.time.toLowerCase();
        if (!title.includes(q) && !timeStr.includes(q) && !item.titleEn.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [sortedRoutines, periodFilter, searchQuery, language]);

  const completedCount = sortedRoutines.filter((r) => r.completed).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-sage-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-sage-100 text-sage-800 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5 text-sage-700" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">
              {t.caregiver.routine.title}
            </h2>
          </div>
          <p className="text-sm text-gray-500">
            {t.caregiver.routine.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-sage-50 border border-sage-200 px-4 py-2 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-sage-900">
              {completedCount} / {sortedRoutines.length} {(t.caregiver.routine as any).completedToday || 'Completed Today'}
            </span>
          </div>

          <AccessibleButton
            variant="primary"
            size="md"
            icon={<Plus className="w-5 h-5" />}
            onClick={openAddModal}
            className="flex-shrink-0"
          >
            {t.caregiver.routine.addItem}
          </AccessibleButton>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-sage-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={(t.caregiver.routine as any).searchPlaceholder || 'Search routines by name or time...'}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:border-sage-400 focus:outline-none transition"
          />
        </div>

        {/* Period Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap border ${
              periodFilter === 'all'
                ? 'bg-sage-700 text-white border-sage-800'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {(t.caregiver.routine as any).filterAll || 'All Day'} ({sortedRoutines.length})
          </button>
          {(['morning', 'afternoon', 'evening', 'night'] as RoutinePeriod[]).map((p) => {
            const count = sortedRoutines.filter((r) => r.period === p).length;
            const isActive = periodFilter === p;
            return (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 whitespace-nowrap border ${
                  isActive
                    ? 'bg-sage-700 text-white border-sage-800'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {getPeriodIcon(p)}
                <span>{t.caregiver.routine.periods[p] || p}</span>
                <span className="opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Timeline Cards List */}
      {filteredRoutines.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-base text-gray-600 font-medium max-w-md mx-auto">
            {t.caregiver.routine.emptyRoutine}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRoutines.map((item) => {
            const globalIndex = sortedRoutines.findIndex((r) => r.id === item.id);
            const isFirst = globalIndex === 0;
            const isLast = globalIndex === sortedRoutines.length - 1;

            return (
              <div
                key={item.id}
                className={`bg-white p-4 sm:p-5 rounded-2xl border-2 transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.completed
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-sage-100 hover:border-sage-300'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Sequence Order Badge */}
                  <div className="w-10 h-10 rounded-xl bg-sage-50 text-sage-900 font-black flex items-center justify-center border border-sage-200 flex-shrink-0 text-base">
                    {item.order}
                  </div>

                  {/* Icon Badge */}
                  <div className="w-10 h-10 rounded-xl bg-warm-50 border border-warm-200 flex items-center justify-center flex-shrink-0">
                    {renderIcon(item.icon)}
                  </div>

                  {/* Routine Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-sage-600" />
                        {item.time}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-warm-100 px-2 py-0.5 rounded-full text-warm-800">
                        {getPeriodIcon(item.period)}
                        <span>{t.caregiver.routine.periods[item.period] || item.period}</span>
                      </span>
                      {item.completed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          <span>{(t.caregiver.routine as any).completedToday || 'Done'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-gray-900 leading-snug">
                      {getRoutineItemTitle(item, language)}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {language === 'en' ? item.titleAs : item.titleEn}
                    </p>
                  </div>
                </div>

                {/* Actions: Reorder, Toggle, Edit, Delete */}
                <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                  {/* Move Earlier in chronological order */}
                  <button
                    onClick={() => handleMoveUp(globalIndex, sortedRoutines)}
                    disabled={isFirst}
                    className={`p-2 rounded-xl border transition ${
                      isFirst
                        ? 'opacity-30 cursor-not-allowed border-gray-100 text-gray-300'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-sage-800'
                    }`}
                    title={(t.caregiver.routine as any).reorderUp || 'Move Earlier'}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Move Later in chronological order */}
                  <button
                    onClick={() => handleMoveDown(globalIndex, sortedRoutines)}
                    disabled={isLast}
                    className={`p-2 rounded-xl border transition ${
                      isLast
                        ? 'opacity-30 cursor-not-allowed border-gray-100 text-gray-300'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-sage-800'
                    }`}
                    title={(t.caregiver.routine as any).reorderDown || 'Move Later'}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* Toggle Completed for Today */}
                  <button
                    onClick={() => handleToggleCompleted(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                      item.completed
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                    title="Toggle today completion"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {item.completed
                        ? (t.caregiver.routine as any).completedToday || 'Done'
                        : (t.caregiver.routine as any).markDone || 'Mark Done'}
                    </span>
                  </button>

                  {/* Edit Routine */}
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 text-gray-600 hover:text-sage-800 rounded-xl hover:bg-sage-50 transition border border-gray-200"
                    title={(t.caregiver.routine as any).editItem || 'Edit Routine'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete Routine */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition border border-gray-200"
                    title={t.caregiver.routine.deleteItem}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Routine Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-4 border-sage-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {editingItem
                ? (t.caregiver.routine as any).editItem || 'Edit Routine Step'
                : t.caregiver.routine.addItem}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t.caregiver.routine.subtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t.caregiver.routine.time} *
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold focus:border-sage-500 focus:outline-none"
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
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold bg-white focus:border-sage-500 focus:outline-none"
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
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold focus:border-sage-500 focus:outline-none"
                  placeholder="e.g. Morning Tea & Fresh Garden Air"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.routine.titleAs} ({language})
                </label>
                <input
                  type="text"
                  value={titleAs}
                  onChange={(e) => setTitleAs(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold focus:border-sage-500 focus:outline-none"
                  placeholder="e.g. পুৱাৰ চাহ আৰু ফুলনিৰ বতাহ"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t.caregiver.routine.icon}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const isSelected = icon === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setIcon(opt.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition text-xs font-bold ${
                          isSelected
                            ? 'bg-sage-100 border-sage-600 text-sage-900'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {opt.icon}
                        <span className="truncate">{opt.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
