import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language } from '../types';
import arTranslations from '../locales/ar.json';
import enTranslations from '../locales/en.json';

type TranslationMap = Record<string, any>;

const translations: Record<Language, TranslationMap> = {
  ar: arTranslations,
  en: enTranslations,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  fontClass: string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'ar',
  setLanguage: () => {},
  t: (key: string) => key,
  dir: 'rtl',
  fontClass: 'font-arabic',
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem('pm_language') as Language) || 'ar'
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('pm_language', lang);
  }, []);

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    // Toggle a class on body for font styling
    document.body.classList.remove('font-arabic', 'font-english');
    document.body.classList.add(language === 'ar' ? 'font-arabic' : 'font-english');
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      const keys = key.split('.');
      let result: any = translations[language];
      for (const k of keys) {
        if (result && typeof result === 'object') {
          result = result[k];
        } else {
          return key;
        }
      }
      return (typeof result === 'string' ? result : key);
    },
    [language]
  );

  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const fontClass = language === 'ar' ? 'font-arabic' : 'font-english';

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dir, fontClass }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
