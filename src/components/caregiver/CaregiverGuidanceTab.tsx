import React, { useState, useEffect } from 'react';
import { Heart, ChevronDown, ChevronUp, ShieldAlert, Sparkles, MessageCircle, CalendarCheck, ShieldCheck, Sun, Lightbulb, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { CAREGIVER_GUIDANCE_TIPS } from '../../services/seedData';
import { api } from '../../services/api';
import { Patient, GameAttempt, AICaregiverInsightResult } from '../../types';
import { OfflineInsightsService } from '../../services/offlineInsightsService';
import { db } from '../../services/db';

interface CaregiverGuidanceTabProps {
  patient?: Patient;
  attempts?: GameAttempt[];
}

export const CaregiverGuidanceTab: React.FC<CaregiverGuidanceTabProps> = ({
  patient,
  attempts,
}) => {
  const { t, language } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>('tip-1');

  const resolvedPatient = patient || db.getPatient();
  const resolvedAttempts = attempts || db.getGameAttempts();

  const [aiInsight, setAiInsight] = useState<AICaregiverInsightResult>(() =>
    OfflineInsightsService.generateOfflineInsights(
      resolvedPatient.name,
      resolvedAttempts,
      language
    )
  );

  useEffect(() => {
    // Generate caregiver insights 100% offline from local GameAttempt data
    const offlineResult = OfflineInsightsService.generateOfflineInsights(
      resolvedPatient.name,
      resolvedAttempts,
      language
    );
    setAiInsight(offlineResult);
  }, [language, resolvedPatient.name, resolvedAttempts]);

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
            {t.caregiver.guidance.title}
          </h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {t.caregiver.guidance.subtitle}
        </p>

        {/* Non-Medical Disclaimer */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            {t.caregiver.guidance.disclaimer}
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
                  {language === 'as' ? 'অন-ডিভাইচ এআই নিৰ্দেশনা' : 'On-Device Cognitive AI Guidance'}
                </span>
                <h3 className="text-lg font-black text-gray-900">
                  {language === 'as' ? 'ব্যক্তিগত পৰামৰ্শ' : 'Patient-Centered Activity Guidance'}
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {language === 'as' ? 'অফলাইন এআই' : 'On-Device ML'}
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-3">
            {aiInsight.summary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {language === 'as' ? 'দক্ষতা' : 'Strong Area'}
              </span>
              <span className="text-xs font-extrabold text-indigo-950">
                {aiInsight.strongestArea}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {language === 'as' ? 'অনুশীলন' : 'Focus Area'}
              </span>
              <span className="text-xs font-extrabold text-amber-900">
                {aiInsight.practiceArea}
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">
                {language === 'as' ? 'নিৰ্দেশিত স্তৰ' : 'Target Level'}
              </span>
              <span className="text-xs font-extrabold text-emerald-800">
                Level {aiInsight.recommendedLevel} ({Math.round(aiInsight.confidence * 100)}%)
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
                <span>{language === 'as' ? 'পৰামৰ্শসমূহ' : 'Supportive Suggestions'}:</span>
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
          const title = language === 'as' ? tip.titleAs : tip.titleEn;
          const category = language === 'as' ? tip.categoryAs : tip.categoryEn;
          const summary = language === 'as' ? tip.summaryAs : tip.summaryEn;
          const bullets = language === 'as' ? tip.bulletPointsAs : tip.bulletPointsEn;

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
