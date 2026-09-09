"use client";

import { useState } from "react";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { FriendsProfile } from "@/components/profile/FriendsProfile";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Profile } from "@/lib/types";

type Section = "general" | "friends";

function parseSection(value?: string | null): Section {
  return value === "friends" ? "friends" : "general";
}

type Props = {
  profile: Profile;
  email: string | null;
  hasEmailIdentity: boolean;
  hasGoogleIdentity: boolean;
  hasDiscordIdentity: boolean;
  identityCount: number;
  initialSection?: string | null;
};

export function ProfilePageContent({
  profile,
  email,
  hasEmailIdentity,
  hasGoogleIdentity,
  hasDiscordIdentity,
  identityCount,
  initialSection = null,
}: Props) {
  const { t } = useLocale();
  const [section, setSection] = useState<Section>(() =>
    parseSection(initialSection),
  );

  const tabs: Array<{ id: Section; label: string }> = [
    { id: "general", label: t("profile.section.general") },
    { id: "friends", label: t("profile.section.friends") },
  ];

  return (
    <div>
      <div
        className="mb-8 flex flex-wrap gap-2 border-b border-ink-08 pb-3"
        role="tablist"
        aria-label={t("profile.sections")}
      >
        {tabs.map((tab) => {
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSection(tab.id)}
              className={`cursor-pointer rounded-[6px] border px-3.5 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "border-ink bg-btn-dark !text-btn-dark-fg"
                  : "border-ink-15 bg-surface text-ink hover:border-accent-500 hover:text-accent-500"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {section === "general" ? (
          <ProfileSettings
            profile={profile}
            email={email}
            hasEmailIdentity={hasEmailIdentity}
            hasGoogleIdentity={hasGoogleIdentity}
            hasDiscordIdentity={hasDiscordIdentity}
            identityCount={identityCount}
          />
        ) : null}
        {section === "friends" ? (
          <FriendsProfile viewerId={profile.id} />
        ) : null}
      </div>
    </div>
  );
}
