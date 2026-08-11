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
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  htmlLang,
  isLocaleCode,
  type LocaleCode,
} from "@/lib/i18n/locales";
import { translate, type MessageKey } from "@/lib/i18n/messages";

type LocaleContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLang(locale: LocaleCode) {
  document.documentElement.lang = htmlLang(locale);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const initial = isLocaleCode(stored) ? stored : DEFAULT_LOCALE;
    setLocaleState(initial);
    applyDocumentLang(initial);
  }, []);

  const setLocale = useCallback((next: LocaleCode) => {
    setLocaleState(next);
    applyDocumentLang(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

/** Inline before paint so html[lang] matches stored preference early. */
export const localeInitScript = `(function(){try{var l=localStorage.getItem('${LOCALE_STORAGE_KEY}');if(!l)return;var map={en:'en',ja:'ja',ko:'ko',fil:'fil',ms:'ms',id:'id','zh-CN':'zh-Hans','zh-TW':'zh-Hant'};if(map[l])document.documentElement.lang=map[l];}catch(e){}})();`;
