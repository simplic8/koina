"use client";

import { useEffect, useState } from "react";
import type { HolodoriHeroLine } from "@/lib/types";

const ANIMATION_MS = 4_000;
const STAGGER_MS = 280;
const WORD_COUNT = 3;
/** Wait until the last staggered word finishes its one-shot animation. */
const CYCLE_MS = ANIMATION_MS + STAGGER_MS * (WORD_COUNT - 1);

const FALLBACK_LINE: HolodoriHeroLine = {
  id: "fallback",
  word_one: "Play",
  word_two: "Expand",
  word_three: "Dreams",
  sort_order: 1,
};

export function HolodoriHeroTitle({ lines }: { lines: HolodoriHeroLine[] }) {
  const pool = lines.length ? lines : [FALLBACK_LINE];
  // Tick drives both content index and remount key so the animation restarts in sync.
  const [tick, setTick] = useState(0);
  const line = pool[tick % pool.length];
  const words = [
    { text: line.word_one.trim(), accent: false },
    { text: line.word_two.trim(), accent: false },
    { text: line.word_three.trim(), accent: true },
  ];

  useEffect(() => {
    const id = window.setTimeout(() => {
      setTick((current) => current + 1);
    }, CYCLE_MS);
    return () => window.clearTimeout(id);
  }, [tick]);

  return (
    <h1 className="mb-5 whitespace-nowrap text-[clamp(18px,2.6vw,32px)] leading-[1.15] tracking-[-0.02em]">
      <span key={tick} className="inline">
        {words.map((word, wordIndex) => (
          <span
            key={`${tick}-${wordIndex}`}
            className={`animate-holodori-word inline-block ${
              word.accent ? "holodori-gradient-text" : ""
            }`}
            style={{ animationDelay: `${wordIndex * STAGGER_MS}ms` }}
          >
            {word.text}
            {wordIndex < words.length - 1 ? "\u00A0" : null}
          </span>
        ))}
      </span>
    </h1>
  );
}
