"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/i18n/LocaleProvider";

const FEATURED_COMMUNITIES = [
  {
    id: "shepherd",
    href: "https://shepherd.chat/",
    image: "/communities/shepherd.png",
    titleKey: "communities.shepherdTitle" as const,
    badgeKey: "communities.shepherdBadge" as const,
    bodyKey: "communities.shepherdBody" as const,
    ctaKey: "communities.visit" as const,
  },
];

export function CommunitiesSection() {
  const { t } = useLocale();

  return (
    <section
      id="communities"
      className="border-y border-ink-08 bg-surface py-16"
    >
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[28px]">{t("communities.featured")}</h2>
        </div>

        <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_COMMUNITIES.map((community) => (
            <div
              key={community.id}
              className="group overflow-hidden rounded-[6px] border border-ink-15 bg-base transition-[border-color,box-shadow] duration-300 hover:border-accent-500 hover:shadow-[0_0_0_1px_var(--accent-500)]"
            >
              <div className="relative h-[130px] overflow-hidden bg-[#10241f]">
                <Image
                  src={community.image}
                  alt={t(community.titleKey)}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                />
              </div>
              <div className="p-[18px]">
                <Badge>{t(community.badgeKey)}</Badge>
                <div className="mt-1.5 mb-2 font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold">
                  {t(community.titleKey)}
                </div>
                <p className="mb-3.5 text-[13.5px] text-ink-70">
                  {t(community.bodyKey)}
                </p>
                <Button href={community.href} variant="outline" size="sm">
                  {t(community.ctaKey)}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
