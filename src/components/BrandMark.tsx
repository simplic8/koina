const MARK_PATHS = (
  <>
    <circle cx="32" cy="8" r="5.5" />
    <circle cx="56" cy="32" r="5.5" />
    <circle cx="32" cy="56" r="5.5" />
    <circle cx="8" cy="32" r="5.5" />
    <path d="M41.23 6.63A27 27 0 0 1 57.37 22.77L47.5 26.36A16.5 16.5 0 0 0 37.64 16.5Z" />
    <path d="M57.37 41.23A27 27 0 0 1 41.23 57.37L37.64 47.5A16.5 16.5 0 0 0 47.5 37.64Z" />
    <path d="M22.77 57.37A27 27 0 0 1 6.63 41.23L16.5 37.64A16.5 16.5 0 0 0 26.36 47.5Z" />
    <path d="M6.63 22.77A27 27 0 0 1 22.77 6.63L26.36 16.5A16.5 16.5 0 0 0 16.5 26.36Z" />
  </>
);

/**
 * KOINA mark (same geometry as `/koina-logo.svg`).
 * Uses currentColor so it follows light/dark ink; pass `light` for forced white.
 */
export function BrandMark({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
  /** @deprecated unused — kept for existing call sites */
  withGems?: boolean;
}) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
    >
      <g fill={light ? "#FFFFFF" : "currentColor"}>{MARK_PATHS}</g>
    </svg>
  );
}

/** Compact mark that inherits `currentColor` (ecosystem bar, etc.). */
export function KoinaMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
    >
      <g fill="currentColor">{MARK_PATHS}</g>
    </svg>
  );
}
