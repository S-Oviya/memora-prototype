import React, { useState } from 'react';
import { BarChart3, User, Users, Calendar, Music, BookOpen, Play } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { Patient, FamilyMember, RoutineItem, FavoriteMusic, GameAttempt } from '../../types';
import { PatientOverviewTab } from './PatientOverviewTab';
import { PatientProfileTab } from './PatientProfileTab';
import { FamilyMembersTab } from './FamilyMembersTab';
import { RoutineManagerTab } from './RoutineManagerTab';
import { MusicManagerTab } from './MusicManagerTab';
import { CaregiverGuidanceTab } from './CaregiverGuidanceTab';

type TabId = 'overview' | 'profile' | 'family' | 'routine' | 'music' | 'guidance';

interface CaregiverDashboardProps {
  patient: Patient;
  familyMembers: FamilyMember[];
  routines: RoutineItem[];
  musicTracks: FavoriteMusic[];
  gameAttempts: GameAttempt[];
  onUpdatePatient: (patient: Patient) => void;
  onRefreshData: () => void;
  onSwitchToPatient: () => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  patient,
  familyMembers,
  routines,
  musicTracks,
  gameAttempts,
  onUpdatePatient,
  onRefreshData,
  onSwitchToPatient,
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabsConfig = [
    {
      id: 'overview' as TabId,
      label: t.caregiver.tabs.overview,
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'profile' as TabId,
      label: t.caregiver.tabs.profile,
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'family' as TabId,
      label: t.caregiver.tabs.family,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'routine' as TabId,
      label: t.caregiver.tabs.routine,
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'music' as TabId,
      label: t.caregiver.tabs.music,
      icon: <Music className="w-4 h-4" />,
    },
    {
      id: 'guidance' as TabId,
      label: t.caregiver.tabs.guidance,
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Mobile-Friendly Horizontal Scrolling Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {tabsConfig.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 border-2 ${
                isActive
                  ? 'bg-sage-600 text-white border-sage-700 shadow-sm'
                  : 'bg-white text-gray-700 border-sage-100 hover:border-sage-300 hover:bg-sage-50/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <PatientOverviewTab
          patient={patient}
          attempts={gameAttempts}
          onSwitchToPatient={onSwitchToPatient}
        />
      )}

      {activeTab === 'profile' && (
        <PatientProfileTab
          patient={patient}
          onUpdatePatient={onUpdatePatient}
        />
      )}

      {activeTab === 'family' && (
        <FamilyMembersTab
          familyMembers={familyMembers}
          patientId={patient.id}
          patient={patient}
          onRefresh={onRefreshData}
        />
      )}

      {activeTab === 'routine' && (
        <RoutineManagerTab
          routines={routines}
          patientId={patient.id}
          onRefresh={onRefreshData}
        />
      )}

      {activeTab === 'music' && (
        <MusicManagerTab
          musicTracks={musicTracks}
          patientId={patient.id}
          onRefresh={onRefreshData}
        />
      )}

      {activeTab === 'guidance' && (
        <CaregiverGuidanceTab patient={patient} attempts={gameAttempts} />
      )}
    </div>
  );
};
