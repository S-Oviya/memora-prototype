import React, { useState, useEffect } from 'react';
import { UserRole, Patient, FamilyMember, RoutineItem, FavoriteMusic, GameAttempt, GameId } from './types';
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
  const [musicTracks, setMusicTracks] = useState<FavoriteMusic[]>(() => db.getMusicTracks());
  const [gameAttempts, setGameAttempts] = useState<GameAttempt[]>(() => db.getGameAttempts());

  const refreshData = () => {
    setPatient(db.getPatient());
    setFamilyMembers(db.getFamilyMembers());
    setRoutines(db.getRoutines());
    setMusicTracks(db.getMusicTracks());
    setGameAttempts(db.getGameAttempts());
  };

  const handleRoleSelect = (role: UserRole) => {
    localStorage.setItem('memora_has_seen_auth', 'true');
    db.setActiveRole(role);
    setCurrentRole(role);
    setActiveGame(null);
    refreshData();
  };

  const handleSwitchRole = (role: UserRole) => {
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
            musicTracks={musicTracks}
            gameAttempts={gameAttempts}
            onUpdatePatient={(updated) => {
              setPatient(updated);
              refreshData();
            }}
            onRefreshData={refreshData}
            onSwitchToPatient={() => handleSwitchRole('patient')}
          />
        ) : (
          /* Patient Experience (Zero scores, large touch targets, soothing aesthetic) */
          <div>
            {!activeGame ? (
              <PatientHome
                patient={patient}
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
