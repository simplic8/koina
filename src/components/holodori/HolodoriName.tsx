"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

/** Locale-aware Holodori name (Japanese → ホロドリ). */
export function HolodoriName({
  uppercase = false,
  className = "",
}: {
  uppercase?: boolean;
  className?: string;
}) {
  const { locale, t } = useLocale();
  const name = t("nav.holodori");
  const display =
    uppercase && locale !== "ja" ? name.toUpperCase() : name;

  return <span className={className}>{display}</span>;
}
