import { useState } from 'react';
import { useI18n } from '../lib/i18n';

interface OnboardingProps {
  onComplete: () => void;
  onAddFirst: () => void;
}

export default function Onboarding({ onComplete, onAddFirst }: OnboardingProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  const screens = [
    // ─── Screen 1: What is SAMPASS? ────────────
    {
      gradient: 'from-indigo-600 via-purple-600 to-pink-500',
      icon: (
        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
      badge: '🔑',
      title: t('onboarding.screen1Title'),
      desc: t('onboarding.screen1Desc'),
      features: [
        { icon: '📁', text: t('onboarding.screen1Feature1') },
        { icon: '🔍', text: t('onboarding.screen1Feature2') },
        { icon: '⚡', text: t('onboarding.screen1Feature3') },
      ],
    },
    // ─── Screen 2: How it protects you ─────────
    {
      gradient: 'from-emerald-600 via-green-600 to-teal-500',
      icon: (
        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      badge: '🛡️',
      title: t('onboarding.screen2Title'),
      desc: t('onboarding.screen2Desc'),
      features: [
        { icon: '🔐', text: t('onboarding.screen2Feature1') },
        { icon: '🔑', text: t('onboarding.screen2Feature2') },
        { icon: '👁️‍🗨️', text: t('onboarding.screen2Feature3') },
      ],
    },
    // ─── Screen 3: What to do now ─────────────
    {
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      icon: (
        <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: '🚀',
      title: t('onboarding.screen3Title'),
      desc: t('onboarding.screen3Desc'),
      features: [
        { icon: '💡', text: t('onboarding.screen3Tip') },
      ],
    },
  ];

  const current = screens[step];
  const isLast = step === screens.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleCta = () => {
    onComplete();
    onAddFirst();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scaleIn" key={step}>

          {/* Top gradient area */}
          <div className={`relative bg-gradient-to-br ${current.gradient} px-8 pt-10 pb-12 text-center overflow-hidden`}>
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 start-4 w-24 h-24 rounded-full bg-white/20" />
              <div className="absolute bottom-4 end-4 w-32 h-32 rounded-full bg-white/10" />
            </div>

            {/* Badge */}
            <span className="text-4xl mb-4 block">{current.badge}</span>

            {/* Icon */}
            <div className="relative z-10 w-24 h-24 mx-auto bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
              {current.icon}
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {screens.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'w-8 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Title */}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
              {current.title}
            </h2>

            {/* Description */}
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center leading-relaxed mb-5">
              {current.desc}
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-6">
              {current.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl">
                  <span className="text-lg shrink-0">{feat.icon}</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{feat.text}</p>
                </div>
              ))}
            </div>

            {/* CTA on last screen */}
            {isLast && (
              <button
                onClick={handleCta}
                className="w-full py-3.5 mb-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all duration-200 active:scale-[0.98] text-base"
              >
                {t('onboarding.screen3Cta')}
              </button>
            )}

            {/* Next / Start button */}
            <button
              onClick={handleNext}
              className={`w-full py-3.5 font-semibold rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] text-base ${
                isLast
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25'
              }`}
            >
              {isLast ? t('onboarding.start') : t('onboarding.next')}
            </button>
          </div>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div className="text-center mt-4">
            <button
              onClick={onComplete}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              {t('onboarding.skip')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
