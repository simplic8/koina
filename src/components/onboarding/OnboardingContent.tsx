"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function OnboardingContent({ name }: { name: string }) {
  const { t } = useLocale();

  return (
    <section className="py-16">
      <div className="mx-auto max-w-lg px-6">
        <p className="mb-3 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
          {t("onboarding.eyebrow")}
        </p>
        <h1 className="mb-3 text-3xl">
          {t("onboarding.welcome", { name })}
        </h1>
        <p className="mb-8 text-[17px] leading-7 text-ink-70">
          {t("onboarding.lead")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/profile">{t("onboarding.setupProfile")}</Button>
          <Button href="/sessions" variant="outline">
            {t("onboarding.browseSessions")}
          </Button>
          <Button href="/" variant="dark">
            {t("onboarding.goHome")}
          </Button>
        </div>
        <p className="mt-8 text-sm text-ink-40">
          {t("onboarding.updateLater")}{" "}
          <Link href="/profile" className="font-semibold text-accent-600">
            {t("onboarding.openSettings")}
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
