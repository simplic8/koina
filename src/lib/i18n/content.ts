import type { LocaleCode } from "@/lib/i18n/locales";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { Game, GameTranslation } from "@/lib/types";

export type LocalizedGameCopy = {
  title: string;
  description: string | null;
};

/** Resolve curated game title/description for a locale (falls back to EN, then base row). */
export function localizeGame(
  game:
    | Pick<Game, "title" | "translations"> & {
        description?: string | null;
      }
    | null
    | undefined,
  locale: LocaleCode,
): LocalizedGameCopy {
  if (!game) {
    return { title: "", description: null };
  }

  const translations = game.translations ?? [];
  const match =
    translations.find((row) => row.locale === locale) ??
    (locale !== DEFAULT_LOCALE
      ? translations.find((row) => row.locale === DEFAULT_LOCALE)
      : undefined);

  return {
    title: match?.title?.trim() || game.title,
    description:
      match?.description !== undefined && match?.description !== null
        ? match.description
        : (game.description ?? null),
  };
}

export function translationsByLocale(
  translations: GameTranslation[] | undefined,
): Partial<Record<LocaleCode, GameTranslation>> {
  const map: Partial<Record<LocaleCode, GameTranslation>> = {};
  for (const row of translations ?? []) {
    map[row.locale] = row;
  }
  return map;
}
