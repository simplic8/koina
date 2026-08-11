/**
 * Discord profile badges derived from public_flags (+ optional clan/server tag).
 * Icon hashes match Discord CDN badge-icons (community-maintained mapping).
 */

export type DiscordChatBadge = {
  id: string;
  label: string;
  iconUrl: string;
  /** Server tag text when this is a clan/server badge. */
  tag?: string;
};

type FlagBadge = {
  flag: number;
  id: string;
  label: string;
  icon: string;
};

const FLAG_BADGES: FlagBadge[] = [
  {
    flag: 1 << 0,
    id: "staff",
    label: "Discord Staff",
    icon: "5e74e9b61934fc1f67c65515d1f7e60d",
  },
  {
    flag: 1 << 1,
    id: "partner",
    label: "Partnered Server Owner",
    icon: "3f9748e53446a137a052f3454e2de41e",
  },
  {
    flag: 1 << 2,
    id: "hypesquad",
    label: "HypeSquad Events",
    icon: "bf01d1073931f921909045f3a39fd264",
  },
  {
    flag: 1 << 3,
    id: "bug_hunter_level_1",
    label: "Discord Bug Hunter",
    icon: "2717692c7dca7289b35297368a940dd0",
  },
  {
    flag: 1 << 6,
    id: "hypesquad_house_1",
    label: "HypeSquad Bravery",
    icon: "8a88d63823d8a71cd5e390baa45efa02",
  },
  {
    flag: 1 << 7,
    id: "hypesquad_house_2",
    label: "HypeSquad Brilliance",
    icon: "011940fd013da3f7fb926e4a1cd2e618",
  },
  {
    flag: 1 << 8,
    id: "hypesquad_house_3",
    label: "HypeSquad Balance",
    icon: "3aa41de486fa12454c3761e8e223442e",
  },
  {
    flag: 1 << 9,
    id: "early_supporter",
    label: "Early Supporter",
    icon: "7060786766c9c840eb3019e725d2b358",
  },
  {
    flag: 1 << 14,
    id: "bug_hunter_level_2",
    label: "Discord Bug Hunter",
    icon: "848f79194d4be5ff5f81505cbd0ce1e6",
  },
  {
    flag: 1 << 17,
    id: "verified_developer",
    label: "Early Verified Bot Developer",
    icon: "6df5892e0f35b051f8b61eace34f4967",
  },
  {
    flag: 1 << 18,
    id: "certified_moderator",
    label: "Moderator Programs Alumni",
    icon: "fee1624003e2fee35cb398e125dc479b",
  },
  {
    flag: 1 << 22,
    id: "active_developer",
    label: "Active Developer",
    icon: "6bdc42827a38498929a4920da12695d9",
  },
];

function badgeIconUrl(icon: string) {
  return `https://cdn.discordapp.com/badge-icons/${icon}.png`;
}

export function discordBadgesFromFlags(
  publicFlags: number | null | undefined,
): DiscordChatBadge[] {
  if (!publicFlags) return [];
  return FLAG_BADGES.filter((b) => (publicFlags & b.flag) === b.flag).map(
    (b) => ({
      id: b.id,
      label: b.label,
      iconUrl: badgeIconUrl(b.icon),
    }),
  );
}

export type DiscordPrimaryGuild = {
  identity_guild_id?: string | null;
  identity_enabled?: boolean | null;
  tag?: string | null;
  badge?: string | null;
};

export function discordClanBadge(
  primaryGuild: DiscordPrimaryGuild | null | undefined,
): DiscordChatBadge | null {
  if (
    !primaryGuild?.identity_enabled ||
    !primaryGuild.identity_guild_id ||
    !primaryGuild.badge
  ) {
    return null;
  }
  const tag = primaryGuild.tag?.trim() || undefined;
  return {
    id: "clan",
    label: tag ? `Server tag: ${tag}` : "Server tag",
    iconUrl: `https://cdn.discordapp.com/clan-badges/${primaryGuild.identity_guild_id}/${primaryGuild.badge}.png?size=16`,
    tag,
  };
}

export function discordProfileBadges(user: {
  public_flags?: number | null;
  primary_guild?: DiscordPrimaryGuild | null;
}): DiscordChatBadge[] {
  const badges = discordBadgesFromFlags(user.public_flags);
  const clan = discordClanBadge(user.primary_guild);
  if (clan) badges.push(clan);
  return badges;
}
