import React, { useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Pill,
  Droplets,
  Calendar,
  Stethoscope,
  Activity as ActivityIcon,
  CheckCircle,
  Eye,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  Info,
  Clock,
  User,
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { CaregiverAlert, CaregiverAlertType, AlertStatus } from '../../types';
import { getAlertTitle, getAlertDescription } from '../../services/seedData';

interface CaregiverAlertsTabProps {
  alerts: CaregiverAlert[];
  patientId: string;
  onMarkAlertRead: (id: string) => void;
  onMarkAlertResolved: (id: string) => void;
  onDeleteAlert?: (id: string) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const CaregiverAlertsTab: React.FC<CaregiverAlertsTabProps> = ({
  alerts,
  patientId,
  onMarkAlertRead,
  onMarkAlertResolved,
  onDeleteAlert,
  onNavigateTab,
}) => {
  const { t, language } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const unresolvedAlerts = alerts.filter((a) => a.status !== 'resolved');
  const resolvedAlerts = alerts.filter((a) => a.status === 'resolved');

  // Filtered alerts
  const filteredAlerts = alerts.filter((alert) => {
    // Status filter
    if (statusFilter === 'unresolved' && alert.status === 'resolved') return false;
    if (statusFilter === 'resolved' && alert.status !== 'resolved') return false;

    // Category filter
    if (categoryFilter !== 'all' && alert.type !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const title = getAlertTitle(alert, language).toLowerCase();
      const desc = getAlertDescription(alert, language).toLowerCase();
      const patient = (alert.patientName || '').toLowerCase();
      const item = (alert.relevantItemTitle || '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !patient.includes(q) && !item.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const getAlertIcon = (type: CaregiverAlertType) => {
    switch (type) {
      case 'missed_medicine':
        return <Pill className="w-5 h-5 text-rose-600" />;
      case 'missed_hydration':
        return <Droplets className="w-5 h-5 text-sky-600" />;
      case 'missed_activity':
        return <ActivityIcon className="w-5 h-5 text-amber-600" />;
      case 'missed_appointment':
        return <Stethoscope className="w-5 h-5 text-purple-600" />;
      case 'inactivity':
      default:
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getAlertBg = (type: CaregiverAlertType) => {
    switch (type) {
      case 'missed_medicine':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      case 'missed_hydration':
        return 'bg-sky-50 border-sky-200 text-sky-900';
      case 'missed_activity':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'missed_appointment':
        return 'bg-purple-50 border-purple-200 text-purple-900';
      case 'inactivity':
      default:
        return 'bg-orange-50 border-orange-200 text-orange-900';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            {t.caregiver.alerts.severity.high}
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
            {t.caregiver.alerts.severity.medium}
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gray-100 text-gray-700 border border-gray-200">
            {t.caregiver.alerts.severity.low}
          </span>
        );
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-sage-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                {t.caregiver.alerts.title}
              </h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {t.caregiver.alerts.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-sage-50 border border-sage-200 text-sage-900">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              {t.caregiver.alerts.unresolvedCount}:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-sm font-black ${
              unresolvedAlerts.length > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-sage-600 text-white'
            }`}>
              {unresolvedAlerts.length}
            </span>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('reminders')}
              className="px-4 py-2.5 rounded-2xl bg-white border border-sage-200 text-sage-800 font-bold text-sm hover:bg-sage-50 transition flex items-center gap-1.5 shadow-xs"
            >
              <span>{t.caregiver.alerts.viewReminders}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Non-clinical supportive disclaimer notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
        <Info className="w-5 h-5 flex-shrink-0 text-amber-700 mt-0.5" />
        <p className="leading-relaxed font-medium">
          {t.caregiver.alerts.disclaimer}
        </p>
      </div>

      {/* Filters and Controls Card */}
      <div className="bg-white p-5 rounded-3xl border-2 border-sage-100 shadow-sm space-y-4">
        {/* Status Pills and Search */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* Status Tabs */}
          <div className="flex bg-sage-50 p-1.5 rounded-2xl border border-sage-200 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setStatusFilter('unresolved')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'unresolved'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <span>{t.caregiver.alerts.filterUnresolved}</span>
              {unresolvedAlerts.length > 0 && (
                <span className="bg-white/20 px-2 py-0.2 rounded-full text-xs font-bold">
                  {unresolvedAlerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-sage-700 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {t.caregiver.alerts.filterAll} ({alerts.length})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition whitespace-nowrap ${
                statusFilter === 'resolved'
                  ? 'bg-sage-700 text-white shadow-xs'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              {t.caregiver.alerts.filterResolved} ({resolvedAlerts.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.caregiver.alerts.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-sage-50/50 border border-sage-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sage-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: t.caregiver.alerts.types.all },
            { id: 'missed_medicine', label: t.caregiver.alerts.types.missed_medicine },
            { id: 'missed_hydration', label: t.caregiver.alerts.types.missed_hydration },
            { id: 'missed_activity', label: t.caregiver.alerts.types.missed_activity },
            { id: 'missed_appointment', label: t.caregiver.alerts.types.missed_appointment },
            { id: 'inactivity', label: t.caregiver.alerts.types.inactivity },
          ].map((cat) => {
            const isCatActive = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition border ${
                  isCatActive
                    ? 'bg-sage-800 text-white border-sage-800 shadow-xs'
                    : 'bg-white text-gray-700 border-sage-200 hover:bg-sage-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3.5">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border-2 border-sage-100 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-1">
              {statusFilter === 'unresolved'
                ? t.caregiver.alerts.emptyUnresolved
                : statusFilter === 'resolved'
                ? t.caregiver.alerts.emptyResolved
                : t.caregiver.alerts.emptyAll}
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              {statusFilter === 'unresolved'
                ? 'All scheduled patient medications, hydration prompts, and daily activities are current.'
                : 'No alerts found matching your selected filters.'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isResolved = alert.status === 'resolved';
            const isUnread = alert.status === 'unread';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-3xl border-2 transition-all p-5 sm:p-6 shadow-sm ${
                  isResolved
                    ? 'border-gray-200 bg-gray-50/60 opacity-80'
                    : isUnread
                    ? 'border-rose-200 ring-2 ring-rose-50'
                    : 'border-sage-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Column: Icon & Details */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border shadow-xs ${getAlertBg(
                        alert.type
                      )}`}
                    >
                      {getAlertIcon(alert.type)}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(alert.severity)}

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isUnread
                              ? 'bg-rose-100 text-rose-800 border-rose-200 font-black'
                              : 'bg-gray-100 text-gray-700 border-gray-200'
                          }`}
                        >
                          {isResolved
                            ? t.caregiver.alerts.resolved
                            : isUnread
                            ? t.caregiver.alerts.unread
                            : t.caregiver.alerts.read}
                        </span>

                        <span className="text-xs text-gray-400 font-medium">
                          {formatDateTime(alert.timestamp)}
                        </span>
                      </div>

                      {/* Alert Title */}
                      <h3
                        className={`text-lg sm:text-xl font-black ${
                          isResolved ? 'text-gray-600 line-through' : 'text-gray-900'
                        }`}
                      >
                        {getAlertTitle(alert, language)}
                      </h3>

                      {/* Metadata Row: Patient, Scheduled Item, Due Time */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-600 pt-0.5">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold">{t.caregiver.alerts.patientLabel}:</span>
                          <span className="text-gray-800 font-bold">{alert.patientName}</span>
                        </div>

                        {alert.relevantItemTitle && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-semibold">{t.caregiver.alerts.itemLabel}:</span>
                            <span className="text-gray-800 font-bold">{alert.relevantItemTitle}</span>
                          </div>
                        )}

                        {alert.dueTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-semibold">{t.caregiver.alerts.dueTimeLabel}:</span>
                            <span className="text-rose-700 font-bold">{alert.dueTime}</span>
                          </div>
                        )}
                      </div>

                      {/* Observational Description */}
                      <p className="text-sm text-gray-600 leading-relaxed pt-1">
                        {getAlertDescription(alert, language)}
                      </p>

                      {/* Resolution Timestamp */}
                      {isResolved && alert.resolvedAt && (
                        <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{t.caregiver.alerts.resolved}: {formatDateTime(alert.resolvedAt)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 pt-2 sm:pt-0 flex-shrink-0 border-t sm:border-t-0 border-gray-100">
                    {!isResolved ? (
                      <>
                        <button
                          onClick={() => onMarkAlertResolved(alert.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{t.caregiver.alerts.markAsResolved}</span>
                        </button>

                        {isUnread && (
                          <button
                            onClick={() => onMarkAlertRead(alert.id)}
                            className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.caregiver.alerts.markAsRead}</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        {t.caregiver.alerts.resolved}
                      </span>
                    )}

                    {onDeleteAlert && (
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Dismiss Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
