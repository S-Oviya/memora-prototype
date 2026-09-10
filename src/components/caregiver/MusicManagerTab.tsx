import React, { useState } from 'react';
import { Plus, Music, Play, Square, Trash2, Upload, Volume2, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { FavoriteMusic } from '../../types';
import { db } from '../../services/db';
import { audioService } from '../../services/audioService';
import { AccessibleButton } from '../common/AccessibleButton';

interface MusicManagerTabProps {
  musicTracks: FavoriteMusic[];
  patientId: string;
  onRefresh: () => void;
}

export const MusicManagerTab: React.FC<MusicManagerTabProps> = ({
  musicTracks,
  patientId,
  onRefresh,
}) => {
  const { t, language } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [isBuiltIn, setIsBuiltIn] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAudioUrl(reader.result as string);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrack: FavoriteMusic = {
      id: 'music-' + Date.now(),
      patientId,
      title,
      artist: artist || 'Traditional',
      audioUrl: audioUrl || '',
      isBuiltIn: !audioUrl,
      isSynthesized: !audioUrl,
      duration: '2:30',
    };

    db.addMusicTrack(newTrack);
    onRefresh();
    setShowAddModal(false);
    setTitle('');
    setArtist('');
    setAudioUrl('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this music track?')) {
      if (activePlayingId === id) {
        audioService.stopCurrentAudio();
        setActivePlayingId(null);
      }
      db.deleteMusicTrack(id);
      onRefresh();
    }
  };

  const handlePlayToggle = async (track: FavoriteMusic) => {
    if (activePlayingId === track.id) {
      audioService.stopCurrentAudio();
      audioService.stopSynthesizedMelody();
      setActivePlayingId(null);
      return;
    }

    setActivePlayingId(track.id);
    if (track.audioUrl) {
      try {
        await audioService.playVoice(track.audioUrl);
      } catch {
        // fallback to flute
        audioService.playSoothingFluteReward(10, () => setActivePlayingId(null));
      }
    } else {
      audioService.playSoothingFluteReward(12, () => {
        setActivePlayingId(null);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">
            {t.caregiver.music.title}
          </h2>
          <p className="text-sm text-gray-500">
            {t.caregiver.music.subtitle}
          </p>
        </div>

        <AccessibleButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowAddModal(true)}
          className="flex-shrink-0"
        >
          {t.caregiver.music.addTrack}
        </AccessibleButton>
      </div>

      {/* Music Tracks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {musicTracks.map((track) => {
          const isPlaying = activePlayingId === track.id;

          return (
            <div
              key={track.id}
              className={`p-5 rounded-3xl border-2 transition-all flex items-center justify-between shadow-xs ${
                isPlaying
                  ? 'bg-amber-50 border-amber-400 shadow-md'
                  : 'bg-white border-sage-100 hover:border-sage-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePlayToggle(track)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                    isPlaying
                      ? 'bg-amber-600 text-white animate-pulse'
                      : 'bg-sage-600 hover:bg-sage-700 text-white'
                  }`}
                  title={isPlaying ? 'Stop' : 'Play'}
                >
                  {isPlaying ? <Square className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <div>
                  <h3 className="font-extrabold text-gray-900 text-base">
                    {track.title}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500">
                    {track.artist}
                  </p>
                  <span className="inline-block text-[10px] font-bold text-sage-800 bg-sage-100 px-2 py-0.5 rounded-md mt-1">
                    {track.isBuiltIn ? 'Peaceful Assamese Flute' : 'Custom Audio'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(track.id)}
                className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-sage-200">
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {t.caregiver.music.addTrack}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t.caregiver.music.subtitle}
            </p>

            <form onSubmit={handleAddTrack} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.music.trackTitle} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold"
                  placeholder="e.g. Borgeet - Peaceful Morning Melody"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.music.artist}
                </label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 font-semibold"
                  placeholder="e.g. Traditional Assamese Instrumental"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.music.uploadAudio}
                </label>
                <label className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-warm-50 hover:bg-warm-100 border-2 border-dashed border-warm-300 text-gray-700 font-bold text-sm cursor-pointer transition">
                  <Upload className="w-5 h-5 text-sage-600" />
                  <span>Choose Audio File (.mp3, .wav, .m4a)</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {audioUrl && (
                  <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Audio file attached successfully
                  </p>
                )}
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
                  {t.caregiver.music.saveTrack}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
