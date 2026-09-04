import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLanguage } from '../types';
import { SUPPORTED_LANGUAGES, LanguageInfo } from '../data/indianLanguages';
import { getTranslation } from '../data/translations';
import { getStoredAuthSession } from '../utils/authStorage';
import { loadKioskDataFromStorage } from '../utils/kioskStorage';

export const PUBLIC_LANGUAGE_STORAGE_KEY = 'medikiosk_public_language_pref';
export const LEGACY_LANGUAGE_STORAGE_KEY = 'medikiosk_language_pref';

interface LanguageContextType {
  // Effective active language: patientLanguage if authenticated patient, otherwise publicLanguage
  language: SupportedLanguage;
  publicLanguage: SupportedLanguage;
  patientLanguage: SupportedLanguage | null;
  isPatientMode: boolean;
  setLanguage: (lang: SupportedLanguage | string) => void;
  setPublicLanguage: (lang: SupportedLanguage | string) => void;
  setPatientLanguage: (lang: SupportedLanguage | string) => void;
  clearPatientLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  langConfig: LanguageInfo;
  languages: typeof SUPPORTED_LANGUAGES;
  speak: (text: string, langCodeOverride?: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Public / Pre-Login Language (persisted in localStorage, retained across login/logout)
  const [publicLanguage, setPublicLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(PUBLIC_LANGUAGE_STORAGE_KEY) || localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY);
      if (saved && saved in SUPPORTED_LANGUAGES) {
        return saved as SupportedLanguage;
      }
    } catch (e) {
      console.warn('Unable to read public language preference from localStorage:', e);
    }
    return 'en'; // Default to English as per requirements
  });

  // 2. Authenticated Patient Preferred Language (session-scoped, null when logged out)
  const [patientLanguage, setPatientLanguageState] = useState<SupportedLanguage | null>(() => {
    try {
      const session = getStoredAuthSession();
      if (session && session.role === 'patient') {
        const patientId = session.patientId || session.userId;
        const kioskData = loadKioskDataFromStorage();
        const patient = kioskData.patients.find(p => p.id === patientId);
        if (patient?.language && patient.language in SUPPORTED_LANGUAGES) {
          return patient.language as SupportedLanguage;
        }
      }
    } catch (e) {
      // In kiosk initial boot without session
    }
    return null;
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Set Public Language explicitly (saves to localStorage)
  const setPublicLanguage = useCallback((newLang: SupportedLanguage | string) => {
    const validLang = (newLang in SUPPORTED_LANGUAGES ? newLang : 'en') as SupportedLanguage;
    setPublicLanguageState(validLang);
    try {
      localStorage.setItem(PUBLIC_LANGUAGE_STORAGE_KEY, validLang);
      localStorage.setItem(LEGACY_LANGUAGE_STORAGE_KEY, validLang);
    } catch (e) {
      console.warn('Unable to persist public language preference to localStorage:', e);
    }
  }, []);

  // Set Patient Language explicitly (session-only, does NOT touch publicLanguage in localStorage)
  const setPatientLanguage = useCallback((newLang: SupportedLanguage | string) => {
    const validLang = (newLang in SUPPORTED_LANGUAGES ? newLang : 'en') as SupportedLanguage;
    setPatientLanguageState(validLang);
  }, []);

  // Clear Patient Language (called on patient logout to restore publicLanguage)
  const clearPatientLanguage = useCallback(() => {
    setPatientLanguageState(null);
  }, []);

  // Context-aware setLanguage (if in patient mode, update patientLanguage; otherwise update publicLanguage)
  const setLanguage = useCallback((newLang: SupportedLanguage | string) => {
    const validLang = (newLang in SUPPORTED_LANGUAGES ? newLang : 'en') as SupportedLanguage;
    if (patientLanguage !== null) {
      setPatientLanguage(validLang);
    } else {
      setPublicLanguage(validLang);
    }
  }, [patientLanguage, setPatientLanguage, setPublicLanguage]);

  // Effective active language
  const effectiveLanguage: SupportedLanguage = patientLanguage !== null ? patientLanguage : publicLanguage;
  const isPatientMode: boolean = patientLanguage !== null;

  const t = useCallback(
    (key: string, fallback?: string) => {
      return getTranslation(effectiveLanguage, key, fallback);
    },
    [effectiveLanguage]
  );

  const langConfig = SUPPORTED_LANGUAGES[effectiveLanguage] || SUPPORTED_LANGUAGES.en;

  // Text to Speech support for the active language
  const speak = useCallback(
    (text: string, langCodeOverride?: string) => {
      if (!('speechSynthesis' in window) || !text) return;
      try {
        window.speechSynthesis.cancel();
        const targetLangCode = langCodeOverride || langConfig.speechCode;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = targetLangCode;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(
          v => v.lang.startsWith(targetLangCode.substring(0, 2)) || v.lang === targetLangCode
        );
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('TTS playback error:', err);
        setIsSpeaking(false);
      }
    },
    [langConfig]
  );

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language: effectiveLanguage,
        publicLanguage,
        patientLanguage,
        isPatientMode,
        setLanguage,
        setPublicLanguage,
        setPatientLanguage,
        clearPatientLanguage,
        t,
        langConfig,
        languages: SUPPORTED_LANGUAGES,
        speak,
        stopSpeaking,
        isSpeaking
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

