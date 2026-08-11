import type { BotProfile } from "./supabase";
import { getBotSupabase } from "./supabase";

export type BotGame = {
  id: string;
  title: string;
  slug: string;
  platform: string;
};

export type BotSession = {
  id: string;
  title: string;
  starts_at: string;
  capacity: number;
  registered_count: number;
  locale: string | null;
  game: { title: string; slug: string; platform: string } | null;
  creator: { username: string | null } | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOCALES = new Set([
  "en",
  "ja",
  "ko",
  "fil",
  "ms",
  "id",
  "zh-CN",
  "zh-TW",
]);

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listPublishedGames(limit = 25): Promise<BotGame[]> {
  const supabase = getBotSupabase();
  const { data, error } = await supabase
    .from("games")
    .select("id, title, slug, platform")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as BotGame[];
}

export async function listUpcomingSessions(options?: {
  gameId?: string | null;
  limit?: number;
}): Promise<BotSession[]> {
  const supabase = getBotSupabase();
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 25);

  let query = supabase
    .from("sessions")
    .select(
      "id, title, starts_at, capacity, registered_count, locale, game:games!inner(title, slug, platform, is_published), creator:profiles!creator_id(username)",
    )
    .gte("starts_at", new Date().toISOString())
    .eq("game.is_published", true)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (options?.gameId) {
    query = query.eq("game_id", options.gameId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const game = unwrapOne(
      row.game as
        | { title: string; slug: string; platform: string }
        | { title: string; slug: string; platform: string }[]
        | null,
    );
    const creator = unwrapOne(
      row.creator as
        | { username: string | null }
        | { username: string | null }[]
        | null,
    );
    return {
      id: row.id as string,
      title: row.title as string,
      starts_at: row.starts_at as string,
      capacity: Number(row.capacity),
      registered_count: Number(row.registered_count),
      locale: (row.locale as string | null) ?? null,
      game,
      creator,
    };
  });
}

export async function getSessionById(sessionId: string): Promise<BotSession | null> {
  if (!UUID_PATTERN.test(sessionId)) return null;
  const supabase = getBotSupabase();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, title, starts_at, capacity, registered_count, locale, game:games(title, slug, platform), creator:profiles!creator_id(username)",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    id: data.id as string,
    title: data.title as string,
    starts_at: data.starts_at as string,
    capacity: Number(data.capacity),
    registered_count: Number(data.registered_count),
    locale: (data.locale as string | null) ?? null,
    game: unwrapOne(
      data.game as
        | { title: string; slug: string; platform: string }
        | { title: string; slug: string; platform: string }[]
        | null,
    ),
    creator: unwrapOne(
      data.creator as
        | { username: string | null }
        | { username: string | null }[]
        | null,
    ),
  };
}

