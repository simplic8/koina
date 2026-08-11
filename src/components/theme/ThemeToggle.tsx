"use client";

import type { ReactNode } from "react";
import { useTheme, type Theme } from "./ThemeProvider";

const labels: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.5v1.75M8 12.75V14.5M1.5 8h1.75M12.75 8H14.5M3.05 3.05l1.24 1.24M11.71 11.71l1.24 1.24M12.95 3.05l-1.24 1.24M4.29 11.71l-1.24 1.24"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.2 9.35A5.5 5.5 0 0 1 6.65 2.8 5.75 5.75 0 1 0 13.2 9.35Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2.25"
        y="3.25"
        width="11.5"
        height="8"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 13.25h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const icons: Record<Theme, () => ReactNode> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const Icon = icons[theme];

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-ink-15 text-ink-70 transition-colors hover:border-ink hover:text-ink"
      aria-label={`Theme: ${labels[theme]}. Click to change.`}
      title={`Theme: ${labels[theme]}`}
    >
      <Icon />
    </button>
  );
}
