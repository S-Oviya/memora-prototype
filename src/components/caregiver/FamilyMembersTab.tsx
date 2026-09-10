import React, { useState, useRef } from 'react';
import { Plus, Mic, MicOff, Upload, Trash2, Volume2, Play, Check, AlertCircle, Sparkles, UserPlus } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { FamilyMember } from '../../types';
import { db } from '../../services/db';
import { audioService } from '../../services/audioService';
import { VoiceRecorder } from '../../services/voiceRecorder';
import { createAvatarSvg } from '../../services/seedData';
import { AccessibleButton } from '../common/AccessibleButton';

interface FamilyMembersTabProps {
  familyMembers: FamilyMember[];
  patientId: string;
  onRefresh: () => void;
}

export const FamilyMembersTab: React.FC<FamilyMembersTabProps> = ({
  familyMembers,
  patientId,
  onRefresh,
}) => {
  const { t, language } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [relationshipAs, setRelationshipAs] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [voiceAudioUrl, setVoiceAudioUrl] = useState('');
  const [voiceTranscriptEn, setVoiceTranscriptEn] = useState('');
  const [voiceTranscriptAs, setVoiceTranscriptAs] = useState('');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const voiceRecorderRef = useRef<VoiceRecorder | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const resetForm = () => {
    setName('');
    setRelationship('');
    setRelationshipAs('');
    setPhotoUrl('');
    setVoiceAudioUrl('');
    setVoiceTranscriptEn('');
    setVoiceTranscriptAs('');
    setIsRecording(false);
    setRecordingSeconds(0);
    if (voiceRecorderRef.current) {
      voiceRecorderRef.current.cancelRecording();
    }
  };

  const handleStartRecording = async () => {
    try {
      const recorder = new VoiceRecorder();
      voiceRecorderRef.current = recorder;
      await recorder.startRecording((vol) => {
        setAudioVolume(vol);
      });
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied or not supported on this browser.');
    }
  };

  const handleStopRecording = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (voiceRecorderRef.current) {
      try {
        const result = await voiceRecorderRef.current.stopRecording();
        setVoiceAudioUrl(result.dataUrl);
        setIsRecording(false);
      } catch (err) {
        console.error('Error stopping recording', err);
        setIsRecording(false);
      }
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVoiceAudioUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fallback photo if none uploaded
    const finalPhotoUrl =
      photoUrl ||
      createAvatarSvg(
        name,
        relationship,
        '#60A5FA',
        '#1E293B',
        '#2563EB'
      );

    const newMember: FamilyMember = {
      id: 'fam-' + Date.now(),
      patientId,
      name,
      relationship,
      relationshipAs: relationshipAs || relationship,
      photoUrl: finalPhotoUrl,
      voiceAudioUrl,
      voiceTranscriptEn: voiceTranscriptEn || `Hello from ${name}`,
      voiceTranscriptAs: voiceTranscriptAs || `মই ${name}`,
    };

    db.addFamilyMember(newMember);
    onRefresh();
    setShowAddModal(false);
    resetForm();
  };

  const handleDeleteMember = (id: string) => {
    if (confirm(t.caregiver.family.confirmDelete)) {
      db.deleteFamilyMember(id);
      onRefresh();
    }
  };

  const handlePlayVoice = async (member: FamilyMember) => {
    if (activePlayingId === member.id) {
      audioService.stopCurrentAudio();
      setActivePlayingId(null);
      return;
    }

    setActivePlayingId(member.id);
    try {
      if (member.voiceAudioUrl) {
        await audioService.playVoice(member.voiceAudioUrl);
      } else {
        const text =
          language === 'as'
            ? member.voiceTranscriptAs || `মই ${member.name}`
            : member.voiceTranscriptEn || `Hello, this is ${member.name}`;
        audioService.speakText(text, language);
      }
    } catch {
      // ignore
    }
    setActivePlayingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">
            {t.caregiver.family.title}
          </h2>
          <p className="text-sm text-gray-500">
            {t.caregiver.family.subtitle}
          </p>
        </div>

        <AccessibleButton
          variant="primary"
          size="md"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setShowAddModal(true)}
          className="flex-shrink-0"
        >
          {t.caregiver.family.addMember}
        </AccessibleButton>
      </div>

      {/* Family Members Grid */}
      {familyMembers.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-base text-gray-600 font-medium max-w-md mx-auto">
            {t.caregiver.family.emptyList}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {familyMembers.map((member) => {
            const isPlaying = activePlayingId === member.id;
            return (
              <div
                key={member.id}
                className="bg-white rounded-3xl p-5 border-2 border-sage-100 hover:border-sage-300 shadow-sm flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Photo & Delete */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-warm-100 border border-warm-200">
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="absolute top-2 right-2 p-2 rounded-xl bg-white/90 hover:bg-rose-50 text-rose-600 border border-rose-200 shadow-sm transition"
                      title={t.caregiver.family.deleteMember}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Name and Relationship */}
                  <h3 className="text-xl font-black text-gray-900">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-sage-800 bg-sage-50 border border-sage-200 px-2.5 py-1 rounded-lg">
                      {member.relationship}
                    </span>
                    {member.relationshipAs && (
                      <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        {member.relationshipAs}
                      </span>
                    )}
                  </div>

                  {/* Voice note preview transcript */}
                  <p className="text-xs text-gray-500 mt-3 italic line-clamp-2">
                    "{language === 'as' ? member.voiceTranscriptAs || member.voiceTranscriptEn : member.voiceTranscriptEn || member.voiceTranscriptAs}"
                  </p>
                </div>

                {/* Voice Note Player */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handlePlayVoice(member)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      isPlaying
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-warm-100 hover:bg-warm-200 text-gray-800'
                    }`}
                  >
                    {isPlaying ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Play className="w-4 h-4" />}
                    <span>{isPlaying ? 'Playing...' : t.caregiver.family.playVoice}</span>
                  </button>

                  <span className="text-[11px] text-gray-400 font-semibold">
                    {member.voiceAudioUrl ? 'Audio Attached' : 'TTS Synthesized'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border-4 border-sage-200">
            <h3 className="text-2xl font-black text-gray-900 mb-1">
              {t.caregiver.family.addMember}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t.caregiver.family.subtitle}
            </p>

            <form onSubmit={handleAddMemberSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.family.memberName} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 focus:border-sage-500 outline-none font-semibold"
                  placeholder="e.g. Sunita Baruah"
                />
              </div>

              {/* Relationship in English and Assamese */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t.caregiver.family.relationship} *
                  </label>
                  <input
                    type="text"
                    required
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 focus:border-sage-500 outline-none font-semibold"
                    placeholder="e.g. Daughter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t.caregiver.family.relationshipAs}
                  </label>
                  <input
                    type="text"
                    value={relationshipAs}
                    onChange={(e) => setRelationshipAs(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 focus:border-sage-500 outline-none font-semibold"
                    placeholder="e.g. জীয়াৰী"
                  />
                </div>
              </div>

              {/* Photo Upload or Preset */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t.caregiver.family.photo}
                </label>
                <div className="flex items-center gap-4">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-sage-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-warm-100 flex items-center justify-center text-gray-400 border border-warm-300">
                      <UserPlus className="w-6 h-6" />
                    </div>
                  )}

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-warm-100 hover:bg-warm-200 text-gray-800 text-sm font-bold cursor-pointer border border-warm-300">
                    <Upload className="w-4 h-4" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Voice Recording / Upload Section */}
              <div className="bg-warm-50 p-4 rounded-2xl border-2 border-warm-200">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  {t.caregiver.family.voiceNote}
                </label>

                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={handleStopRecording}
                      className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md animate-pulse"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>{t.caregiver.family.stopRecording} ({recordingSeconds}s)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="flex items-center gap-2 bg-sage-600 hover:bg-sage-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition"
                    >
                      <Mic className="w-4 h-4" />
                      <span>{t.caregiver.family.startRecording}</span>
                    </button>
                  )}

                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold cursor-pointer border border-gray-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {voiceAudioUrl && (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Voice recording attached successfully!</span>
                  </div>
                )}
              </div>

              {/* Voice Transcript (English and Assamese) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Spoken Greeting (English)
                  </label>
                  <input
                    type="text"
                    value={voiceTranscriptEn}
                    onChange={(e) => setVoiceTranscriptEn(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                    placeholder="e.g. Hi Dad, it is Sunita!"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Spoken Greeting (Assamese)
                  </label>
                  <input
                    type="text"
                    value={voiceTranscriptAs}
                    onChange={(e) => setVoiceTranscriptAs(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                    placeholder="e.g. দেউতা, মই সুনীতা!"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 text-sm"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-sage-600 text-white hover:bg-sage-700 text-sm shadow-md"
                >
                  {t.caregiver.family.saveMember}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