export async function viewerJoined(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const supabase = getBotSupabase();
  const { data, error } = await supabase
    .from("session_rsvps")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export type CreateSessionInput = {
  gameId: string;
  title: string;
  startsAtRaw: string;
  capacityRaw: string;
  locale: string;
  creator: BotProfile;
};

export type CreateSessionResult =
  | { ok: true; session: BotSession }
  | { ok: false; message: string };

function parseStartsAt(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Prefer ISO / Date-parseable strings first.
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  // Accept "YYYY-MM-DD HH:mm" or "YYYY-MM-DD HH:mm:ss" as local-ish UTC parse.
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const iso = `${y}-${mo}-${d}T${h.padStart(2, "0")}:${mi}:${(s ?? "00").padStart(2, "0")}:00.000Z`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createSession(
  input: CreateSessionInput,
): Promise<CreateSessionResult> {
  const title = input.title.trim();
  const locale = LOCALES.has(input.locale) ? input.locale : null;
  const capacity = Number(input.capacityRaw);
  const startsAt = parseStartsAt(input.startsAtRaw);

  if (!UUID_PATTERN.test(input.gameId)) {
    return { ok: false, message: "Choose a valid game." };
  }
  if (!title || title.length > 120) {
    return { ok: false, message: "Title must be between 1 and 120 characters." };
  }
  if (!locale) {
    return { ok: false, message: "Choose a valid title language." };
  }
  if (!startsAt || startsAt.getTime() <= Date.now()) {
    return {
      ok: false,
      message:
        "Start time must be in the future. Use ISO or `YYYY-MM-DD HH:mm` (UTC).",
    };
  }
  if (!Number.isInteger(capacity) || capacity < 2 || capacity > 500) {
    return {
      ok: false,
      message: "Capacity must be a whole number between 2 and 500.",
    };
  }

  const supabase = getBotSupabase();
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, title, slug, platform")
    .eq("id", input.gameId)
    .eq("is_published", true)
    .maybeSingle();

  if (gameError) return { ok: false, message: gameError.message };
  if (!game) {
    return { ok: false, message: "The selected published game was not found." };
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      game_id: input.gameId,
      title,
      starts_at: startsAt.toISOString(),
      capacity,
      registered_count: 1,
      creator_id: input.creator.id,
      locale,
    })
    .select(
      "id, title, starts_at, capacity, registered_count, locale, game:games(title, slug, platform), creator:profiles!creator_id(username)",
    )
    .single();

  if (error) return { ok: false, message: error.message };

  const { error: rsvpError } = await supabase.from("session_rsvps").insert({
    session_id: data.id,
    user_id: input.creator.id,
  });

  let registeredCount = Number(data.registered_count);
  if (rsvpError) {
    await supabase
      .from("sessions")
      .update({ registered_count: 0 })
      .eq("id", data.id);
    registeredCount = 0;
  }

  return {
    ok: true,
    session: {
      id: data.id as string,
      title: data.title as string,
      starts_at: data.starts_at as string,
      capacity: Number(data.capacity),
      registered_count: registeredCount,
      locale: (data.locale as string | null) ?? null,
      game: unwrapOne(
        data.game as
          | { title: string; slug: string; platform: string }
          | { title: string; slug: string; platform: string }[]
          | null,
      ),
      creator: unwrapOne(
        data.creator as
          | { username: string | null }
          | { username: string | null }[]
          | null,
      ),
    },
  };
}

export type RsvpResult =
  | {
      ok: true;
      joined: boolean;
      registered_count: number;
      capacity: number;
      session: BotSession;
    }
  | { ok: false; message: string };

/** Service-role join that mirrors join_session RPC rules. */
export async function joinSessionAsUser(
  sessionId: string,
  userId: string,
): Promise<RsvpResult> {
  const supabase = getBotSupabase();
  const session = await getSessionById(sessionId);
  if (!session) return { ok: false, message: "Session not found." };

  if (new Date(session.starts_at).getTime() <= Date.now()) {
    return { ok: false, message: "This session has already started." };
  }

  const already = await viewerJoined(sessionId, userId);
  if (already) {
    return {
      ok: true,
      joined: true,
      registered_count: session.registered_count,
      capacity: session.capacity,
      session,
    };
  }

  if (session.registered_count >= session.capacity) {
    return { ok: false, message: "This session is full." };
  }

  const { error: insertError } = await supabase.from("session_rsvps").insert({
    session_id: sessionId,
    user_id: userId,
  });
  if (insertError) return { ok: false, message: insertError.message };

  const nextCount = session.registered_count + 1;
  const { error: updateError } = await supabase
    .from("sessions")
    .update({ registered_count: nextCount })
    .eq("id", sessionId);
  if (updateError) return { ok: false, message: updateError.message };

  const refreshed = (await getSessionById(sessionId)) ?? {
    ...session,
    registered_count: nextCount,
  };

  return {
    ok: true,
    joined: true,
    registered_count: refreshed.registered_count,
    capacity: refreshed.capacity,
    session: refreshed,
  };
}

/** Service-role leave that mirrors leave_session RPC rules. */
export async function leaveSessionAsUser(
  sessionId: string,
  userId: string,
): Promise<RsvpResult> {
  const supabase = getBotSupabase();
  const session = await getSessionById(sessionId);
  if (!session) return { ok: false, message: "Session not found." };

  const { data: deleted, error: deleteError } = await supabase
    .from("session_rsvps")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .select("id");

  if (deleteError) return { ok: false, message: deleteError.message };

  let nextCount = session.registered_count;
  if (deleted && deleted.length > 0) {
    nextCount = Math.max(session.registered_count - 1, 0);
    const { error: updateError } = await supabase
      .from("sessions")
      .update({ registered_count: nextCount })
      .eq("id", sessionId);
    if (updateError) return { ok: false, message: updateError.message };
  }

  const refreshed = (await getSessionById(sessionId)) ?? {
    ...session,
    registered_count: nextCount,
  };

  return {
    ok: true,
    joined: false,
    registered_count: refreshed.registered_count,
    capacity: refreshed.capacity,
    session: refreshed,
  };
}
