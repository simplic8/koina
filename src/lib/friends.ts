import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import type {
  FriendPerson,
  FriendshipStatus,
  FriendSessionSummary,
} from "@/lib/types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isFriendUserId(value: string) {
  return UUID_PATTERN.test(value);
}

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function unwrapProfile(
  raw: ProfileRow | ProfileRow[] | null | undefined,
): ProfileRow | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

function toFriendPerson(
  profile: ProfileRow,
  status: FriendshipStatus,
  lastPlayedAt: string | null = null,
  holodoriGameId: string | null = null,
): FriendPerson {
  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    friendship_status: status,
    is_friend: status === "friends",
    last_played_at: lastPlayedAt,
    holodori_game_id: holodoriGameId,
  };
}

type NotificationType =
  | "friend_request"
  | "friend_request_accepted"
  | "friend_request_declined"
  | "friend_accepted"
  | "message";

async function createNotification(
  userId: string,
  payload: {
    actorId: string;
    type: NotificationType;
    friendshipId?: string | null;
    messageId?: string | null;
    body?: string | null;
  },
) {
  const service = createServiceClient();
  if (!service) return;
  await service.from("notifications").insert({
    user_id: userId,
    actor_id: payload.actorId,
    type: payload.type,
    friendship_id: payload.friendshipId ?? null,
    message_id: payload.messageId ?? null,
    body: payload.body ?? null,
  });
}

/** Mark the addressee's pending friend-request notification as accepted/declined. */
async function resolveFriendRequestNotification(
  supabase: SupabaseClient,
  payload: {
    userId: string;
    actorId: string;
    friendshipId: string;
    outcome: "accepted" | "declined";
  },
) {
  const client = createServiceClient() ?? supabase;

  const type =
    payload.outcome === "accepted"
      ? "friend_request_accepted"
      : "friend_request_declined";

  await client
    .from("notifications")
    .update({
      type,
      read_at: new Date().toISOString(),
      friendship_id:
        payload.outcome === "declined" ? null : payload.friendshipId,
    })
    .eq("user_id", payload.userId)
    .eq("type", "friend_request")
    .or(
      `friendship_id.eq.${payload.friendshipId},actor_id.eq.${payload.actorId}`,
    );
}

export async function getFriendshipStatusMap(
  supabase: SupabaseClient,
  userId: string,
  otherIds: string[],
): Promise<Map<string, FriendshipStatus>> {
  const map = new Map<string, FriendshipStatus>();
  for (const id of otherIds) map.set(id, "none");
  if (!otherIds.length) return map;

  const wanted = new Set(otherIds);
  const { data, error } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id, status")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const other =
      row.requester_id === userId
        ? (row.addressee_id as string)
        : (row.requester_id as string);
    if (!wanted.has(other)) continue;
    if (row.status === "accepted") {
      map.set(other, "friends");
    } else if (row.requester_id === userId) {
      map.set(other, "outgoing");
    } else {
      map.set(other, "incoming");
    }
  }
  return map;
}

export async function listFriendIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    row.requester_id === userId
      ? (row.addressee_id as string)
      : (row.requester_id as string),
  );
}

export async function areFriends(
  supabase: SupabaseClient,
  userId: string,
  otherId: string,
) {
  const map = await getFriendshipStatusMap(supabase, userId, [otherId]);
  return map.get(otherId) === "friends";
}

