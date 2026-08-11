"use client";

import { useEffect, useState } from "react";
import { LiveDot } from "../ui/Badge";
import { Button } from "../ui/Button";
import { BrandMark } from "../BrandMark";
import { Ticker } from "./Ticker";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { HeroQuote } from "@/lib/types";

const HERO_LINE_MS = 4_000;
const HERO_LINE_STAGGER_MS = 180;
const HERO_CYCLE_MS = HERO_LINE_MS + HERO_LINE_STAGGER_MS;

export function Hero({ quotes }: { quotes: HeroQuote[] }) {
  const { t } = useLocale();
  const [quoteTick, setQuoteTick] = useState(0);
  const quote = quotes.length
    ? quotes[quoteTick % quotes.length]
    : undefined;
  const firstLine = quote?.first_line ?? t("hero.defaultFirst");
  const secondLine = quote?.second_line ?? t("hero.defaultSecond");

  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuoteTick((current) => current + 1);
    }, HERO_CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [quoteTick]);

  return (
    <section className="relative flex min-h-[calc(100svh-102px)] flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(232,90,50,0.12),transparent_50%),radial-gradient(ellipse_at_80%_10%,rgba(41,193,148,0.10),transparent_45%),radial-gradient(ellipse_at_60%_90%,rgba(231,60,126,0.10),transparent_40%)]"
      />
      <div className="relative mx-auto flex w-full max-w-[1180px] flex-1 content-center items-center px-6 py-14">
        <div>
          <p className="mb-3.5 flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
            <LiveDot className="animate-pulse-dot" />
            {t("hero.live")}
          </p>
          <h1 className="mb-3 flex flex-wrap items-center gap-3 text-[clamp(42px,6vw,72px)] leading-[1.02] tracking-tight">
            <span className="font-[family-name:var(--font-space-grotesk)] font-bold">
              KOINA
            </span>
            <BrandMark withGems className="h-[0.72em] w-[0.72em]" />
          </h1>
          <p className="mb-5 text-[clamp(20px,2.4vw,28px)] leading-[1.25] text-ink-70 italic">
            <span
              key={`hero-a-${quoteTick}`}
              className="animate-hero-line inline-block"
            >
              {firstLine}
            </span>{" "}
            <em
              key={`hero-b-${quoteTick}`}
              className="animate-hero-line animate-hero-line-delay not-italic text-accent-500"
            >
              {secondLine}
            </em>
          </p>
          <p className="mb-[30px] max-w-[48ch] text-[17px] text-ink-70">
            {t("hero.lead")}
            <span className="mt-1 block text-[13px] text-ink-40">
              {t("hero.byline")}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/#spaces">{t("hero.ctaSpaces")}</Button>
            <Button href="/#ethos" variant="dark">
              {t("hero.ctaEthos")}
            </Button>
            <Button href="/register" variant="outline">
              {t("hero.ctaJoin")}
            </Button>
          </div>
        </div>
      </div>
      <Ticker />
    </section>
  );
}
