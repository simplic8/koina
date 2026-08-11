import { Suspense } from "react";
import { PageIntro } from "@/components/i18n/T";
import { SessionsBrowser } from "@/components/sessions/SessionsBrowser";
import { SessionsHeaderActions } from "@/components/sessions/SessionsHeaderActions";
import {
  getCurrentProfile,
  getJoinedSessionIds,
  getPublishedGames,
  getSessionsPage,
  getSessionTitleSuggestions,
  withViewerJoined,
} from "@/lib/data";
import { isAdminProfile } from "@/lib/auth/is-admin";
import type {
  SessionPageSize,
  SessionSearchBy,
  SessionSort,
  SessionSortDir,
} from "@/lib/types";
import { redirect } from "next/navigation";

function first(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSearchBy(value?: string): SessionSearchBy {
  return value === "title" ||
    value === "creator" ||
    value === "game" ||
    value === "platform"
    ? value
    : "all";
}

function parseSort(value?: string): SessionSort {
  return value === "title" || value === "registered" ? value : "date";
}

function parseDir(value?: string): SessionSortDir {
  return value === "desc" ? "desc" : "asc";
}

function parsePastDir(value?: string): SessionSortDir {
  return value === "asc" ? "asc" : "desc";
}

function parseSize(value?: string): SessionPageSize {
  const size = Number(value);
  return size === 6 || size === 12 || size === 24 ? size : 12;
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    create?: string | string[];
    game?: string | string[];
    session?: string | string[];
    q?: string | string[];
    by?: string | string[];
    sort?: string | string[];
    dir?: string | string[];
    page?: string | string[];
    size?: string | string[];
    pastQ?: string | string[];
    pastBy?: string | string[];
    pastSort?: string | string[];
    pastDir?: string | string[];
    pastPage?: string | string[];
    pastSize?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const create = first(params.create);
  const gameSlug = first(params.game)?.trim() || null;
  const openSessionId = first(params.session)?.trim() || null;

  const q = first(params.q)?.trim() ?? "";
  const by = parseSearchBy(first(params.by));
  const sort = parseSort(first(params.sort));
  const dir = parseDir(first(params.dir));
  const size = parseSize(first(params.size));
  const page = Math.max(Number(first(params.page) ?? "1") || 1, 1);

  const pastQ = first(params.pastQ)?.trim() ?? "";
  const pastBy = parseSearchBy(first(params.pastBy));
  const pastSort = parseSort(first(params.pastSort));
  const pastDir = parsePastDir(first(params.pastDir));
  const pastSize = parseSize(first(params.pastSize));
  const pastPage = Math.max(Number(first(params.pastPage) ?? "1") || 1, 1);

  const [resultRaw, previousRaw, games, profile, titleSuggestions] =
    await Promise.all([
      getSessionsPage({
        q,
        by,
        sort,
        dir,
        page,
        size,
        upcomingOnly: true,
        gameSlug: gameSlug ?? undefined,
      }),
      getSessionsPage({
        q: pastQ,
        by: pastBy,
        sort: pastSort,
        dir: pastDir,
        page: pastPage,
        size: pastSize,
        pastOnly: true,
        upcomingOnly: false,
        gameSlug: gameSlug ?? undefined,
      }),
      getPublishedGames(),
      getCurrentProfile(),
      getSessionTitleSuggestions(),
    ]);

  const joinedIds = await getJoinedSessionIds([
    ...resultRaw.sessions.map((session) => session.id),
    ...previousRaw.sessions.map((session) => session.id),
    ...(openSessionId ? [openSessionId] : []),
  ]);

  const result = {
    ...resultRaw,
    sessions: withViewerJoined(resultRaw.sessions, joinedIds),
  };
  const previous = {
    ...previousRaw,
    sessions: withViewerJoined(previousRaw.sessions, joinedIds),
  };

  if (create === "true" && !profile) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/sessions?create=true${gameSlug ? `&game=${encodeURIComponent(gameSlug)}` : ""}`,
      )}`,
    );
  }

  const gameLabel =
    games.find((game) => game.slug === gameSlug)?.title ??
    (gameSlug === "holodori" ? "Holodori" : gameSlug);

  return (
    <div className="py-10">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-8">
          <PageIntro
            titleKey="sessions.pageTitle"
            leadKey="sessions.pageLead"
            className="[&>p]:mb-0"
          />
          <SessionsHeaderActions
            signedIn={Boolean(profile)}
            games={games}
            titleSuggestions={titleSuggestions}
            openOnMount={create === "true"}
            defaultGameSlug={gameSlug ?? undefined}
          />
        </div>
      </div>
      <Suspense fallback={null}>
        <SessionsBrowser
          result={result}
          previous={previous}
          current={{ q, by, sort, dir, page, size }}
          past={{
            q: pastQ,
            by: pastBy,
            sort: pastSort,
            dir: pastDir,
            page: pastPage,
            size: pastSize,
          }}
          gameSlug={gameSlug}
          gameLabel={gameLabel}
          signedIn={Boolean(profile)}
          viewerId={profile?.id ?? null}
          isAdmin={isAdminProfile(profile)}
          games={games}
          titleSuggestions={titleSuggestions}
          openSessionId={openSessionId}
        />
      </Suspense>
    </div>
  );
}
