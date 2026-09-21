import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Heart,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  MessageCircle,
  CalendarCheck,
  ShieldCheck,
  Lightbulb,
  Volume2,
  Square,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import {
  CAREGIVER_GUIDANCE_TIPS,
  getGuidanceTipCategory,
  getGuidanceTipTitle,
  getGuidanceTipSummary,
  getGuidanceTipBullets,
} from '../../services/seedData';
import { api } from '../../services/api';
import { Patient, GameAttempt, AICaregiverInsightResult, Language } from '../../types';
import { OfflineInsightsService } from '../../services/offlineInsightsService';
import { db } from '../../services/db';

interface CaregiverGuidanceTabProps {
  patient?: Patient;
  attempts?: GameAttempt[];
}

const STAT_LABELS: Record<Language, { strongArea: string; focusArea: string; targetLevel: string }> = {
  en: { strongArea: 'Strong Area', focusArea: 'Focus Area', targetLevel: 'Target Level' },
  as: { strongArea: 'দক্ষতা', focusArea: 'অনুশীলন', targetLevel: 'নিৰ্দেশিত স্তৰ' },
  bn: { strongArea: 'দক্ষতা', focusArea: 'অনুশীলনের ক্ষেত্র', targetLevel: 'লক্ষ্য মাত্রা' },
  ne: { strongArea: 'सबल पक्ष', focusArea: 'अभ्यास क्षेत्र', targetLevel: 'लक्षित स्तर' },
  lus: { strongArea: 'Thiam zawng', focusArea: 'Zir ngai', targetLevel: 'Tum ram kaihhnawh' },
  kha: { strongArea: 'Ka bor ba khlain', focusArea: 'Ka jaka pynleit jingmut', targetLevel: 'Ka kyrdan ba thmu' },
  ny: { strongArea: 'Albo longo', focusArea: 'Aching longo', targetLevel: 'Tennan longo' },
  trp: { strongArea: 'কাহাম জায়া', focusArea: 'সামুং নাইমানি', targetLevel: 'লক্ষ্য মাত্রা' },
  mni: { strongArea: 'ꯍꯩꯊꯣꯏꯕ (মপাঙ্গল)', focusArea: 'ꯇꯝꯐꯝ (অনৌবা লম)', targetLevel: 'ꯊꯥꯛ (লমজিংবা)' },
};

const PERSONALIZED_INSIGHT_TITLES: Record<Language, string> = {
  en: 'Personalized Activity Guidance',
  as: 'ব্যক্তিগত কাৰ্যসূচী আৰু পৰামৰ্শ',
  bn: 'ব্যক্তিগত কার্যকলাপ ও অন্তর্দৃষ্টি',
  ne: 'व्यक्तिगत गतिविधि तथा परामर्श',
  lus: 'Mimal tana rawtna leh zirtirna',
  kha: 'Ka jingbthah ba la pynkhreh kyrpang',
  ny: 'Akam gennam agan',
  trp: 'বোরোকনি বাগৈ বিশেষ পরামর্শ',
  mni: 'ꯑꯈꯟꯅꯕ ꯄꯥꯎꯇꯥꯛ ꯑꯃꯁꯨꯡ ꯂꯝꯖꯤꯡꯕ (অখন্নবা পাউতাক)',
};

const LISTEN_LABELS: Record<Language, { listen: string; stop: string; loading: string; playing: string }> = {
  en: { listen: 'Listen', stop: 'Stop', loading: 'Generating Voice...', playing: 'Listening...' },
  as: { listen: 'শুনক', stop: 'বন্ধ কৰক', loading: 'কণ্ঠ প্ৰস্তুত হৈছে...', playing: 'শুনি থকা হৈছে...' },
  bn: { listen: 'শুনুন', stop: 'থামুন', loading: 'কণ্ঠ তৈরি হচ্ছে...', playing: 'শোনা হচ্ছে...' },
  ne: { listen: 'सुन्नुहोस्', stop: 'रोक्नुहोस्', loading: 'आवाज तयार हुँदैछ...', playing: 'सुन्दै...' },
  lus: { listen: 'Ngaithla rawh', stop: 'Tawp rawh', loading: 'Aw siam mek a ni...', playing: 'Ngaithla mek...' },
  kha: { listen: 'Sngap', stop: 'Sangeh', loading: 'Pynmih sur...', playing: 'Dang sngap...' },
  ny: { listen: 'Arrka', stop: 'Haka', loading: 'Gennam...', playing: 'Arrka...' },
  trp: { listen: 'Khna di', stop: 'Tong di', loading: 'Kok tong...', playing: 'Khna tong...' },
  mni: { listen: 'ꯇꯥꯕꯤꯌꯨ', stop: 'ꯂꯦꯞꯄꯤꯌꯨ', loading: 'ꯈꯣꯟꯊꯣꯛ ꯁꯦꯝꯕ...', playing: 'ꯇꯥꯔꯤ...' },
};

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  as: 'Assamese',
  bn: 'Bengali',
  ne: 'Nepali',
  lus: 'Mizo',
  kha: 'Khasi',
  ny: 'Nyishi',
  trp: 'Kokborok',
  mni: 'Manipuri',
};

