"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const TICKER_ITEMS: { key: MessageKey; tone: "neutral" | "up" | "down" }[] = [
  { key: "ticker.1", tone: "neutral" },
  { key: "ticker.2", tone: "up" },
  { key: "ticker.3", tone: "neutral" },
  { key: "ticker.4", tone: "down" },
  { key: "ticker.5", tone: "neutral" },
  { key: "ticker.6", tone: "up" },
  { key: "ticker.7", tone: "neutral" },
];

export function Ticker() {
  const { t } = useLocale();
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="overflow-hidden bg-inverse py-3 text-on-inverse">
      <div className="animate-ticker flex w-max gap-12 whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={`${item.key}-${i}`}
            className={`font-[family-name:var(--font-ibm-plex-mono)] text-[13px] tracking-[0.02em] ${
              item.tone === "up"
                ? "text-accent-500"
                : item.tone === "down"
                  ? "text-on-inverse-subtle"
                  : ""
            }`}
          >
            {t(item.key)}
          </span>
        ))}
      </div>
    </div>
  );
}
