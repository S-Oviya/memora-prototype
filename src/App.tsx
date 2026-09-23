import React, { useState, useEffect } from 'react';
import { UserRole, Patient, FamilyMember, RoutineItem, ReminderItem, FavoriteMusic, GameAttempt, GameId, CaregiverAlert } from './types';
import { db } from './services/db';
import { AdaptiveDifficultyEngine, ALL_GAMES } from './services/adaptiveEngine';
import { useLanguage } from './locales/LanguageContext';

// Common Components
import { Navbar } from './components/common/Navbar';
import { WelcomeAuthScreen } from './components/common/WelcomeAuthScreen';

// Patient Views
import { PatientHome } from './components/patient/PatientHome';
import { PhotoPuzzleGame } from './components/games/PhotoPuzzleGame';
import { FamiliarFacesGame } from './components/games/FamiliarFacesGame';
import { FamiliarVoicesGame } from './components/games/FamiliarVoicesGame';
import { RoutineRecallGame } from './components/games/RoutineRecallGame';
import { OddOneOutGame } from './components/games/OddOneOutGame';
import { ShapeFitGame } from './components/games/ShapeFitGame';
import { MatchingFamilyMembersGame } from './components/games/MatchingFamilyMembersGame';

// Caregiver Views
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { HealthcareDashboard } from './components/healthcare/HealthcareDashboard';

