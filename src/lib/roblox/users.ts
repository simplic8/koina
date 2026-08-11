export type RobloxPresenceType = 0 | 1 | 2 | 3 | 4;

export type RobloxUserSnapshot = {
  userId: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  onlineStatus: string;
  presenceType: RobloxPresenceType | null;
};

const PRESENCE_LABELS: Record<number, string> = {
  0: "Offline",
  1: "Online",
  2: "In game",
  3: "In studio",
  4: "Invisible",
};

export function presenceLabel(type: number | null | undefined): string {
  if (type == null || !(type in PRESENCE_LABELS)) return "Unknown";
  return PRESENCE_LABELS[type];
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Roblox API error (${response.status})${text ? `: ${text.slice(0, 180)}` : ""}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function lookupRobloxUserByUsername(
  username: string,
): Promise<RobloxUserSnapshot> {
  const cleaned = username.trim();
  if (!cleaned) throw new Error("Enter a Roblox username.");

  const lookup = await fetchJson<{
    data?: Array<{
      id?: number;
      name?: string;
      displayName?: string;
      requestedUsername?: string;
    }>;
  }>("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    body: JSON.stringify({
      usernames: [cleaned],
      excludeBannedUsers: true,
    }),
  });

  const match = lookup.data?.[0];
  if (!match?.id) {
    throw new Error(`No Roblox user found for “${cleaned}”.`);
  }

  return fetchRobloxUserById(String(match.id));
}

export async function fetchRobloxUserById(
  userId: string,
): Promise<RobloxUserSnapshot> {
  const id = Number(userId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid Roblox user id.");
  }

  const [profile, thumbnails, presence] = await Promise.all([
    fetchJson<{
      id?: number;
      name?: string;
      displayName?: string;
      description?: string;
    }>(`https://users.roblox.com/v1/users/${id}`),
    fetchJson<{
      data?: Array<{ imageUrl?: string; state?: string }>;
    }>(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${id}&size=150x150&format=Png&isCircular=false`,
    ).catch(() => ({ data: [] })),
    fetchJson<{
      userPresences?: Array<{
        userId?: number;
        userPresenceType?: number;
      }>;
    }>("https://presence.roblox.com/v1/presence/users", {
      method: "POST",
      body: JSON.stringify({ userIds: [id] }),
    }).catch(() => ({ userPresences: [] })),
  ]);

  if (!profile.id || !profile.name) {
    throw new Error("Could not load Roblox profile.");
  }

  const presenceType =
    (presence.userPresences?.[0]?.userPresenceType as RobloxPresenceType) ??
    null;
  const avatarUrl = thumbnails.data?.[0]?.imageUrl ?? null;

  return {
    userId: String(profile.id),
    username: profile.name,
    displayName: profile.displayName || profile.name,
    bio: profile.description ?? "",
    avatarUrl,
    onlineStatus: presenceLabel(presenceType),
    presenceType,
  };
}
