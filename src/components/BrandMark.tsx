import Image from "next/image";

/**
 * KOINA mark from the Canva brand deck — four figures gathered around a shared center.
 * Uses the exported Canva logo asset for fidelity; SVG fallback for monochrome / light contexts.
 */
export function BrandMark({
  className = "",
  light = false,
  withGems = false,
}: {
  className?: string;
  light?: boolean;
  /** Prefer the full-color Canva PNG (includes gem accents when present in asset). */
  withGems?: boolean;
}) {
  if (!light) {
    return (
      <Image
        src="/koina-logo.png"
        alt=""
        width={64}
        height={64}
        aria-hidden
        className={`object-contain ${className}`}
        priority={withGems}
      />
    );
  }

  return <KoinaMark className={className} />;
}

/** Compact / monochrome mark (ecosystem bar, light-on-dark). */
export function KoinaMark({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={className}
    >
      <circle cx="32" cy="7.5" r="5.5" fill="currentColor" />
      <circle cx="56.5" cy="32" r="5.5" fill="currentColor" />
      <circle cx="32" cy="56.5" r="5.5" fill="currentColor" />
      <circle cx="7.5" cy="32" r="5.5" fill="currentColor" />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M32 14c9.94 0 18 8.06 18 18s-8.06 18-18 18-18-8.06-18-18 8.06-18 18-18zm0 7.5c-5.8 0-10.5 4.7-10.5 10.5S26.2 42.5 32 42.5 42.5 37.8 42.5 32 37.8 21.5 32 21.5zM39.2 12.2c6.6 2.7 11.7 7.8 14.4 14.4l-6.2 2.5c-1.9-4.5-5.4-8-9.9-9.9l1.7-7zM51.8 39.2c-2.7 6.6-7.8 11.7-14.4 14.4l-2.5-6.2c4.5-1.9 8-5.4 9.9-9.9l7 1.7zM24.8 51.8c-6.6-2.7-11.7-7.8-14.4-14.4l6.2-2.5c1.9 4.5 5.4 8 9.9 9.9l-1.7 7zM12.2 24.8c2.7-6.6 7.8-11.7 14.4-14.4l2.5 6.2c-4.5 1.9-8 5.4-9.9 9.9l-7-1.7z"
      />
    </svg>
  );
}