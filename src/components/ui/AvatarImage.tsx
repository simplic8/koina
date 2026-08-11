import type { ReactNode } from "react";

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
};

/**
 * Renders remote avatars (including Google lh3.googleusercontent.com).
 * Google returns 403 when a cross-site Referer is sent, so we omit it.
 */
export function AvatarImage({
  src,
  alt = "",
  className = "",
  fallback = null,
}: Props) {
  if (!src) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      decoding="async"
    />
  );
}
