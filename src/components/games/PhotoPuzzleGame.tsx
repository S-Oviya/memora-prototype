import React, { useState, useEffect, useRef } from 'react';
import { Image, RotateCcw, Eye, EyeOff, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { FamilyMember, GameAttempt } from '../../types';
import { audioService } from '../../services/audioService';
import { db } from '../../services/db';
import { api } from '../../services/api';
import { GameFeedbackModal } from '../patient/GameFeedbackModal';
import { AccessibleButton } from '../common/AccessibleButton';

interface PhotoPuzzleGameProps {
  familyMembers: FamilyMember[];
  initialLevel?: number;
  onBack: () => void;
  onPlayNext: () => void;
}

interface Tile {
  id: number;
  originalIndex: number;
  currentIndex: number;
}

export const PhotoPuzzleGame: React.FC<PhotoPuzzleGameProps> = ({
  familyMembers,
  initialLevel = 1,
  onBack,
  onPlayNext,
}) => {
  const { t, language } = useLanguage();
  const [level, setLevel] = useState<number>(initialLevel);
  const [selectedMember, setSelectedMember] = useState<FamilyMember>(() => {
    return familyMembers[0] || {
      id: 'default',
      patientId: '',
      name: 'Family Member',
      relationship: 'Family',
      photoUrl: '',
    };
  });

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);

  // Performance tracking for caregiver
  const startTimeRef = useRef<number>(Date.now());
  const mistakesCountRef = useRef<number>(0);

  // Grid dimensions for Levels 1-5
  const gridConfig =
    level === 1
      ? { rows: 2, cols: 2, total: 4 }
      : level === 2
      ? { rows: 2, cols: 3, total: 6 }
      : level === 3
      ? { rows: 3, cols: 3, total: 9 }
      : level === 4
      ? { rows: 3, cols: 4, total: 12 }
      : { rows: 4, cols: 4, total: 16 };

  // Setup puzzle
  const setupPuzzle = (targetLevel: number, member: FamilyMember) => {
    startTimeRef.current = Date.now();
    mistakesCountRef.current = 0;
    setIsCompleted(false);
    setSelectedTileIndex(null);
    setShowOriginal(false);
    setShowFeedbackModal(false);

    const config =
      targetLevel === 1
        ? { total: 4 }
        : targetLevel === 2
        ? { total: 6 }
        : targetLevel === 3
        ? { total: 9 }
        : targetLevel === 4
        ? { total: 12 }
        : { total: 16 };
    const numTiles = config.total;

    // Create tiles array
    const initialTiles: Tile[] = Array.from({ length: numTiles }, (_, i) => ({
      id: i,
      originalIndex: i,
      currentIndex: i,
    }));

    // Shuffle tiles until not in solved order
    let shuffled: Tile[];
    let attempts = 0;
    do {
      shuffled = [...initialTiles].sort(() => Math.random() - 0.5);
      shuffled = shuffled.map((tile, idx) => ({ ...tile, currentIndex: idx }));
      attempts++;
    } while (shuffled.every((tile, idx) => tile.originalIndex === idx) && attempts < 10);

    setTiles(shuffled);

    // Speak prompt or gentle audio
    const promptText = language === 'as' ? t.games.puzzle.autoVoicePrompt : t.games.puzzle.autoVoicePrompt;
    audioService.speakText(promptText, language);
  };

  useEffect(() => {
    if (initialLevel >= 1 && initialLevel <= 5) {
      setLevel(initialLevel);
    }
  }, [initialLevel]);

  useEffect(() => {
    if (familyMembers.length > 0) {
      const activeMember = familyMembers[Math.floor(Math.random() * familyMembers.length)];
      setSelectedMember(activeMember);
      setupPuzzle(level, activeMember);
    }
  }, [level]);

  // Handle tile tap
  const handleTileTap = (clickedIndex: number) => {
    if (isCompleted) return;

    if (selectedTileIndex === null) {
      // First tile selected
      audioService.playTapSound();
      setSelectedTileIndex(clickedIndex);
    } else if (selectedTileIndex === clickedIndex) {
      // Deselect
      audioService.playTapSound();
      setSelectedTileIndex(null);
    } else {
      // Swap tiles!
      audioService.playTapSound();
      const newTiles = [...tiles];
      const tileA = newTiles[selectedTileIndex];
      const tileB = newTiles[clickedIndex];

      // Swap positions
      newTiles[selectedTileIndex] = { ...tileB, currentIndex: selectedTileIndex };
      newTiles[clickedIndex] = { ...tileA, currentIndex: clickedIndex };

      setSelectedTileIndex(null);
      setTiles(newTiles);

      // Check if solved
      const solved = newTiles.every((t, idx) => t.originalIndex === idx);
      if (solved) {
        handlePuzzleSolved();
      } else {
        mistakesCountRef.current += 1;
      }
    }
  };

  const handlePuzzleSolved = () => {
    setIsCompleted(true);
    const timeTaken = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));
    const score = Math.max(50, 100 - mistakesCountRef.current * 8);

    // Save attempt for caregiver analytics
    const payload = {
      patientId: selectedMember.patientId || 'patient-ramesh-1',
      gameId: 'photo-puzzle' as const,
      cognitiveSkill: 'problem_solving' as const,
      level,
      success: true,
      score,
      timeTakenSeconds: timeTaken,
      mistakesCount: mistakesCountRef.current,
    };
    db.recordGameAttempt(payload);
    api.recordGameAttempt(payload).catch(() => {});

    // Speak or chime
    audioService.playSuccessChime();
    setTimeout(() => {
      setShowFeedbackModal(true);
    }, 900);
  };

  const getTileStyle = (originalIndex: number, cols: number, rows: number) => {
    const origCol = originalIndex % cols;
    const origRow = Math.floor(originalIndex / cols);

    const xPercent = cols === 1 ? 0 : (origCol / (cols - 1)) * 100;
    const yPercent = rows === 1 ? 0 : (origRow / (rows - 1)) * 100;

    return {
      backgroundImage: `url("${selectedMember.photoUrl}")`,
      backgroundSize: `${cols * 100}% ${rows * 100}%`,
      backgroundPosition: `${xPercent}% ${yPercent}%`,
    };
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 sm:py-6 flex flex-col items-center">
      {/* Top Bar: Back & Title */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border-2 border-sage-200 text-sage-800 font-bold hover:bg-sage-50 transition shadow-sm"
        >
          <ArrowLeft className="w-6 h-6 text-sage-700" />
          <span className="text-base">{t.common.back}</span>
        </button>

        <h1 className="text-xl sm:text-2xl font-black text-sage-900 flex items-center gap-2">
          <span>🧩</span> {t.games.puzzle.title}
        </h1>

        <button
          onClick={() => setupPuzzle(level, selectedMember)}
          className="p-2.5 rounded-2xl bg-white border-2 border-warm-200 text-warm-800 hover:bg-warm-50 transition shadow-sm"
          title="Restart"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>

      {/* Dementia-Friendly Voice Instruction Banner */}
      <div className="w-full bg-sage-50 border-2 border-sage-200 rounded-2xl p-3 sm:p-4 mb-4 flex items-center justify-between">
        <p className="text-elderly-base font-bold text-sage-900 leading-snug">
          {t.games.puzzle.instruction}
        </p>
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-sage-700 border border-sage-300 font-semibold text-sm hover:bg-sage-100 transition flex-shrink-0 ml-2"
        >
          {showOriginal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="hidden xs:inline">
            {showOriginal ? t.games.puzzle.hidePreview : t.games.puzzle.previewPhoto}
          </span>
        </button>
      </div>

      {/* Original Image Preview Drawer if toggled */}
      {showOriginal && (
        <div className="w-full mb-4 bg-white p-3 rounded-2xl border-2 border-sage-300 shadow-md text-center animate-fadeIn">
          <p className="text-xs font-bold text-gray-500 mb-2 uppercase">
            {language === 'as' ? 'সম্পূৰ্ণ ছবিখন' : 'Original Photograph'}
          </p>
          <img
            src={selectedMember.photoUrl}
            alt={selectedMember.name}
            className="w-48 h-48 mx-auto rounded-xl object-cover border-2 border-sage-200 shadow-sm"
          />
        </div>
      )}

      {/* Main Puzzle Canvas */}
      <div className="w-full flex justify-center mb-6">
        <div
          className={`relative bg-warm-200 p-3 rounded-3xl shadow-xl border-4 ${
            isCompleted ? 'border-emerald-500 animate-gentle-celebrate' : 'border-sage-300'
          }`}
          style={{ width: '100%', maxWidth: '380px', aspectRatio: '1 / 1' }}
        >
          {isCompleted ? (
            // Completed Full Picture View
            <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-inner border-2 border-emerald-400">
              <img
                src={selectedMember.photoUrl}
                alt={selectedMember.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-center text-white">
                <p className="text-xl font-extrabold flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  {selectedMember.name}
                </p>
                <p className="text-sm opacity-90">
                  {language === 'as' ? selectedMember.relationshipAs || selectedMember.relationship : selectedMember.relationship}
                </p>
              </div>
            </div>
          ) : (
            // Puzzle Tiles Grid
            <div
              className="grid gap-2 w-full h-full"
              style={{
                gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
              }}
            >
              {tiles.map((tile, index) => {
                const isSelected = selectedTileIndex === index;
                const isCorrect = tile.originalIndex === index;

                return (
                  <button
                    key={tile.id}
                    onClick={() => handleTileTap(index)}
                    className={`relative rounded-2xl overflow-hidden transition-all duration-150 transform active:scale-95 border-3 select-none ${
                      isSelected
                        ? 'border-terracotta-500 ring-4 ring-terracotta-300 scale-105 z-10 shadow-xl'
                        : isCorrect
                        ? 'border-sage-400 shadow-md hover:border-sage-500'
                        : 'border-white/80 shadow hover:border-sage-300'
                    }`}
                    style={getTileStyle(tile.originalIndex, gridConfig.cols, gridConfig.rows)}
                  >
                    {/* Visual tile swap hint */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-terracotta-500/25 flex items-center justify-center">
                        <span className="bg-white/90 text-terracotta-700 text-xs font-black px-2 py-1 rounded-full shadow">
                          {language === 'as' ? 'বাছনি' : 'Selected'}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>


      <p className="text-sm text-gray-500 text-center">
        {t.games.puzzle.swapHint}
      </p>

      {/* Game Feedback celebration modal */}
      <GameFeedbackModal
        isOpen={showFeedbackModal}
        gameTitle={t.games.puzzle.title}
        customMessage={t.games.puzzle.completed}
        onPlayNext={() => {
          setShowFeedbackModal(false);
          onPlayNext();
        }}
        onBackHome={() => {
          setShowFeedbackModal(false);
          onBack();
        }}
      />
    </div>
  );
};
