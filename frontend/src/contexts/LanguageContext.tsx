import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    login: 'Login',
    signup: 'Sign Up',
    subjects: 'Subjects',
    aiChat: 'AI Chat',
    experts: 'Experts',
    dashboard: 'Dashboard',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    
    // Language switcher
    language: 'Language',
    english: 'English',
    kiswahili: 'Kiswahili'
  },
  sw: {
    // Header
    login: 'Ingia',
    signup: 'Jisajili',
    subjects: 'Mazingira',
    aiChat: 'AI Chat',
    experts: 'Wataalamu',
    dashboard: 'Dashboard',
    
    // Common
    loading: 'Inapakia...',
    error: 'Kosa',
    success: 'Imefanikiwa',
    cancel: 'Ghairi',
    save: 'Hifadhi',
    
    // Language switcher
    language: 'Lugha',
    english: 'Kiingereza',
    kiswahili: 'Kiswahili'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('elimubuddy-language') as Language;
    return savedLang && (savedLang === 'en' || savedLang === 'sw') ? savedLang : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('elimubuddy-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};