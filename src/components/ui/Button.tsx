import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

const base =
  "inline-flex items-center gap-2 rounded-[6px] border px-5 py-[11px] text-sm font-semibold no-underline transition-colors cursor-pointer";

const variants = {
  primary:
    "border-transparent bg-accent-500 !text-white hover:bg-accent-600 hover:!text-white",
  dark: "border-transparent bg-btn-dark !text-btn-dark-fg hover:bg-btn-dark-hover hover:!text-btn-dark-fg",
  outline:
    "border-ink bg-transparent text-ink hover:border-accent-500 hover:text-accent-500",
} as const;

const sizes = {
  md: "",
  sm: "px-3.5 py-2 text-[13px]",
} as const;

type Props = {
  href?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
  title?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  type = "button",
  disabled,
  "aria-label": ariaLabel,
  title,
  onClick,
}: Props) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;

  if (href && !disabled) {
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal) {
      return (
        <a
          href={href}
          className={cls}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          title={title}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        href={href}
        className={cls}
        onClick={onClick}
        aria-label={ariaLabel}
        title={title}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
