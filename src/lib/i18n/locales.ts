export const LOCALES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "fil", label: "Filipino / Tagalog", nativeLabel: "Filipino" },
  { code: "ms", label: "Bahasa Malaysia", nativeLabel: "Bahasa Melayu" },
  { code: "id", label: "Bahasa Indonesia", nativeLabel: "Bahasa Indonesia" },
  { code: "zh-CN", label: "Chinese — Simplified", nativeLabel: "简体中文" },
  { code: "zh-TW", label: "Chinese — Traditional", nativeLabel: "繁體中文" },
] as const;

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";
export const LOCALE_STORAGE_KEY = "jv-locale";

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return LOCALES.some((locale) => locale.code === value);
}

export function htmlLang(locale: LocaleCode) {
  if (locale === "zh-CN") return "zh-Hans";
  if (locale === "zh-TW") return "zh-Hant";
  return locale;
}
