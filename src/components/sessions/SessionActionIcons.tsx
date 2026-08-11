export function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12.5"
        cy="3.5"
        r="1.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12.5"
        cy="12.5"
        r="1.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="3.5"
        cy="8"
        r="1.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.15 7.15 10.85 4.35M5.15 8.85l5.7 2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M9.5 3.5 12.5 6.5M3 13l.75-3L11.5 2.25a1.06 1.06 0 0 1 1.5 1.5L5.25 11.5 2 12.25z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 4.5h9M6.5 4.5V3.25A.75.75 0 0 1 7.25 2.5h1.5a.75.75 0 0 1 .75.75V4.5M5 4.5l.5 8.25a.75.75 0 0 0 .75.7h3.5a.75.75 0 0 0 .75-.7L11 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CardsViewIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <rect
        x="2"
        y="2"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="2"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="2"
        y="9"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="9"
        width="5"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ListViewIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 4h11M2.5 8h11M2.5 12h11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
