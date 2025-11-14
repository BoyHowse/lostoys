"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import translations, {
  type Locale,
  type TranslationValue,
} from "@/lib/translations";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = "lostoys_locale";

function getFromDictionary(locale: Locale, key: string): string | undefined {
  const segments = key.split(".");
  let current: TranslationValue | undefined = translations[locale];
  for (const segment of segments) {
    if (
      current &&
      typeof current === "object" &&
      Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      current = (current as Record<string, TranslationValue>)[segment];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function detectClientLocale(): Locale {
  if (typeof window === "undefined") {
    return "es";
  }
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "es") {
    return stored;
  }
  const navigatorLocale = window.navigator.language.toLowerCase();
  const detected: Locale = navigatorLocale.startsWith("es") ? "es" : "en";
  window.localStorage.setItem(LOCALE_STORAGE_KEY, detected);
  return detected;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  const setLocale = useCallback((value: Locale) => {
    setLocaleState(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const translate = (key: string) => {
      const localized = getFromDictionary(locale, key);
      if (localized) {
        return localized;
      }
      const fallback = getFromDictionary("en", key);
      return fallback ?? key;
    };
    return {
      locale,
      setLocale,
      t: translate,
    };
  }, [locale, setLocale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const detected = detectClientLocale();
    setLocaleState((prev) => (prev === detected ? prev : detected));
  }, []); // run once on mount

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
