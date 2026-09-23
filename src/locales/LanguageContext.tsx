import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { as } from './as';
import { bn } from './bn';
import { ne } from './ne';
import { lus } from './lus';
import { kha } from './kha';
import { ny } from './ny';
import { trp } from './trp';
import { mni } from './mni';
import { Language } from '../types';

export type TranslationType = typeof en;

export const translations: Record<Language, TranslationType> = {
  en,
  as: as as unknown as TranslationType,
  bn: bn as unknown as TranslationType,
  ne: ne as unknown as TranslationType,
  lus: lus as unknown as TranslationType,
  kha: kha as unknown as TranslationType,
  ny: ny as unknown as TranslationType,
  trp: trp as unknown as TranslationType,
  mni: mni as unknown as TranslationType,
};

export const getTranslations = (lang: Language): TranslationType => translations[lang] || en;

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
  { code: 'lus', label: 'Mizo', nativeLabel: 'Mizo ṭawng' },
  { code: 'kha', label: 'Khasi', nativeLabel: 'Ka Ktien Khasi' },
  { code: 'ny', label: 'Nyishi', nativeLabel: 'Nyishi' },
  { code: 'trp', label: 'Kokborok', nativeLabel: 'ককবরক (Kokborok)' },
  { code: 'mni', label: 'Manipuri', nativeLabel: 'ꯃꯤꯇꯩꯂꯣꯟ (মৈতৈলোন্)' },
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
  format: (template: string, vars: Record<string, string | number>) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('memora_language') as Language | null;
    const valid: Language[] = ['en', 'as', 'bn', 'ne', 'lus', 'kha', 'ny', 'trp', 'mni'];
    return saved && valid.includes(saved) ? saved : 'as'; // Default to Assamese for Assam region
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('memora_language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t: TranslationType = translations[language] || en;

  const format = (template: string, vars: Record<string, string | number>) => {
    return Object.entries(vars).reduce((acc, [key, val]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, template);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, format, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
