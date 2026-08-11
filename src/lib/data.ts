import {
  SEED_CHAT,
  SEED_GAMES,
  SEED_SCORES,
  SEED_SESSIONS,
} from "@/lib/seed";
import { CHAT_VISIBLE_MESSAGE_LIMIT, SITE_CHAT_CHANNEL } from "@/lib/chat-channel";
import { DEFAULT_LOCALE, isLocaleCode } from "@/lib/i18n/locales";
import type {
  ChatMessage,
  Game,
  GameProfile,
  GameTranslation,
  HeroQuote,
  HolodoriHeroLine,
  Profile,
  Score,
  Session,
  SessionListQuery,
  SessionListResult,
  SessionPageSize,
  SessionSearchBy,
  SessionSort,
  SessionSortDir,
  SessionTitleSuggestion,
} from "@/lib/types";
import { isAdminProfile } from "@/lib/auth/is-admin";
import {
  createClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

const PAGE_SIZES: SessionPageSize[] = [6, 12, 24];

const GAME_TRANSLATIONS_SELECT =
  "translations:game_translations(locale, title, description)";

type ListSessionRow = {
  id: string;
  game_id: string;
  creator_id: string | null;
  title: string;
  starts_at: string;
  capacity: number;
  registered_count: number;
  created_at: string;
  locale?: string | null;
  game_title: string;
  game_slug: string;
  game_platform: string;
  creator_username: string | null;
  total_count: number | string;
};

function normalizeSearchBy(value?: string): SessionSearchBy {
  return value === "title" ||
    value === "creator" ||
    value === "game" ||
    value === "platform"
    ? value
    : "all";
}

function normalizeSort(value?: string): SessionSort {
  return value === "title" || value === "registered" ? value : "date";
}

function normalizeDir(value?: string): SessionSortDir {
  return value === "desc" ? "desc" : "asc";
}

function normalizePageSize(value?: number): SessionPageSize {
  return PAGE_SIZES.includes(value as SessionPageSize)
    ? (value as SessionPageSize)
    : 12;
}

function normalizeSessionLocale(value?: string | null) {
  return isLocaleCode(value) ? value : DEFAULT_LOCALE;
}

function normalizeTranslations(
  value: unknown,
): GameTranslation[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(
    (row): row is GameTranslation =>
      !!row &&
      typeof row === "object" &&
      isLocaleCode((row as GameTranslation).locale) &&
      typeof (row as GameTranslation).title === "string",
  );
}

function withGameTranslations<T extends { translations?: unknown }>(
  game: T,
): T & { translations?: GameTranslation[] } {
  return {
    ...game,
    translations: normalizeTranslations(game.translations),
  };
}

function mapListRow(
  row: ListSessionRow,
  translationMap?: Map<string, GameTranslation[]>,
): Session {
  return {
    id: row.id,
    game_id: row.game_id,
    creator_id: row.creator_id,
    title: row.title,
    starts_at: row.starts_at,
    capacity: row.capacity,
    registered_count: row.registered_count,
    created_at: row.created_at,
    locale: normalizeSessionLocale(row.locale),
    game: {
      title: row.game_title,
      slug: row.game_slug,
      platform: row.game_platform,
      translations: translationMap?.get(row.game_id),
    },
    creator: row.creator_id
      ? { username: row.creator_username }
      : null,
  };
}

function filterSeedSessions(query: SessionListQuery): SessionListResult {
  const q = query.q?.trim().toLowerCase() ?? "";
  const by = normalizeSearchBy(query.by);
  const sort = normalizeSort(query.sort);
  const dir = normalizeDir(query.dir);
  const pageSize = normalizePageSize(query.size);
  const page = Math.max(query.page ?? 1, 1);
  const upcomingOnly = query.upcomingOnly !== false && !query.pastOnly;
  const pastOnly = Boolean(query.pastOnly);
  const gameSlug = query.gameSlug?.trim().toLowerCase() || null;
  const now = Date.now();

  let sessions = SEED_SESSIONS.filter((session) => {
    const starts = new Date(session.starts_at).getTime();
    if (pastOnly && starts >= now) return false;
    if (upcomingOnly && starts < now) return false;
    if (gameSlug && session.game?.slug?.toLowerCase() !== gameSlug) {
      return false;
    }
    if (!q) return true;
    const title = session.title.toLowerCase();
    const creator = (session.creator?.username ?? "").toLowerCase();
    const gameTitle = (session.game?.title ?? "").toLowerCase();
    const sessionGameSlug = (session.game?.slug ?? "").toLowerCase();
    const platform = (session.game?.platform ?? "").toLowerCase();
    if (by === "title") return title.includes(q);
    if (by === "creator") return creator.includes(q);
    if (by === "game") {
      return gameTitle.includes(q) || sessionGameSlug.includes(q);
    }
    if (by === "platform") return platform.includes(q);
    return (
      title.includes(q) ||
      creator.includes(q) ||
      gameTitle.includes(q) ||
      sessionGameSlug.includes(q) ||
      platform.includes(q)
    );
  });

  sessions = [...sessions].sort((a, b) => {
    let cmp = 0;
    if (sort === "title") cmp = a.title.localeCompare(b.title);
    else if (sort === "registered") {
      cmp = a.registered_count - b.registered_count;
    } else {
      cmp =
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    }
    return dir === "desc" ? -cmp : cmp;
  });

  const total = sessions.length;
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;

  return {
    sessions: sessions.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return null;

  const profile = data as Profile;
  const metaPicture =
    (typeof user.user_metadata?.picture === "string" &&
      user.user_metadata.picture) ||
    (typeof user.user_metadata?.avatar_url === "string" &&
      user.user_metadata.avatar_url) ||
    null;

  // Backfill Google/Discord avatar when the profile row has none yet.
  if (!profile.avatar_url && metaPicture) {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: metaPicture })
      .eq("id", user.id);
    if (!error) {
      return { ...profile, avatar_url: metaPicture };
    }
  }

  return profile;
}