export const App: React.FC = () => {
  const { language } = useLanguage();

  // Role and Navigation States
  const [currentRole, setCurrentRole] = useState<UserRole | 'auth'>(() => {
    const hasSeenAuth = localStorage.getItem('memora_has_seen_auth');
    if (!hasSeenAuth) return 'auth';
    return db.getActiveRole();
  });

  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  // App Data (Loaded from Persistent Database)
  const [patient, setPatient] = useState<Patient>(() => db.getPatient());
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => db.getFamilyMembers());
  const [routines, setRoutines] = useState<RoutineItem[]>(() => db.getRoutines());
  const [reminders, setReminders] = useState<ReminderItem[]>(() => db.getReminders());
  const [alerts, setAlerts] = useState<CaregiverAlert[]>(() => db.getAlerts());
  const [musicTracks, setMusicTracks] = useState<FavoriteMusic[]>(() => db.getMusicTracks());
  const [gameAttempts, setGameAttempts] = useState<GameAttempt[]>(() => db.getGameAttempts());

  const refreshData = () => {
    setPatient(db.getPatient());
    setFamilyMembers(db.getFamilyMembers());
    setRoutines(db.getRoutines());
    setReminders(db.getReminders());
    setAlerts(db.getAlerts());
    setMusicTracks(db.getMusicTracks());
    setGameAttempts(db.getGameAttempts());
  };

  useEffect(() => {
    const handleRemindersUpdated = (e: any) => {
      if (e.detail) {
        setReminders(e.detail);
      } else {
        setReminders(db.getReminders());
      }
    };
    const handleAlertsUpdated = (e: any) => {
      if (e.detail) {
        setAlerts(e.detail);
      } else {
        setAlerts(db.getAlerts());
      }
    };
    const handleRoutinesUpdated = (e: any) => {
      if (e.detail) {
        setRoutines(e.detail);
      } else {
        setRoutines(db.getRoutines());
      }
    };
    const handleAttemptsUpdated = (e: any) => {
      if (e.detail) {
        setGameAttempts(e.detail);
      } else {
        setGameAttempts(db.getGameAttempts());
      }
    };
    window.addEventListener('memora_reminders_updated', handleRemindersUpdated as EventListener);
    window.addEventListener('memora_alerts_updated', handleAlertsUpdated as EventListener);
    window.addEventListener('memora_routines_updated', handleRoutinesUpdated as EventListener);
    window.addEventListener('memora_attempts_updated', handleAttemptsUpdated as EventListener);
    return () => {
      window.removeEventListener('memora_reminders_updated', handleRemindersUpdated as EventListener);
      window.removeEventListener('memora_alerts_updated', handleAlertsUpdated as EventListener);
      window.removeEventListener('memora_routines_updated', handleRoutinesUpdated as EventListener);
      window.removeEventListener('memora_attempts_updated', handleAttemptsUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    // Periodically and on role switch evaluate active alerts
    db.checkAndRefreshAlerts();
  }, [currentRole]);

  const handleToggleReminderCompleted = (id: string) => {
    db.toggleReminderCompleted(id);
    refreshData();
  };

  const handleMarkAlertRead = (id: string) => {
    db.markAlertRead(id);
    refreshData();
  };

  const handleMarkAlertResolved = (id: string) => {
    db.markAlertResolved(id);
    refreshData();
  };

  const handleDeleteAlert = (id: string) => {
    db.deleteAlert(id);
    refreshData();
  };

  const handleRoleSelect = (role: UserRole) => {
    localStorage.setItem('memora_has_seen_auth', 'true');
    if (role !== 'caregiver' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('memora_session_pin');
    }
    if (role !== 'healthcare_worker' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('memora_session_healthcare_pin');
    }
    db.setActiveRole(role);
    setCurrentRole(role);
    setActiveGame(null);
    refreshData();
  };

  const handleSwitchRole = (role: UserRole) => {
    if (role !== 'caregiver' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('memora_session_pin');
    }
    if (role !== 'healthcare_worker' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('memora_session_healthcare_pin');
    }
    db.setActiveRole(role);
    setCurrentRole(role);
    setActiveGame(null);
    refreshData();
  };

  const handleSelectGame = (gameId: GameId) => {
    refreshData();
    setActiveGame(gameId);
  };

  const handlePlayNextGame = () => {
    const updatedAttempts = db.getGameAttempts();
    setGameAttempts(updatedAttempts);
    const nextGame = AdaptiveDifficultyEngine.getRecommendedNextGame(updatedAttempts);
    setActiveGame(nextGame);
  };

  const handleBackToHome = () => {
    refreshData();
    setActiveGame(null);
  };

  // Adaptive recommendation
  const adaptiveProfile = AdaptiveDifficultyEngine.evaluate(gameAttempts);
  const recommendedGame = adaptiveProfile.recommendedGame;
  const currentLevelForGame = activeGame ? adaptiveProfile.recommendedLevels[activeGame] || 1 : 1;

  if (currentRole === 'auth') {
    return <WelcomeAuthScreen onSelectRole={handleRoleSelect} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#231819] flex flex-col selection:bg-sage-200">
      {/* Universal Dementia-Friendly Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleSwitchRole}
        patientName={patient.name}
      />

      {/* Main Experience Container */}
      <main className="flex-1 pb-12">
        {currentRole === 'caregiver' ? (
          <CaregiverDashboard
            patient={patient}
            familyMembers={familyMembers}
            routines={routines}
            reminders={reminders}
            alerts={alerts}
            musicTracks={musicTracks}
            gameAttempts={gameAttempts}
            onUpdatePatient={(updated) => {
              setPatient(updated);
              refreshData();
            }}
            onRefreshData={refreshData}
            onSwitchToPatient={() => handleSwitchRole('patient')}
            onMarkAlertRead={handleMarkAlertRead}
            onMarkAlertResolved={handleMarkAlertResolved}
            onDeleteAlert={handleDeleteAlert}
          />
        ) : currentRole === 'healthcare_worker' ? (
          <HealthcareDashboard
            patient={patient}
            gameAttempts={gameAttempts}
            routines={routines}
            reminders={reminders}
            alerts={alerts}
            onSwitchToPatient={() => handleSwitchRole('patient')}
          />
        ) : (
          /* Patient Experience (Zero scores, large touch targets, soothing aesthetic) */
          <div>
            {!activeGame ? (
              <PatientHome
                patient={patient}
                reminders={reminders}
                onToggleReminderCompleted={handleToggleReminderCompleted}
                onSelectGame={handleSelectGame}
                recommendedGame={recommendedGame}
              />
            ) : activeGame === 'photo-puzzle' ? (
              <PhotoPuzzleGame
                familyMembers={familyMembers}
                initialLevel={currentLevelForGame}
                onBack={handleBackToHome}
                onPlayNext={handlePlayNextGame}
              />
            ) : activeGame === 'familiar-faces' ? (
              <FamiliarFacesGame
                patient={patient}
                familyMembers={familyMembers}
                initialLevel={currentLevelForGame}
                onBack={handleBackToHome}
                onPlayNext={handlePlayNextGame}
              />
            ) : activeGame === 'familiar-voices' ? (
              <FamiliarVoicesGame
                patient={patient}
                familyMembers={familyMembers}
                initialLevel={currentLevelForGame}
                onBack={handleBackToHome}
                onPlayNext={handlePlayNextGame}
              />
            ) : activeGame === 'routine-recall' ? (
              <RoutineRecallGame
                routines={routines}
                initialLevel={currentLevelForGame}
                onBack={handleBackToHome}
                onPlayNext={handlePlayNextGame}
              />
            ) : activeGame === 'odd-one-out' ? (
              <OddOneOutGame
                initialLevel={currentLevelForGame}
                onBack={handleBackToHome}
                onPlayNext={handlePlayNextGame}
              />
            ) : activeGame === 'shape-fit' ? (
              <ShapeFitGame
                initialLevel={currentLevelForGame}
                onBack={handleBackToHome}
                onPlayNext={handlePlayNextGame}
              />
            ) : (
              <MatchingFamilyMembersGame
                familyMembers={familyMembers}
                initialLevel={currentLevelForGame}
                onBack={handleBackToHome}
                onPlayNext={handlePlayNextGame}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
