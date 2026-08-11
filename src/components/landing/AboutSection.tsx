"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";

const pillarKeys = [
  { title: "about.f1Title", desc: "about.f1Desc", number: "01", gem: "#E85A32" },
  { title: "about.f2Title", desc: "about.f2Desc", number: "02", gem: "#29C194" },
  { title: "about.f3Title", desc: "about.f3Desc", number: "03", gem: "#E73C7E" },
] as const;

export function AboutSection() {
  const { t } = useLocale();

  return (
    <section id="about" className="py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-10 grid gap-5 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <p className="mb-3 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
              {t("about.eyebrow")}
            </p>
            <h2 className="max-w-[18ch] text-[clamp(30px,4vw,48px)] leading-[1.08]">
              {t("about.title")}
            </h2>
          </div>
          <p className="max-w-[58ch] text-[16px] leading-7 text-ink-70 md:justify-self-end">
            {t("about.lead")}
          </p>
        </div>

        <div className="mb-10 rounded-[8px] border border-ink-08 bg-surface p-6 md:p-8">
          <p className="m-0 text-[15px] leading-7 text-ink-70">
            <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-ink">
              κοινά
            </span>
            {" — "}
            {t("about.etymology")}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {pillarKeys.map((feature) => (
            <article
              key={feature.number}
              className="rounded-[8px] border border-ink-08 bg-base p-6 transition-colors hover:border-ink-15"
            >
              <span
                aria-hidden
                className="mb-6 inline-block h-3 w-3 rotate-45"
                style={{ background: feature.gem }}
              />
              <span className="block font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold text-accent-600">
                {feature.number}
              </span>
              <h3 className="mt-3 mb-3 text-xl">{t(feature.title)}</h3>
              <p className="m-0 text-sm leading-6 text-ink-70">{t(feature.desc)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
