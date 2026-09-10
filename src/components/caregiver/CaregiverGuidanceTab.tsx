import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, ShieldAlert, Sparkles, MessageCircle, CalendarCheck, ShieldCheck, Sun } from 'lucide-react';
import { useLanguage } from '../../locales/LanguageContext';
import { CAREGIVER_GUIDANCE_TIPS } from '../../services/seedData';

export const CaregiverGuidanceTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [expandedId, setExpandedId] = useState<string | null>('tip-1');

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
