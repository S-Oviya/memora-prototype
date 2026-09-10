import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './en';
import { as } from './as';
import { Language } from '../types';

type TranslationType = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationType;
  format: (template: string, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('memora_language') as Language | null;
    return saved === 'as' || saved === 'en' ? saved : 'as'; // Default to Assamese for Assam region or English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('memora_language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t: TranslationType = language === 'as' ? (as as unknown as TranslationType) : en;

  const format = (template: string, vars: Record<string, string | number>) => {
    return Object.entries(vars).reduce((acc, [key, val]) => {
      return acc.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }, template);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, format }}>
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
