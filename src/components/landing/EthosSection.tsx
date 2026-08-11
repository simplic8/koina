"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

const ETHOS_KEYS = [
  { title: "ethos.e1Title", body: "ethos.e1Body", verse: "ethos.e1Verse" },
  { title: "ethos.e2Title", body: "ethos.e2Body", verse: "ethos.e2Verse" },
  { title: "ethos.e3Title", body: "ethos.e3Body", verse: "ethos.e3Verse" },
  { title: "ethos.e4Title", body: "ethos.e4Body", verse: "ethos.e4Verse" },
  { title: "ethos.e5Title", body: "ethos.e5Body", verse: "ethos.e5Verse" },
] as const;

export function EthosSection() {
  const { t } = useLocale();

  return (
    <section id="ethos" className="bg-[#1c1c1f] py-20 text-white">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-10 grid gap-5 md:grid-cols-[0.85fr_1.15fr] md:items-end">
          <div>
            <p className="mb-3 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-500 uppercase">
              {t("ethos.eyebrow")}
            </p>
            <h2 className="max-w-[16ch] text-[clamp(30px,4vw,48px)] leading-[1.08]">
              {t("ethos.title")}
            </h2>
            <p className="mt-3 font-[family-name:var(--font-ibm-plex-mono)] text-sm tracking-[0.04em] text-[#9a9a9c]">
              {t("ethos.subtitle")}
            </p>
          </div>
          <p className="max-w-[58ch] text-[16px] leading-7 text-[#b8b8bc] md:justify-self-end">
            {t("ethos.lead")}
          </p>
        </div>

        <ol className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {ETHOS_KEYS.map((item, index) => (
            <li
              key={item.title}
              className={`rounded-[8px] border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-accent-500/60 hover:bg-white/[0.07] ${
                index === ETHOS_KEYS.length - 1 ? "md:col-span-2" : ""
              }`}
            >
              <span className="font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold text-accent-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 mb-2 text-lg text-white">{t(item.title)}</h3>
              <p className="m-0 text-sm leading-6 text-[#b8b8bc]">{t(item.body)}</p>
              <p className="mt-3 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.04em] text-[#7a7a7c]">
                {t(item.verse)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
