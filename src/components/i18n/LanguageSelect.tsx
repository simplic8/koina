"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LOCALES } from "@/lib/i18n/locales";
import { useLocale } from "./LocaleProvider";

export function LanguageSelect({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = LOCALES.find((item) => item.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-[6px] border border-ink-15 text-ink-70 transition-colors hover:border-ink hover:text-ink ${
          compact ? "w-9 px-0" : "min-w-[7.5rem] px-2.5"
        }`}
        aria-label={t("nav.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        title={`${t("nav.language")}: ${current.nativeLabel}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M2.5 8h11M8 2.25c1.6 1.7 2.4 3.55 2.4 5.75S9.6 12.05 8 13.75M8 2.25C6.4 3.95 5.6 5.8 5.6 8s.8 4.05 2.4 5.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {!compact && (
          <span className="max-w-[5.5rem] truncate text-xs font-semibold">
            {current.nativeLabel}
          </span>
        )}
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("nav.language")}
          className="absolute top-[calc(100%+6px)] right-0 z-50 m-0 min-w-[12.5rem] list-none overflow-hidden rounded-[6px] border border-ink-08 bg-base py-1 shadow-[0_10px_30px_rgba(11,11,12,0.12)]"
        >
          {LOCALES.map((item) => {
            const selected = item.code === locale;
            return (
              <li key={item.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full cursor-pointer flex-col items-start gap-0.5 border-0 bg-transparent px-3 py-2 text-left text-sm hover:bg-surface ${
                    selected ? "text-accent-600" : "text-ink"
                  }`}
                  onClick={() => {
                    setLocale(item.code);
                    setOpen(false);
                  }}
                >
                  <span className="font-semibold">{item.nativeLabel}</span>
                  <span className="text-xs text-ink-40">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
