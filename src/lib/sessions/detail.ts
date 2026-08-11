import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getFriendshipStatusMap } from "@/lib/friends";
import { isLocaleCode } from "@/lib/i18n/locales";
import type { FriendshipStatus, Session, SessionParticipant } from "@/lib/types";

export const SESSION_UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function mapSessionRpcError(message: string) {
  if (message.includes("not_authenticated")) {
    return { error: "Sign in to join this session.", status: 401 as const };
  }
  if (message.includes("session_not_found")) {
    return { error: "Session not found.", status: 404 as const };
  }
  if (message.includes("session_started")) {
    return {
      error: "This session has already started.",
      status: 409 as const,
    };
  }
  if (message.includes("session_full")) {
    return { error: "This session is full.", status: 409 as const };
  }
  return { error: message, status: 500 as const };
}

/** Mask all but the last 4 characters with * (for non-participants). */
export function maskParticipantLabel(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const visible = trimmed.slice(-4);
  const hidden = Math.max(trimmed.length - 4, 0);
  return `${"*".repeat(hidden)}${visible}`;
}

export async function loadSessionDetail(
  sessionId: string,
  viewerId?: string | null,
  options?: { revealParticipants?: boolean },
) {
  const supabase = createServiceClient() ?? (await createClient());
  if (!supabase) {
    return { error: "Supabase is not configured", status: 503 as const };
  }

  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select(
      "id, game_id, creator_id, title, starts_at, capacity, registered_count, created_at, locale, game:games(title, slug, platform), creator:profiles!creator_id(username)",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return { error: sessionError.message, status: 500 as const };
  }
  if (!sessionRow) {
    return { error: "Session not found.", status: 404 as const };
  }

  const { data: rsvpRows, error: rsvpError } = await supabase
    .from("session_rsvps")
    .select(
      "user_id, created_at, profile:profiles!user_id(id, username, display_name, avatar_url)",
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (rsvpError) {
    return { error: rsvpError.message, status: 500 as const };
  }

  const locale = isLocaleCode(sessionRow.locale) ? sessionRow.locale : "en";
  const gameRaw = sessionRow.game as
    | { title: string; slug: string; platform: string }
    | { title: string; slug: string; platform: string }[]
    | null;
  const game = Array.isArray(gameRaw) ? (gameRaw[0] ?? null) : gameRaw;
  const creatorRaw = sessionRow.creator as
    | { username: string | null }
    | { username: string | null }[]
    | null;
  const creator = Array.isArray(creatorRaw)
    ? (creatorRaw[0] ?? null)
    : creatorRaw;

  const session: Session = {
    id: sessionRow.id,
    game_id: sessionRow.game_id,
    creator_id: sessionRow.creator_id,
    title: sessionRow.title,
    starts_at: sessionRow.starts_at,
    capacity: sessionRow.capacity,
    registered_count: sessionRow.registered_count,
    created_at: sessionRow.created_at,
    locale,
    game,
    creator,
  };

  const isHolodori = game?.slug === "holodori";
  const participantIds = (rsvpRows ?? [])
    .map((row) => row.user_id as string)
    .filter(Boolean);

  const holodoriGameIdByUser = new Map<string, string | null>();
  if (isHolodori && participantIds.length) {
    const { data: gameProfiles } = await supabase
      .from("game_profiles")
      .select("user_id, holodori_game_id")
      .eq("platform", "holodori")
      .in("user_id", participantIds);
    for (const row of gameProfiles ?? []) {
      holodoriGameIdByUser.set(
        row.user_id as string,
        (row.holodori_game_id as string | null) ?? null,
      );
    }
  }

  const participants: SessionParticipant[] = (rsvpRows ?? []).flatMap((row) => {
    const profileRaw = row.profile as
      | {
          id: string;
          username: string | null;
          display_name?: string | null;
          avatar_url: string | null;
        }
      | {
          id: string;
          username: string | null;
          display_name?: string | null;
          avatar_url: string | null;
        }[]
      | null;
    const profile = Array.isArray(profileRaw)
      ? (profileRaw[0] ?? null)
      : profileRaw;
    if (!profile) return [];
    return [
      {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name ?? null,
        avatar_url: profile.avatar_url,
        holodori_game_id: isHolodori
          ? (holodoriGameIdByUser.get(profile.id) ?? null)
          : null,
      },
    ];
  });

  const viewerJoined = Boolean(
    viewerId && participants.some((person) => person.id === viewerId),
  );
  const canSeeParticipants =
    viewerJoined ||
    Boolean(viewerId && viewerId === session.creator_id) ||
    Boolean(options?.revealParticipants);

  let statusByUser = new Map<string, FriendshipStatus>();
  if (viewerId && canSeeParticipants && participantIds.length) {
    try {
      statusByUser = await getFriendshipStatusMap(
        supabase,
        viewerId,
        participantIds,
      );
    } catch {
      statusByUser = new Map();
    }
  }

  const withFriendFlags = participants.map((person) => {
    const status = statusByUser.get(person.id) ?? "none";
    return {
      ...person,
      friendship_status: status,
      is_friend: status === "friends",
    };
  });

  return {
    session,
    participants: canSeeParticipants
      ? withFriendFlags
      : withFriendFlags.map((person) => ({
          id: person.id,
          username: maskParticipantLabel(person.username),
          display_name: maskParticipantLabel(
            person.display_name || person.username,
          ),
          avatar_url: null,
          holodori_game_id: maskParticipantLabel(person.holodori_game_id),
          friendship_status: "none" as const,
          is_friend: false,
        })),
    viewer_joined: viewerJoined,
  };
}
