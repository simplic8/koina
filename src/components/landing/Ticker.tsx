import { SEED_TICKER } from "@/lib/seed";

export function Ticker() {
  const items = [...SEED_TICKER, ...SEED_TICKER];

  return (
    <div className="overflow-hidden bg-inverse py-3 text-on-inverse">
      <div className="animate-ticker flex w-max gap-12 whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={`${item.text}-${i}`}
            className={`font-[family-name:var(--font-ibm-plex-mono)] text-[13px] tracking-[0.02em] ${
              item.tone === "up"
                ? "text-accent-500"
                : item.tone === "down"
                  ? "text-on-inverse-subtle"
                  : ""
            }`}
          >
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
