import { KoinaMark } from "./BrandMark";

const ECOSYSTEM = [
  { name: "JustVibing", href: "https://justvibing.fun" },
  { name: "Oshikatsu", href: "https://oshikatsu.justvibing.fun" },
  { name: "NUMA", href: "#" },
] as const;

export function KoinaBar() {
  return (
    <div className="bg-inverse">
      <div className="mx-auto flex h-[34px] max-w-[1180px] items-center gap-2.5 px-6 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.03em] text-on-inverse-subtle">
        <a
          href="/"
          className="flex items-center gap-1.5 font-semibold tracking-[0.08em] text-on-inverse no-underline"
          aria-label="KOINA"
        >
          <KoinaMark />
          KOINA
        </a>
        <span className="text-on-inverse-faint">/</span>
        <span className="text-on-inverse-muted">κοινά</span>
        <span className="ml-auto hidden text-on-inverse-faint sm:inline">
          Ecosystem —{" "}
          {ECOSYSTEM.map((item, i) => (
            <span key={item.name}>
              {i > 0 ? " · " : null}
              <a
                href={item.href}
                className="text-on-inverse-muted no-underline hover:text-on-inverse"
              >
                {item.name}
              </a>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