export const CaregiverGuidanceTab: React.FC<CaregiverGuidanceTabProps> = ({
  patient,
  attempts,
}) => {
  const { language: caregiverLanguage, t: currentT } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>('tip-1');
  const [patientData, setPatientData] = useState<Patient>(() => {
    const fromDb = db.getPatient();
    return fromDb || (patient as Patient);
  });

  // Audio Playback & TTS state
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [loadingSpeechId, setLoadingSpeechId] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  // Stop and clean up audio when unmounting or when language changes
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    setActiveSpeechId(null);
  };

  useEffect(() => {
    // When caregiver changes language, immediately stop playing prior language audio
    stopAudio();
    setTtsError(null);
    return () => {
      stopAudio();
    };
  }, [caregiverLanguage]);

  // Listen to patient update events from DB or other tabs
  useEffect(() => {
    const handlePatientUpdate = () => {
      setPatientData(db.getPatient());
    };
    window.addEventListener('memora_patient_updated', handlePatientUpdate);
    window.addEventListener('storage', handlePatientUpdate);
    return () => {
      window.removeEventListener('memora_patient_updated', handlePatientUpdate);
      window.removeEventListener('storage', handlePatientUpdate);
    };
  }, []);

  // Sync if parent passes updated patient prop
  useEffect(() => {
    if (patient) {
      setPatientData(patient);
    }
  }, [patient]);

  // Read latest directly from DB as ultimate source of truth, then state, then prop
  const latestDbPatient = db.getPatient();
  const resolvedPatient = latestDbPatient || patientData || patient;
  // Caregiver's currently selected language is the source of truth for Guidance
  const guidanceLanguage: Language = caregiverLanguage || 'en';
  const resolvedAttempts = attempts || db.getGameAttempts();

  // Synchronously compute offline insights strictly using the caregiver's selected language
  const aiInsight: AICaregiverInsightResult = useMemo(() => {
    return OfflineInsightsService.generateOfflineInsights(
      resolvedPatient?.name || 'the senior',
      resolvedAttempts,
      guidanceLanguage
    );
  }, [guidanceLanguage, resolvedPatient?.name, resolvedAttempts]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePlayTTS = async (id: string, textToSpeak: string) => {
    // If currently playing this specific text, click stops it
    if (activeSpeechId === id) {
      stopAudio();
      return;
    }

    // Prevent concurrent generation clicks
    if (loadingSpeechId !== null) {
      return;
    }

    // Stop any other currently playing audio
    stopAudio();
    setTtsError(null);

    const trimmed = textToSpeak.trim();
    if (!trimmed) {
      setTtsError('Guidance text is empty.');
      return;
    }

    // Truncate to maximum 480 chars to ensure prompt fits comfortably within offline TTS limit
    const safeText = trimmed.length > 480 ? trimmed.substring(0, 480) + '.' : trimmed;

    setLoadingSpeechId(id);

    try {
      const blob = await api.synthesizeSpeech(safeText, guidanceLanguage);
      const audioUrl = URL.createObjectURL(blob);
      currentBlobUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        stopAudio();
      };

      audio.onerror = () => {
        stopAudio();
        setTtsError('Browser audio playback failed.');
      };

      await audio.play();
      setActiveSpeechId(id);
    } catch (err: any) {
      stopAudio();
      setTtsError(err.message || 'Speech generation encountered an error.');
    } finally {
      setLoadingSpeechId(null);
    }
  };

  const getTipIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart-handshake':
        return <MessageCircle className="w-6 h-6 text-sage-700" />;
      case 'calendar-check':
        return <CalendarCheck className="w-6 h-6 text-amber-700" />;
      case 'shield-check':
        return <ShieldCheck className="w-6 h-6 text-emerald-700" />;
      default:
        return <Sparkles className="w-6 h-6 text-rose-700" />;
    }
  };

  const insightSpeechText = aiInsight
    ? `${PERSONALIZED_INSIGHT_TITLES[guidanceLanguage] || PERSONALIZED_INSIGHT_TITLES.en}. ${aiInsight.summary} ${aiInsight.reason} ${
        aiInsight.caregiverSuggestions ? aiInsight.caregiverSuggestions.join('. ') : ''
      }`
    : '';

  return (
    <div className="space-y-6" lang={guidanceLanguage}>
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border-2 border-sage-100 shadow-sm">
        <div className="flex items-center gap-3 text-sage-800 mb-2">
          <Heart className="w-6 h-6 fill-sage-200 text-sage-700" />
          <h2 className="text-2xl font-black text-gray-900">
            {currentT.caregiver.guidance.title}
          </h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {currentT.caregiver.guidance.subtitle}
        </p>

        {/* Non-Medical Disclaimer */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            {currentT.caregiver.guidance.disclaimer}
          </p>
        </div>
      </div>

      {/* TTS Error / Informational Alert Banner */}
      {ttsError && (
        <div
          role="alert"
          className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start justify-between gap-3 text-amber-950 animate-fadeIn shadow-xs"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">Voice Synthesis Notice</h4>
              <p className="text-xs mt-0.5 text-amber-800 leading-relaxed">{ttsError}</p>
            </div>
          </div>
          <button
            onClick={() => setTtsError(null)}
            aria-label="Dismiss notice"
            className="text-amber-700 hover:text-amber-950 p-1.5 rounded-xl hover:bg-amber-100 transition min-h-[36px] min-w-[36px] flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI Personalized Dynamic Insights Card */}
      {aiInsight && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white rounded-3xl p-6 border-2 border-indigo-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                  {currentT.caregiver.guidance.aiInsightTitle}
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  {PERSONALIZED_INSIGHT_TITLES[guidanceLanguage] || PERSONALIZED_INSIGHT_TITLES.en}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {currentT.caregiver.guidance.ruleBasedBadge}
              </span>

              {/* Accessible Listen Button for Personalized Guidance */}
              <button
                type="button"
                onClick={() => handlePlayTTS('ai-insight', insightSpeechText)}
                disabled={loadingSpeechId !== null && loadingSpeechId !== 'ai-insight'}
                aria-label={
                  activeSpeechId === 'ai-insight'
                    ? `Stop playing guidance`
                    : `Listen to personalized activity guidance in ${LANGUAGE_NAMES[guidanceLanguage] || guidanceLanguage}`
                }
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl font-bold text-xs transition min-h-[44px] min-w-[44px] shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  activeSpeechId === 'ai-insight'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 animate-pulse'
                    : loadingSpeechId === 'ai-insight'
                    ? 'bg-indigo-100 text-indigo-700 cursor-wait'
                    : 'bg-white hover:bg-indigo-50 text-indigo-800 border border-indigo-200'
                }`}
              >
                {loadingSpeechId === 'ai-insight' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>{LISTEN_LABELS[guidanceLanguage]?.loading || LISTEN_LABELS.en.loading}</span>
                  </>
                ) : activeSpeechId === 'ai-insight' ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>{LISTEN_LABELS[guidanceLanguage]?.stop || LISTEN_LABELS.en.stop}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>{LISTEN_LABELS[guidanceLanguage]?.listen || LISTEN_LABELS.en.listen}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-3">
            {aiInsight.summary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {STAT_LABELS[guidanceLanguage]?.strongArea || STAT_LABELS.en.strongArea}
              </span>
              <span className="text-xs font-extrabold text-indigo-950">
                {aiInsight.strongestArea}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {STAT_LABELS[guidanceLanguage]?.focusArea || STAT_LABELS.en.focusArea}
              </span>
              <span className="text-xs font-extrabold text-amber-900">
                {aiInsight.practiceArea}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {STAT_LABELS[guidanceLanguage]?.targetLevel || STAT_LABELS.en.targetLevel}
              </span>
              <span className="text-xs font-extrabold text-sage-800">
                {currentT.patient.level} {aiInsight.recommendedLevel} ({Math.round(aiInsight.confidence * 100)}%)
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed mb-4 bg-white/70 p-3 rounded-2xl border border-indigo-100">
            {aiInsight.reason}
          </p>

          {aiInsight.caregiverSuggestions && aiInsight.caregiverSuggestions.length > 0 && (
            <div className="space-y-2 mb-3">
              <h4 className="text-xs font-bold uppercase text-indigo-900 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{currentT.caregiver.guidance.suggestedForCaregiver}</span>
              </h4>
              <ul className="space-y-1.5">
                {aiInsight.caregiverSuggestions.map((sugg, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                    <span>{sugg}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[11px] text-gray-500 italic mt-3 pt-2 border-t border-indigo-100 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>{aiInsight.disclaimer}</span>
          </div>
        </div>
      )}

      {/* Guidance Cards */}
      <div className="space-y-4">
        {CAREGIVER_GUIDANCE_TIPS.map((tip) => {
          const isExpanded = expandedId === tip.id;
          const title = getGuidanceTipTitle(tip, guidanceLanguage);
          const category = getGuidanceTipCategory(tip, guidanceLanguage);
          const summary = getGuidanceTipSummary(tip, guidanceLanguage);
          const bullets = getGuidanceTipBullets(tip, guidanceLanguage);
          const tipSpeechText = `${title}. ${summary}. ${bullets ? bullets.join('. ') : ''}`;

          const isCardPlaying = activeSpeechId === tip.id;
          const isCardLoading = loadingSpeechId === tip.id;

          return (
            <div
              key={tip.id}
              className={`bg-white rounded-3xl border-2 transition overflow-hidden ${
                isCardPlaying ? 'border-sage-400 shadow-md ring-2 ring-sage-200' : 'border-sage-100 shadow-xs hover:border-sage-300'
              }`}
            >
              <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => toggleExpand(tip.id)}
                  aria-expanded={isExpanded}
                  className="flex-1 text-left flex items-center gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500 rounded-2xl p-1 -m-1"
                >
                  <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center flex-shrink-0">
                    {getTipIcon(tip.icon)}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-sage-800 uppercase tracking-wider bg-sage-50 px-2.5 py-0.5 rounded-full border border-sage-200">
                      {category}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 mt-1">
                      {title}
                    </h3>
                  </div>
                </button>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Accessible Listen Button for Individual Guidance Tip */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayTTS(tip.id, tipSpeechText);
                    }}
                    disabled={loadingSpeechId !== null && !isCardLoading}
                    aria-label={
                      isCardPlaying
                        ? `Stop reading "${title}"`
                        : `Listen to "${title}" in ${LANGUAGE_NAMES[guidanceLanguage] || guidanceLanguage}`
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition min-h-[44px] min-w-[44px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-sage-500 ${
                      isCardPlaying
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-xs'
                        : isCardLoading
                        ? 'bg-sage-100 text-sage-700 cursor-wait'
                        : 'bg-sage-50 hover:bg-sage-100 text-sage-800 border border-sage-200'
                    }`}
                  >
                    {isCardLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sage-600" />
                        <span className="hidden sm:inline">
                          {LISTEN_LABELS[guidanceLanguage]?.loading || LISTEN_LABELS.en.loading}
                        </span>
                      </>
                    ) : isCardPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>{LISTEN_LABELS[guidanceLanguage]?.stop || LISTEN_LABELS.en.stop}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-sage-600" />
                        <span>{LISTEN_LABELS[guidanceLanguage]?.listen || LISTEN_LABELS.en.listen}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(tip.id)}
                    aria-label={isExpanded ? 'Collapse guidance tip' : 'Expand guidance tip'}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-50 transition min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-6 pt-1 border-t border-gray-100 animate-fadeIn">
                  <p className="text-sm font-semibold text-gray-700 bg-sage-50/70 p-4 rounded-2xl border border-sage-200 mb-4 leading-relaxed">
                    {summary}
                  </p>

                  <ul className="space-y-2.5">
                    {bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                        <span className="w-2 h-2 rounded-full bg-sage-500 flex-shrink-0 mt-2" />
                        <span className="leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