export async function getGameProfilesForUser(
  userId: string,
): Promise<GameProfile[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("user_id", userId);

  if (error || !data) return [];
  return data.map((row) => ({
    ...(row as GameProfile),
    oshi_ids: Array.isArray(row.oshi_ids) ? row.oshi_ids : [],
  }));
}

export function profileIsAdmin(profile: Profile | null | undefined) {
  return isAdminProfile(profile);
}

export async function getPublishedGames(): Promise<Game[]> {
  if (!isSupabaseConfigured()) {
    return SEED_GAMES.filter((g) => g.is_published);
  }
  const supabase = await createClient();
  if (!supabase) return SEED_GAMES.filter((g) => g.is_published);

  const { data, error } = await supabase
    .from("games")
    .select(`*, ${GAME_TRANSLATIONS_SELECT}`)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return SEED_GAMES.filter((g) => g.is_published);
  return (data as Game[]).map((game) => withGameTranslations(game));
}

export async function getAllGames(): Promise<Game[]> {
  if (!isSupabaseConfigured()) return SEED_GAMES;
  const supabase = await createClient();
  if (!supabase) return SEED_GAMES;

  const { data, error } = await supabase
    .from("games")
    .select(`*, ${GAME_TRANSLATIONS_SELECT}`)
    .order("sort_order", { ascending: true });

  if (error || !data) return SEED_GAMES;
  return (data as Game[]).map((game) => withGameTranslations(game));
}

export async function getUpcomingSessions(): Promise<Session[]> {
  if (!isSupabaseConfigured()) return SEED_SESSIONS;
  const supabase = await createClient();
  if (!supabase) return SEED_SESSIONS;

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `*, game:games(title, slug, platform, ${GAME_TRANSLATIONS_SELECT}), creator:profiles!creator_id(username)`,
    )
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(12);

  if (error) return SEED_SESSIONS;
  if (!data?.length) return [];
  return (data as Session[]).map((session) => ({
    ...session,
    locale: normalizeSessionLocale(session.locale),
    game: session.game
      ? withGameTranslations(session.game)
      : session.game,
  }));
}

