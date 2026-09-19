import React, { useState, useMemo, useEffect } from 'react';
import { Heart, ChevronDown, ChevronUp, ShieldAlert, Sparkles, MessageCircle, CalendarCheck, ShieldCheck, Sun, Lightbulb, RefreshCw } from 'lucide-react';
import { getTranslations } from '../../locales/LanguageContext';
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
  lus: { strongArea: 'थिअम जौंग', focusArea: 'ज़िर गै', targetLevel: 'तूम राम कैलौन' },
  kha: { strongArea: 'কা বোর বা খ্লাইন', focusArea: 'কা জাকা প্যনলেইত জিংমুত', targetLevel: 'কা ক্যরদান বা থমু' },
  ny: { strongArea: 'अल्बो लोंगो', focusArea: 'अचिंग लोंगो', targetLevel: 'तेन्नान लोंगो' },
  trp: { strongArea: 'কাহাম জায়া', focusArea: 'সামুং নাইমানি', targetLevel: 'লক্ষ্য মাত্রা' },
};

const PERSONALIZED_INSIGHT_TITLES: Record<Language, string> = {
  en: 'Personalized Activity Guidance',
  as: 'ব্যক্তিগত কাৰ্যসূচী আৰু পৰামৰ্শ',
  bn: 'ব্যক্তিগত কার্যকলাপ ও অন্তর্দৃষ্টি',
  ne: 'व्यक्तिगत गतिविधि तथा परामर्श',
  lus: 'मीलैम ताना रौतना लेह ज़ीर्तीर्ना',
  kha: 'কা জিংব্থাহ বা লা প্যনখ্রেহ বা ক্যরপাং',
  ny: 'अकम गेन्नम अगन',
  trp: 'বোরোকনি বাগৈ বিশেষ পরামর্শ',
};

export const CaregiverGuidanceTab: React.FC<CaregiverGuidanceTabProps> = ({
  patient,
  attempts,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>('tip-1');
  const [patientData, setPatientData] = useState<Patient>(() => {
    const fromDb = db.getPatient();
    return fromDb || (patient as Patient);
  });

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
  // Patient preferredLanguage has absolute priority over caregiver UI language
  const preferredLanguage: Language = (
    latestDbPatient?.preferredLanguage ||
    patientData?.preferredLanguage ||
    patient?.preferredLanguage ||
    'as'
  ) as Language;
  const resolvedAttempts = attempts || db.getGameAttempts();
  const currentT = getTranslations(preferredLanguage);

  // Synchronously compute offline insights strictly using the patient's preferred language
  const aiInsight: AICaregiverInsightResult = useMemo(() => {
    return OfflineInsightsService.generateOfflineInsights(
      resolvedPatient?.name || 'the senior',
      resolvedAttempts,
      preferredLanguage
    );
  }, [preferredLanguage, resolvedPatient?.name, resolvedAttempts]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
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

  return (
    <div className="space-y-6">
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

      {/* AI Personalized Dynamic Insights Card */}
      {aiInsight && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white rounded-3xl p-6 border-2 border-indigo-200 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                  {currentT.caregiver.guidance.aiInsightTitle}
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  {PERSONALIZED_INSIGHT_TITLES[preferredLanguage] || PERSONALIZED_INSIGHT_TITLES.en}
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {currentT.caregiver.guidance.ruleBasedBadge}
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-3">
            {aiInsight.summary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {STAT_LABELS[preferredLanguage]?.strongArea || STAT_LABELS.en.strongArea}
              </span>
              <span className="text-xs font-extrabold text-indigo-950">
                {aiInsight.strongestArea}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {STAT_LABELS[preferredLanguage]?.focusArea || STAT_LABELS.en.focusArea}
              </span>
              <span className="text-xs font-extrabold text-amber-900">
                {aiInsight.practiceArea}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {STAT_LABELS[preferredLanguage]?.targetLevel || STAT_LABELS.en.targetLevel}
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
          const title = getGuidanceTipTitle(tip, preferredLanguage);
          const category = getGuidanceTipCategory(tip, preferredLanguage);
          const summary = getGuidanceTipSummary(tip, preferredLanguage);
          const bullets = getGuidanceTipBullets(tip, preferredLanguage);

          return (
            <div
              key={tip.id}
              className="bg-white rounded-3xl border-2 border-sage-100 shadow-xs hover:border-sage-300 transition overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(tip.id)}
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
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
                </div>

                <div className="p-2 text-gray-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

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
