"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Language } from "@/lib/types";
import en from "@/locales/en.json";
import te from "@/locales/te.json";
import hi from "@/locales/hi.json";

type TranslationDict = Record<string, string>;

const translations: Record<Language, TranslationDict> = {
  en: en as TranslationDict,
  te: te as TranslationDict,
  hi: hi as TranslationDict,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

const STORAGE_KEY = "mitraai_language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  // Restore language from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "te" || saved === "hi" || saved === "en") {
        setLanguageState(saved as Language);
      }
    } catch (e) {
      console.warn("Could not read language from localStorage", e);
    }
    setMounted(true);
  }, []);

  // Update html lang and data-language attribute
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.setAttribute("data-language", language);
    }
  }, [language]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn("Could not persist language to localStorage", e);
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
      document.documentElement.setAttribute("data-language", newLang);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict = translations[language] || translations.en;
      let template = activeDict[key];

      // Fallback to English if missing
      if (!template) {
        template = translations.en[key] || key;
      }

      if (params) {
        return template.replace(/\{(\w+)\}/g, (_, paramKey) => {
          return params[paramKey] !== undefined ? String(params[paramKey]) : `{${paramKey}}`;
        });
      }

      return template;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
