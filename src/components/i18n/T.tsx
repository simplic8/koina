"use client";

import type { MessageKey } from "@/lib/i18n/messages";
import { useLocale } from "./LocaleProvider";

/** Renders a translated string for server components / simple slots. */
export function T({ k }: { k: MessageKey }) {
  const { t } = useLocale();
  return <>{t(k)}</>;
}

export function PageIntro({
  titleKey,
  leadKey,
  className,
}: {
  titleKey: MessageKey;
  leadKey: MessageKey;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <div className={className}>
      <h1 className="mb-2 text-3xl">{t(titleKey)}</h1>
      <p className="mb-8 text-ink-70">{t(leadKey)}</p>
    </div>
  );
}