export async function getUpcomingSessionsByGameSlug(
  slug: string,
): Promise<Session[]> {
  if (!isSupabaseConfigured()) {
    return SEED_SESSIONS.filter(
      (session) =>
        session.game?.slug === slug &&
        new Date(session.starts_at).getTime() >= Date.now(),
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return SEED_SESSIONS.filter(
      (session) =>
        session.game?.slug === slug &&
        new Date(session.starts_at).getTime() >= Date.now(),
    );
  }

  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (gameError || !game) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `*, game:games(title, slug, platform, ${GAME_TRANSLATIONS_SELECT}), creator:profiles!creator_id(username)`,
    )
    .eq("game_id", game.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(24);

  if (error) return [];
  if (!data?.length) return [];
  return (data as Session[]).map((session) => ({
    ...session,
    locale: normalizeSessionLocale(session.locale),
    game: session.game
      ? withGameTranslations(session.game)
      : session.game,
  }));
}

export async function getSessionsPage(
  query: SessionListQuery = {},
): Promise<SessionListResult> {
  const pageSize = normalizePageSize(query.size);
  const page = Math.max(query.page ?? 1, 1);
  const by = normalizeSearchBy(query.by);
  const sort = normalizeSort(query.sort);
  const dir = normalizeDir(query.dir);
  const upcomingOnly = query.upcomingOnly !== false && !query.pastOnly;
  const pastOnly = Boolean(query.pastOnly);
  const search = query.q?.trim() || null;
  const gameSlug = query.gameSlug?.trim() || null;

  if (!isSupabaseConfigured()) {
    return filterSeedSessions({
      ...query,
      page,
      size: pageSize,
      by,
      sort,
      dir,
      upcomingOnly,
      pastOnly,
      gameSlug: gameSlug ?? undefined,
    });
  }

  const supabase = await createClient();
  if (!supabase) {
    return filterSeedSessions({
      ...query,
      page,
      size: pageSize,
      by,
      sort,
      dir,
      upcomingOnly,
      pastOnly,
      gameSlug: gameSlug ?? undefined,
    });
  }

  const { data, error } = await supabase.rpc("list_sessions", {
    p_search: search,
    p_search_by: by,
    p_sort: sort,
    p_dir: dir,
    p_page: page,
    p_page_size: pageSize,
    p_upcoming_only: upcomingOnly,
    p_past_only: pastOnly,
    p_game_slug: gameSlug,
  });

  if (error) {
    return filterSeedSessions({
      ...query,
      page,
      size: pageSize,
      by,
      sort,
      dir,
      upcomingOnly,
      pastOnly,
      gameSlug: gameSlug ?? undefined,
    });
  }

  const rows = (data ?? []) as ListSessionRow[];
  const total = Number(rows[0]?.total_count ?? 0);
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  const gameIds = Array.from(new Set(rows.map((row) => row.game_id)));
  const translationMap = new Map<string, GameTranslation[]>();
  if (gameIds.length) {
    const { data: translationRows } = await supabase
      .from("game_translations")
      .select("game_id, locale, title, description")
      .in("game_id", gameIds);

    for (const row of translationRows ?? []) {
      const locale = isLocaleCode(row.locale) ? row.locale : null;
      if (!locale) continue;
      const list = translationMap.get(row.game_id) ?? [];
      list.push({
        locale,
        title: row.title,
        description: row.description ?? null,
      });
      translationMap.set(row.game_id, list);
    }
  }

  return {
    sessions: rows.map((row) => mapListRow(row, translationMap)),
    total,
    page: Math.min(page, pageCount),
    pageSize,
    pageCount,
  };
}

export async function getJoinedSessionIds(
  sessionIds: string[],
): Promise<Set<string>> {
  if (!sessionIds.length || !isSupabaseConfigured()) return new Set();
  const supabase = await createClient();
  if (!supabase) return new Set();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("session_rsvps")
    .select("session_id")
    .eq("user_id", user.id)
    .in("session_id", sessionIds);

  if (error || !data) return new Set();
  return new Set(data.map((row) => row.session_id as string));
}

export function withViewerJoined(
  sessions: Session[],
  joinedIds: Set<string>,
): Session[] {
  return sessions.map((session) => ({
    ...session,
    viewer_joined: joinedIds.has(session.id),
  }));
}

export async function getSessionTitleSuggestions(): Promise<
  SessionTitleSuggestion[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("session_title_suggestions")
    .select("title, game_slug")
    .eq("is_active", true)
    .order("title", { ascending: true });

  if (error || !data) return [];
  return data as SessionTitleSuggestion[];
}

export async function getHeroQuotes(): Promise<HeroQuote[]> {
  const fallback: HeroQuote[] = [
    {
      id: "seed-1",
      first_line: "Shared spaces. Shared interests.",
      second_line: "Shared purpose.",
      sort_order: 1,
    },
    {
      id: "seed-2",
      first_line: "Belong. Explore.",
      second_line: "Grow together.",
      sort_order: 2,
    },
    {
      id: "seed-3",
      first_line: "Presence before",
      second_line: "proclamation.",
      sort_order: 3,
    },
  ];

  if (!isSupabaseConfigured()) return fallback;
  const supabase = await createClient();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("hero_quotes")
    .select("id, first_line, second_line, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return fallback;
  return data as HeroQuote[];
}

const FALLBACK_HOLODORI_HERO_LINES: HolodoriHeroLine[] = [
  {
    id: "fallback-1",
    word_one: "Play",
    word_two: "Expand",
    word_three: "Dreams",
    sort_order: 1,
  },
];

export async function getHolodoriHeroLines(): Promise<HolodoriHeroLine[]> {
  if (!isSupabaseConfigured()) return FALLBACK_HOLODORI_HERO_LINES;
  const supabase = await createClient();
  if (!supabase) return FALLBACK_HOLODORI_HERO_LINES;

  const { data, error } = await supabase
    .from("holodori_hero_lines")
    .select("id, word_one, word_two, word_three, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data?.length) return FALLBACK_HOLODORI_HERO_LINES;
  return data as HolodoriHeroLine[];
}

export async function getLeaderboard(limit = 20): Promise<Score[]> {
  if (!isSupabaseConfigured()) return SEED_SCORES.slice(0, limit);
  const supabase = await createClient();
  if (!supabase) return SEED_SCORES.slice(0, limit);

  const { data, error } = await supabase
    .from("scores")
    .select(
      `*, game:games!inner(title, slug, is_published, ${GAME_TRANSLATIONS_SELECT})`,
    )
    .eq("game.is_published", true)
    .order("score", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return SEED_SCORES.slice(0, limit);

  return (
    data as Array<
      Score & {
        game: {
          title: string;
          slug: string;
          translations?: unknown;
        };
      }
    >
  ).map((row) => {
    const game = withGameTranslations(row.game);
    return {
      ...row,
      game: {
        title: game.title,
        slug: game.slug,
        translations: game.translations,
      },
    };
  });
}

export async function getChatMessages(
  channel = SITE_CHAT_CHANNEL,
  limit = CHAT_VISIBLE_MESSAGE_LIMIT,
): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) {
    return SEED_CHAT.slice(-limit);
  }
  const supabase = await createClient();
  if (!supabase) return SEED_CHAT.slice(-limit);

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return SEED_CHAT.slice(-limit);
  if (!data?.length) return [];
  return [...(data as ChatMessage[])].reverse();
}