export async function listFriends(
  supabase: SupabaseClient,
  userId: string,
): Promise<FriendPerson[]> {
  const { data: rows, error } = await supabase
    .from("friendships")
    .select(
      "requester_id, addressee_id, updated_at, requester:profiles!requester_id(id, username, display_name, avatar_url), addressee:profiles!addressee_id(id, username, display_name, avatar_url)",
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (rows ?? []).flatMap((row) => {
    const otherProfile =
      row.requester_id === userId
        ? unwrapProfile(row.addressee as ProfileRow | ProfileRow[] | null)
        : unwrapProfile(row.requester as ProfileRow | ProfileRow[] | null);
    if (!otherProfile) return [];
    return [toFriendPerson(otherProfile, "friends")];
  });
}

export async function requestFriend(
  supabase: SupabaseClient,
  userId: string,
  friendId: string,
) {
  if (userId === friendId) {
    return { error: "You can’t add yourself as a friend.", status: 400 as const };
  }
  if (!isFriendUserId(friendId)) {
    return { error: "Invalid user id.", status: 400 as const };
  }

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("id", friendId)
    .maybeSingle();

  if (targetError) {
    return { error: targetError.message, status: 500 as const };
  }
  if (!target || target.status !== "active") {
    return { error: "User not found.", status: 404 as const };
  }

  const existing = await getFriendshipStatusMap(supabase, userId, [friendId]);
  const status = existing.get(friendId) ?? "none";
  if (status === "friends") {
    return { error: "Already friends.", status: 409 as const };
  }
  if (status === "outgoing") {
    return { error: "Friend request already sent.", status: 409 as const };
  }
  if (status === "incoming") {
    return acceptFriend(supabase, userId, friendId);
  }

  const { data, error } = await supabase
    .from("friendships")
    .insert({
      requester_id: userId,
      addressee_id: friendId,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message, status: 500 as const };
  }

  await createNotification(friendId, {
    actorId: userId,
    type: "friend_request",
    friendshipId: data?.id ?? null,
  });

  return { ok: true as const, friendshipStatus: "outgoing" as const };
}

export async function acceptFriend(
  supabase: SupabaseClient,
  userId: string,
  otherId: string,
) {
  if (!isFriendUserId(otherId)) {
    return { error: "Invalid user id.", status: 400 as const };
  }

  const { data: row, error: findError } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .eq("status", "pending")
    .eq("requester_id", otherId)
    .eq("addressee_id", userId)
    .maybeSingle();

  if (findError) {
    return { error: findError.message, status: 500 as const };
  }
  if (!row) {
    return { error: "No pending friend request.", status: 404 as const };
  }

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", row.id);

  if (error) {
    return { error: error.message, status: 500 as const };
  }

  await resolveFriendRequestNotification(supabase, {
    userId,
    actorId: otherId,
    friendshipId: row.id,
    outcome: "accepted",
  });

  await createNotification(otherId, {
    actorId: userId,
    type: "friend_accepted",
    friendshipId: row.id,
  });

  return { ok: true as const, friendshipStatus: "friends" as const };
}

export async function declineOrCancelFriend(
  supabase: SupabaseClient,
  userId: string,
  otherId: string,
) {
  if (!isFriendUserId(otherId)) {
    return { error: "Invalid user id.", status: 400 as const };
  }

  const { data: rows, error: findError } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`,
    );

  if (findError) {
    return { error: findError.message, status: 500 as const };
  }

  const row = rows?.[0];
  if (!row) {
    return { error: "Friendship not found.", status: 404 as const };
  }

  const isDecline =
    row.status === "pending" && row.addressee_id === userId;

  if (isDecline) {
    await resolveFriendRequestNotification(supabase, {
      userId,
      actorId: otherId,
      friendshipId: row.id,
      outcome: "declined",
    });
  }

  const { error } = await supabase.from("friendships").delete().eq("id", row.id);
  if (error) {
    return { error: error.message, status: 500 as const };
  }
  return { ok: true as const };
}

/** @deprecated use requestFriend */
export async function addFriend(
  supabase: SupabaseClient,
  userId: string,
  friendId: string,
) {
  return requestFriend(supabase, userId, friendId);
}

/** Remove accepted friendship or cancel/decline pending. */
export async function removeFriend(
  supabase: SupabaseClient,
  userId: string,
  friendId: string,
) {
  return declineOrCancelFriend(supabase, userId, friendId);
}

type CoPlayRow = {
  otherId: string;
  playedAt: string;
};

/** Last N distinct people the viewer shared a session with (most recent first). */
export async function listRecentlyPlayedWith(
  supabase: SupabaseClient,
  userId: string,
  limit = 10,
  options?: { gameSlug?: string },
): Promise<FriendPerson[]> {
  const { data: myRsvps, error: myError } = await supabase
    .from("session_rsvps")
    .select(
      "session_id, session:sessions!session_id(id, starts_at, title, game:games(slug))",
    )
    .eq("user_id", userId);

  if (myError) throw new Error(myError.message);

  const sessionMeta = new Map<string, { starts_at: string; title: string }>();
  for (const row of myRsvps ?? []) {
    const sessionRaw = row.session as
      | {
          id: string;
          starts_at: string;
          title: string;
          game: { slug: string } | { slug: string }[] | null;
        }
      | {
          id: string;
          starts_at: string;
          title: string;
          game: { slug: string } | { slug: string }[] | null;
        }[]
      | null;
    const session = Array.isArray(sessionRaw)
      ? (sessionRaw[0] ?? null)
      : sessionRaw;
    if (!session) continue;
    if (options?.gameSlug) {
      const gameRaw = session.game;
      const game = Array.isArray(gameRaw) ? (gameRaw[0] ?? null) : gameRaw;
      if (game?.slug !== options.gameSlug) continue;
    }
    sessionMeta.set(session.id, {
      starts_at: session.starts_at,
      title: session.title,
    });
  }

  const sessionIds = Array.from(sessionMeta.keys());
  if (!sessionIds.length) return [];

  const { data: peerRsvps, error: peerError } = await supabase
    .from("session_rsvps")
    .select("session_id, user_id")
    .in("session_id", sessionIds)
    .neq("user_id", userId);

  if (peerError) throw new Error(peerError.message);

  const coPlays: CoPlayRow[] = [];
  for (const row of peerRsvps ?? []) {
    const meta = sessionMeta.get(row.session_id as string);
    if (!meta) continue;
    coPlays.push({
      otherId: row.user_id as string,
      playedAt: meta.starts_at,
    });
  }

  coPlays.sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
  );

  const seen = new Set<string>();
  const orderedIds: string[] = [];
  const lastPlayed = new Map<string, string>();
  for (const row of coPlays) {
    if (seen.has(row.otherId)) continue;
    seen.add(row.otherId);
    orderedIds.push(row.otherId);
    lastPlayed.set(row.otherId, row.playedAt);
    if (orderedIds.length >= limit) break;
  }

  if (!orderedIds.length) return [];

  const statusMap = await getFriendshipStatusMap(supabase, userId, orderedIds);

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", orderedIds);

  if (profileError) throw new Error(profileError.message);

  const holodoriGameIdByUser = new Map<string, string | null>();
  if (options?.gameSlug === "holodori") {
    const reader = createServiceClient() ?? supabase;
    const { data: gameProfiles } = await reader
      .from("game_profiles")
      .select("user_id, holodori_game_id")
      .eq("platform", "holodori")
      .in("user_id", orderedIds);
    for (const row of gameProfiles ?? []) {
      holodoriGameIdByUser.set(
        row.user_id as string,
        (row.holodori_game_id as string | null) ?? null,
      );
    }
  }

  const byId = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile as ProfileRow]),
  );

  return orderedIds.flatMap((id) => {
    const profile = byId.get(id);
    if (!profile) return [];
    return [
      toFriendPerson(
        profile,
        statusMap.get(id) ?? "none",
        lastPlayed.get(id) ?? null,
        options?.gameSlug === "holodori"
          ? (holodoriGameIdByUser.get(id) ?? null)
          : null,
      ),
    ];
  });
}

/** Sessions the viewer joined, newest first, with co-participants + friend flags. */
export async function listParticipatedSessions(
  supabase: SupabaseClient,
  userId: string,
  limit = 20,
): Promise<FriendSessionSummary[]> {
  const { data: myRsvps, error: myError } = await supabase
    .from("session_rsvps")
    .select(
      "session_id, created_at, session:sessions!session_id(id, title, starts_at, capacity, registered_count, game:games(title, slug, platform))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (myError) throw new Error(myError.message);

  type SessionEmbed = {
    id: string;
    title: string;
    starts_at: string;
    capacity: number;
    registered_count: number;
    game:
      | { title: string; slug: string; platform: string }
      | { title: string; slug: string; platform: string }[]
      | null;
  };

  const sessions: SessionEmbed[] = [];
  for (const row of myRsvps ?? []) {
    const sessionRaw = row.session as SessionEmbed | SessionEmbed[] | null;
    const session = Array.isArray(sessionRaw)
      ? (sessionRaw[0] ?? null)
      : sessionRaw;
    if (session) sessions.push(session);
  }

  sessions.sort(
    (a, b) =>
      new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
  );

  if (!sessions.length) return [];

  const sessionIds = sessions.map((session) => session.id);
  const { data: allRsvps, error: rsvpError } = await supabase
    .from("session_rsvps")
    .select(
      "session_id, user_id, profile:profiles!user_id(id, username, display_name, avatar_url)",
    )
    .in("session_id", sessionIds);

  if (rsvpError) throw new Error(rsvpError.message);

  const allOtherIds = Array.from(
    new Set(
      (allRsvps ?? [])
        .map((row) => row.user_id as string)
        .filter((id) => id !== userId),
    ),
  );
  const statusMap = await getFriendshipStatusMap(supabase, userId, allOtherIds);

  const participantsBySession = new Map<string, FriendPerson[]>();
  for (const row of allRsvps ?? []) {
    const profile = unwrapProfile(
      row.profile as ProfileRow | ProfileRow[] | null,
    );
    if (!profile) continue;
    const list = participantsBySession.get(row.session_id as string) ?? [];
    list.push(
      toFriendPerson(
        profile,
        profile.id === userId
          ? "friends"
          : (statusMap.get(profile.id) ?? "none"),
      ),
    );
    participantsBySession.set(row.session_id as string, list);
  }

  return sessions.map((session) => {
    const gameRaw = session.game;
    const game = Array.isArray(gameRaw) ? (gameRaw[0] ?? null) : gameRaw;
    return {
      id: session.id,
      title: session.title,
      starts_at: session.starts_at,
      capacity: session.capacity,
      registered_count: session.registered_count,
      game,
      participants: participantsBySession.get(session.id) ?? [],
    };
  });
}
