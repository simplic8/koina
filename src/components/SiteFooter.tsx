"use client";

import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { useLocale } from "./i18n/LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="bg-inverse px-0 pt-[52px] pb-[26px] text-on-inverse">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-[family-name:var(--font-space-grotesk)] text-[19px] font-bold text-on-inverse no-underline"
            >
              <BrandMark light withGems className="h-[28px] w-[28px]" />
              KOINA
            </Link>
            <p className="mt-2.5 max-w-[32ch] text-[13.5px] text-on-inverse-subtle">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.08em] text-on-inverse-subtle uppercase">
              {t("footer.explore")}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <li>
                <Link
                  href="/#spaces"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  {t("nav.spaces")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#ethos"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  {t("nav.ethos")}
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  {t("nav.about")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.08em] text-on-inverse-subtle uppercase">
              {t("footer.community")}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <li>
                <a
                  href="#"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  {t("footer.discord")}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.08em] text-on-inverse-subtle uppercase">
              {t("footer.ecosystem")}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <li>
                <a
                  href="https://justvibing.fun"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  JustVibing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  Oshikatsu
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  NUMA
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.08em] text-on-inverse-subtle uppercase">
              {t("footer.legal")}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <li>
                <a
                  href="#"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-[13.5px] text-on-inverse-muted no-underline hover:text-on-inverse"
                >
                  {t("footer.privacy")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="border-t border-on-inverse-border pt-5 text-[12px] italic text-on-inverse-faint">
          {t("footer.inspired")}
        </p>
      </div>
    </footer>
  );
}
