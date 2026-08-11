import type { ReactNode } from "react";

const styles = {
  live: "bg-accent-500 text-white",
  vetted: "bg-inverse text-on-inverse",
  ghost: "bg-accent-50 text-accent-700",
} as const;

export function Badge({
  tone = "ghost",
  children,
  className = "",
}: {
  tone?: keyof typeof styles;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] font-semibold tracking-[0.08em] uppercase ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-accent-500 ${className}`}
    />
  );
}
