"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SessionCard } from "@/components/sessions/SessionCard";
import { SessionDetailModal } from "@/components/sessions/SessionDetailModal";
import {
  CardsViewIcon,
  ListViewIcon,
} from "@/components/sessions/SessionActionIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { focusCurrentSessions } from "@/lib/sessions/focus-current";
import type {
  Game,
  Session,
  SessionListResult,
  SessionPageSize,
  SessionSearchBy,
  SessionSort,
  SessionSortDir,
  SessionTitleSuggestion,
} from "@/lib/types";

type SessionView = "card" | "list";

const VIEW_STORAGE_KEY = "jv:sessions-view";

type ListControls = {
  q: string;
  by: SessionSearchBy;
  sort: SessionSort;
  dir: SessionSortDir;
  page: number;
  size: SessionPageSize;
};

type Props = {
  result: SessionListResult;
  previous: SessionListResult;
  current: Omit<ListControls, "page" | "size"> & {
    page: number;
    size: SessionPageSize;
  };
  past: Omit<ListControls, "page" | "size"> & {
    page: number;
    size: SessionPageSize;
  };
  signedIn?: boolean;
  viewerId?: string | null;
  isAdmin?: boolean;
  games?: Game[];
  titleSuggestions?: SessionTitleSuggestion[];
  openSessionId?: string | null;
  gameSlug?: string | null;
  gameLabel?: string | null;
};

const PAGE_SIZES: SessionPageSize[] = [6, 12, 24];

const CURRENT_DEFAULTS = {
  q: "",
  by: "all" as SessionSearchBy,
  sort: "date" as SessionSort,
  dir: "asc" as SessionSortDir,
  size: 12 as SessionPageSize,
};

const PAST_DEFAULTS = {
  q: "",
  by: "all" as SessionSearchBy,
  sort: "date" as SessionSort,
  dir: "desc" as SessionSortDir,
  size: 12 as SessionPageSize,
};

const controlClass =
  "rounded-[6px] border border-ink-15 bg-base px-3 py-2 text-sm outline-none focus:border-ink";

function buildHref(params: {
  current: ListControls;
  past: ListControls;
  gameSlug?: string | null;
}) {
  const search = new URLSearchParams();
  const { current, past } = params;

  if (params.gameSlug) search.set("game", params.gameSlug);
  if (current.q.trim()) search.set("q", current.q.trim());
  if (current.by !== CURRENT_DEFAULTS.by) search.set("by", current.by);
  if (current.sort !== CURRENT_DEFAULTS.sort) search.set("sort", current.sort);
  if (current.dir !== CURRENT_DEFAULTS.dir) search.set("dir", current.dir);
  if (current.size !== CURRENT_DEFAULTS.size) {
    search.set("size", String(current.size));
  }
  if (current.page > 1) search.set("page", String(current.page));

  if (past.q.trim()) search.set("pastQ", past.q.trim());
  if (past.by !== PAST_DEFAULTS.by) search.set("pastBy", past.by);
  if (past.sort !== PAST_DEFAULTS.sort) search.set("pastSort", past.sort);
  if (past.dir !== PAST_DEFAULTS.dir) search.set("pastDir", past.dir);
  if (past.size !== PAST_DEFAULTS.size) {
    search.set("pastSize", String(past.size));
  }
  if (past.page > 1) search.set("pastPage", String(past.page));

  const query = search.toString();
  return query ? `/sessions?${query}` : "/sessions";
}

function pageWindow(current: number, total: number) {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  for (let page = start; page <= end; page += 1) pages.push(page);
  return pages;
}

function hasActiveFilters(
  controls: Omit<ListControls, "page">,
  defaults: typeof CURRENT_DEFAULTS | typeof PAST_DEFAULTS,
) {
  return (
    Boolean(controls.q.trim()) ||
    controls.by !== defaults.by ||
    controls.sort !== defaults.sort ||
    controls.dir !== defaults.dir ||
    controls.size !== defaults.size
  );
}

function ListFooter({
  current,
  past,
  gameSlug,
  pageCount,
  mode,
  perPageLabel,
  paginationLabel,
  previousLabel,
  nextLabel,
}: {
  current: ListControls;
  past: ListControls;
  gameSlug?: string | null;
  pageCount: number;
  mode: "current" | "past";
  perPageLabel: string;
  paginationLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const router = useRouter();
  const controls = mode === "current" ? current : past;
  const activePage = controls.page;

  function hrefForPage(pageNumber: number) {
    return buildHref({
      current:
        mode === "current" ? { ...current, page: pageNumber } : current,
      past: mode === "past" ? { ...past, page: pageNumber } : past,
      gameSlug,
    });
  }

  function hrefForSize(size: SessionPageSize) {
    return buildHref({
      current:
        mode === "current" ? { ...current, size, page: 1 } : current,
      past: mode === "past" ? { ...past, size, page: 1 } : past,
      gameSlug,
    });
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <label className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
        {perPageLabel}
        <select
          value={String(controls.size)}
          onChange={(event) => {
            const size = Number(event.target.value) as SessionPageSize;
            router.replace(hrefForSize(size), { scroll: false });
          }}
          className={controlClass}
          aria-label={perPageLabel}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      {pageCount > 1 ? (
        <nav
          aria-label={paginationLabel}
          className="flex flex-wrap items-center gap-3"
        >
          <Link
            href={hrefForPage(Math.max(activePage - 1, 1))}
            aria-disabled={activePage <= 1}
            className={`rounded-[6px] border border-ink-15 px-3.5 py-2 text-sm font-semibold no-underline ${
              activePage <= 1
                ? "pointer-events-none text-ink-40 opacity-50"
                : "text-ink hover:border-accent-500 hover:text-accent-500"
            }`}
          >
            {previousLabel}
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {pageWindow(activePage, pageCount).map((pageNumber) => (
              <Link
                key={pageNumber}
                href={hrefForPage(pageNumber)}
                aria-current={pageNumber === activePage ? "page" : undefined}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-[6px] border px-2.5 text-sm font-semibold no-underline ${
                  pageNumber === activePage
                    ? "border-ink bg-btn-dark !text-btn-dark-fg"
                    : "border-ink-15 text-ink hover:border-accent-500 hover:text-accent-500"
                }`}
              >
                {pageNumber}
              </Link>
            ))}
          </div>

          <Link
            href={hrefForPage(Math.min(activePage + 1, pageCount))}
            aria-disabled={activePage >= pageCount}
            className={`rounded-[6px] border border-ink-15 px-3.5 py-2 text-sm font-semibold no-underline ${
              activePage >= pageCount
                ? "pointer-events-none text-ink-40 opacity-50"
                : "text-ink hover:border-accent-500 hover:text-accent-500"
            }`}
          >
            {nextLabel}
          </Link>
        </nav>
      ) : null}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: SessionView;
  onChange: (view: SessionView) => void;
}) {
  const { t } = useLocale();

  return (
    <div
      className="mb-4 flex items-center justify-end gap-2"
      role="group"
      aria-label={t("sessions.viewMode")}
    >
      <span className="text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
        {t("sessions.viewMode")}
      </span>
      <div className="inline-flex overflow-hidden rounded-[6px] border border-ink-15">
        <button
          type="button"
          onClick={() => onChange("card")}
          aria-pressed={view === "card"}
          aria-label={t("sessions.viewCards")}
          title={t("sessions.viewCards")}
          className={`inline-flex cursor-pointer items-center justify-center px-2.5 py-2 transition-colors ${
            view === "card"
              ? "bg-btn-dark text-btn-dark-fg"
              : "bg-surface text-ink hover:text-accent-500"
          }`}
        >
          <CardsViewIcon />
        </button>
        <button
          type="button"
          onClick={() => onChange("list")}
          aria-pressed={view === "list"}
          aria-label={t("sessions.viewList")}
          title={t("sessions.viewList")}
          className={`inline-flex cursor-pointer items-center justify-center border-l border-ink-15 px-2.5 py-2 transition-colors ${
            view === "list"
              ? "bg-btn-dark text-btn-dark-fg"
              : "bg-surface text-ink hover:text-accent-500"
          }`}
        >
          <ListViewIcon />
        </button>
      </div>
    </div>
  );
}

function SessionFilters({
  id,
  mode,
  controls,
  preserve,
  gameSlug,
  open,
  onToggle,
}: {
  id: string;
  mode: "current" | "past";
  controls: ListControls;
  preserve: ListControls;
  gameSlug?: string | null;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const defaults = mode === "current" ? CURRENT_DEFAULTS : PAST_DEFAULTS;
  const active = hasActiveFilters(controls, defaults);
  const [query, setQuery] = useState(controls.q);

  useEffect(() => {
    setQuery(controls.q);
  }, [controls.q]);

  useEffect(() => {
    const next = query.trim();
    const current = controls.q.trim();
    if (next === current) return;

    const timer = window.setTimeout(() => {
      const href = buildHref({
        current:
          mode === "current"
            ? { ...controls, q: query, page: 1 }
            : preserve,
        past:
          mode === "past" ? { ...controls, q: query, page: 1 } : preserve,
        gameSlug,
      });
      router.replace(href, { scroll: false });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query, controls, preserve, mode, gameSlug, router]);

  const clearHref = buildHref({
    current:
      mode === "current" ? { ...CURRENT_DEFAULTS, page: 1 } : preserve,
    past: mode === "past" ? { ...PAST_DEFAULTS, page: 1 } : preserve,
    gameSlug,
  });

  function replaceControls(next: Partial<ListControls>) {
    const updated = { ...controls, ...next, page: 1 };
    router.replace(
      buildHref({
        current: mode === "current" ? updated : preserve,
        past: mode === "past" ? updated : preserve,
        gameSlug,
      }),
      { scroll: false },
    );
  }

  return (
    <div className="mb-3">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[6px] border border-ink-08 bg-surface px-4 py-3 text-left text-sm font-semibold md:hidden"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        <span className="inline-flex items-center gap-2">
          {open ? t("sessions.hideFilters") : t("sessions.showFilters")}
          {(active || gameSlug) && !open ? (
            <span className="rounded-full bg-accent-500 px-2 py-0.5 font-[family-name:var(--font-ibm-plex-mono)] text-[10px] font-semibold tracking-[0.04em] text-white uppercase">
              {t("sessions.filters")}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden
          className={`text-ink-40 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      <div
        id={id}
        className={`${
          open ? "grid" : "hidden"
        } mt-3 gap-3 rounded-[6px] border border-ink-08 bg-surface p-4 md:mt-0 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.65fr)_minmax(0,0.85fr)_minmax(0,0.65fr)]`}
      >
        <div>
          <label className="block text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
            {t("sessions.search")}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("sessions.searchPlaceholder")}
              className={`mt-1.5 w-full ${controlClass}`}
              autoComplete="off"
            />
          </label>
          {active ? (
            <Link
              href={clearHref}
              className="mt-2 inline-block text-[13px] font-semibold text-accent-600 no-underline hover:text-accent-700"
            >
              {t("sessions.resetFilters")}
            </Link>
          ) : null}
        </div>

        <label className="block text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
          {t("sessions.filterBy")}
          <select
            value={controls.by}
            onChange={(event) =>
              replaceControls({ by: event.target.value as SessionSearchBy })
            }
            className={`mt-1.5 w-full ${controlClass}`}
          >
            <option value="all">{t("sessions.allFields")}</option>
            <option value="title">{t("sessions.sessionTitle")}</option>
            <option value="game">{t("sessions.gameTitle")}</option>
            <option value="platform">{t("sessions.platform")}</option>
            <option value="creator">{t("sessions.creatorName")}</option>
          </select>
        </label>

        <label className="block text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
          {t("sessions.sortBy")}
          <select
            value={controls.sort}
            onChange={(event) =>
              replaceControls({ sort: event.target.value as SessionSort })
            }
            className={`mt-1.5 w-full ${controlClass}`}
          >
            <option value="date">{t("sessions.dateTime")}</option>
            <option value="title">{t("sessions.sessionTitle")}</option>
            <option value="registered">
              {t("sessions.registeredPlayers")}
            </option>
          </select>
        </label>

        <label className="block text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
          {t("sessions.direction")}
          <select
            value={controls.dir}
            onChange={(event) =>
              replaceControls({ dir: event.target.value as SessionSortDir })
            }
            className={`mt-1.5 w-full ${controlClass}`}
          >
            <option value="asc">{t("sessions.ascending")}</option>
            <option value="desc">{t("sessions.descending")}</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export function SessionsBrowser({
  result,
  previous,
  current,
  past,
  signedIn = false,
  viewerId = null,
  isAdmin = false,
  games = [],
  titleSuggestions = [],
  openSessionId = null,
  gameSlug = null,
  gameLabel = null,
}: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentFiltersOpen, setCurrentFiltersOpen] = useState(false);
  const [pastFiltersOpen, setPastFiltersOpen] = useState(false);
  const [view, setView] = useState<SessionView>("card");
  const [openSection, setOpenSection] = useState<"current" | "past" | null>(
    "current",
  );
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activePast, setActivePast] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Record<string, true>>({});

  const currentOpen = openSection === "current";
  const pastOpen = openSection === "past";

  function focusSection(section: "current" | "past") {
    const id =
      section === "current" ? "current-sessions" : "past-sessions-header";
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }

  function toggleSection(section: "current" | "past") {
    setOpenSection((prev) => (prev === section ? null : section));
    // Focus after expand/collapse so the header stays the keyboard target.
    requestAnimationFrame(() => focusSection(section));
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
      if (stored === "card" || stored === "list") setView(stored);
    } catch {
      // ignore storage failures
    }
  }, []);

  function changeView(next: SessionView) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  }

  const allSessions = useMemo(
    () => [...result.sessions, ...previous.sessions],
    [result.sessions, previous.sessions],
  );

  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const session of allSessions) {
      if (session.viewer_joined) initial[session.id] = true;
    }
    return initial;
  });

  const [countMap, setCountMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const session of allSessions) {
      initial[session.id] = session.registered_count;
    }
    return initial;
  });

  useEffect(() => {
    setJoinedMap((prev) => {
      const next = { ...prev };
      for (const session of allSessions) {
        if (session.viewer_joined != null) {
          next[session.id] = session.viewer_joined;
        }
      }
      return next;
    });
    setCountMap((prev) => {
      const next = { ...prev };
      for (const session of allSessions) {
        if (next[session.id] == null) {
          next[session.id] = session.registered_count;
        }
      }
      return next;
    });
  }, [allSessions]);

  const clearSessionParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("session")) return;
    params.delete("session");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const openSession = useCallback(
    (session: Session, isPast: boolean) => {
      setActiveSession(session);
      setActivePast(isPast);
      const params = new URLSearchParams(searchParams.toString());
      params.set("session", session.id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const closeSession = useCallback(() => {
    setActiveSession(null);
    clearSessionParam();
  }, [clearSessionParam]);

  useEffect(() => {
    if (!openSessionId) return;
    const match = allSessions.find((session) => session.id === openSessionId);
    if (match) {
      setActiveSession(match);
      const isPast = previous.sessions.some(
        (session) => session.id === openSessionId,
      );
      setActivePast(isPast);
      setOpenSection(isPast ? "past" : "current");
      return;
    }

    let cancelled = false;
    void (async () => {
      const response = await fetch(`/api/sessions/${openSessionId}`);
      if (!response.ok || cancelled) return;
      const payload = await response.json();
      if (cancelled || !payload.session) return;
      const isPast =
        new Date(payload.session.starts_at).getTime() <= Date.now();
      setActiveSession(payload.session as Session);
      setActivePast(isPast);
      setOpenSection(isPast ? "past" : "current");
      setJoinedMap((prev) => ({
        ...prev,
        [payload.session.id]: Boolean(payload.viewer_joined),
      }));
      setCountMap((prev) => ({
        ...prev,
        [payload.session.id]: Number(payload.session.registered_count),
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [openSessionId, allSessions, previous.sessions]);

  const onJoinedChange = useCallback(
    (sessionId: string, next: { joined: boolean; registered_count: number }) => {
      setJoinedMap((prev) => ({ ...prev, [sessionId]: next.joined }));
      setCountMap((prev) => ({
        ...prev,
        [sessionId]: next.registered_count,
      }));
    },
    [],
  );

  useEffect(() => {
    function expandCurrent() {
      setOpenSection("current");
    }

    function handleHashFocus() {
      const hash = window.location.hash;
      if (hash !== "#current-sessions" && hash !== "#sessions") return;
      expandCurrent();
      // Defer scroll until after expand paints.
      requestAnimationFrame(() => focusCurrentSessions());
    }

    window.addEventListener("jv:expand-current-sessions", expandCurrent);
    handleHashFocus();
    window.addEventListener("hashchange", handleHashFocus);
    return () => {
      window.removeEventListener("jv:expand-current-sessions", expandCurrent);
      window.removeEventListener("hashchange", handleHashFocus);
    };
  }, []);

  const { sessions, total, pageCount } = result;
  const {
    sessions: pastSessions,
    total: pastTotal,
    pageCount: pastPageCount,
  } = previous;

  const currentControls: ListControls = {
    ...current,
    page: result.page,
    size: result.pageSize,
  };
  const pastControls: ListControls = {
    ...past,
    page: previous.page,
    size: previous.pageSize,
  };

  const pastHasFilters = hasActiveFilters(pastControls, PAST_DEFAULTS);

  const from = total === 0 ? 0 : (currentControls.page - 1) * currentControls.size + 1;
  const to = Math.min(currentControls.page * currentControls.size, total);
  const pastFrom =
    pastTotal === 0 ? 0 : (pastControls.page - 1) * pastControls.size + 1;
  const pastTo = Math.min(pastControls.page * pastControls.size, pastTotal);

  const clearGameHref = buildHref({
    current: currentControls,
    past: pastControls,
    gameSlug: null,
  });

  function canDeleteSession(session: Session) {
    if (!viewerId) return false;
    if (isAdmin) return true;
    return session.creator_id === viewerId;
  }

  function hideSession(sessionId: string) {
    setHiddenIds((prev) => ({ ...prev, [sessionId]: true }));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      clearSessionParam();
    }
  }

  const visibleCurrent = sessions.filter((session) => !hiddenIds[session.id]);
  const visiblePast = pastSessions.filter((session) => !hiddenIds[session.id]);

  const activeId = activeSession?.id;
  const activeJoined = activeId ? Boolean(joinedMap[activeId]) : false;
  const activeCount = activeId
    ? (countMap[activeId] ?? activeSession?.registered_count ?? 0)
    : 0;

  return (
    <section id="sessions" className="scroll-mt-28 pb-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <button
            type="button"
            id="current-sessions"
            tabIndex={-1}
            className="flex min-w-0 flex-1 cursor-pointer scroll-mt-28 items-start justify-between gap-3 rounded-[6px] border-0 bg-transparent p-0 text-left outline-none"
            aria-expanded={currentOpen}
            aria-controls="current-sessions-panel"
            onClick={() => toggleSection("current")}
          >
            <div className="min-w-0">
              <h2 className="text-[28px]">{t("sessions.current")}</h2>
              <p className="mt-1 text-sm text-ink-70">
                {!currentOpen
                  ? t("sessions.clickToExpand")
                  : total === 0
                    ? t("sessions.noMatch")
                    : t("sessions.showing", { from, to, total })}
              </p>
            </div>
            <span
              aria-hidden
              className={`mt-2 shrink-0 text-ink-40 transition-transform ${
                currentOpen ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>
        </div>

        <div
          id="current-sessions-panel"
          className={currentOpen ? undefined : "hidden"}
        >
          <SessionFilters
            id="session-filters"
            mode="current"
            controls={currentControls}
            preserve={pastControls}
            gameSlug={gameSlug}
            open={currentFiltersOpen}
            onToggle={() => setCurrentFiltersOpen((open) => !open)}
          />

          {gameSlug ? (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-ink-08 bg-surface px-4 py-2.5">
              <p className="m-0 text-sm text-ink-70">
                {t("sessions.filteredByGame", {
                  game: gameLabel || gameSlug,
                })}
              </p>
              <Link
                href={clearGameHref}
                className="text-[13px] font-semibold text-accent-600 no-underline hover:text-accent-700"
              >
                {t("sessions.clearGameFilter")}
              </Link>
            </div>
          ) : null}

          <ViewToggle view={view} onChange={changeView} />

          {visibleCurrent.length ? (
            <div
              className={
                view === "list"
                  ? "grid gap-3"
                  : "grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {visibleCurrent.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  view={view}
                  signedIn={signedIn}
                  canDelete={canDeleteSession(session)}
                  joined={Boolean(joinedMap[session.id])}
                  registeredCount={
                    countMap[session.id] ?? session.registered_count
                  }
                  games={games}
                  titleSuggestions={titleSuggestions}
                  onOpen={() => openSession(session, false)}
                  onJoinedChange={(next) => onJoinedChange(session.id, next)}
                  onDeleted={() => hideSession(session.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[6px] border border-dashed border-ink-15 bg-surface px-6 py-12 text-center">
              <p className="font-semibold">{t("sessions.noMatchTitle")}</p>
              <p className="mt-1 text-sm text-ink-70">
                {t("sessions.noMatchBody")}
              </p>
            </div>
          )}

          <ListFooter
            current={currentControls}
            past={pastControls}
            gameSlug={gameSlug}
            pageCount={pageCount}
            mode="current"
            perPageLabel={t("sessions.perPage")}
            paginationLabel={t("sessions.pagination")}
            previousLabel={t("sessions.previous")}
            nextLabel={t("sessions.next")}
          />
        </div>

        <div className="mt-16 border-t border-ink-08 pt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <button
              type="button"
              id="past-sessions-header"
              tabIndex={-1}
              className="flex min-w-0 flex-1 cursor-pointer scroll-mt-28 items-start justify-between gap-3 rounded-[6px] border-0 bg-transparent p-0 text-left outline-none"
              aria-expanded={pastOpen}
              aria-controls="past-sessions"
              onClick={() => toggleSection("past")}
            >
              <div className="min-w-0">
                <h2 className="text-[28px]">{t("sessions.past")}</h2>
                <p className="mt-1 text-sm text-ink-70">
                  {!pastOpen
                    ? t("sessions.clickToExpand")
                    : pastTotal === 0
                      ? pastHasFilters
                        ? t("sessions.noMatch")
                        : t("sessions.pastEmpty")
                      : t("sessions.showing", {
                          from: pastFrom,
                          to: pastTo,
                          total: pastTotal,
                        })}
                </p>
              </div>
              <span
                aria-hidden
                className={`mt-2 shrink-0 text-ink-40 transition-transform ${
                  pastOpen ? "rotate-180" : ""
                }`}
              >
                ▾
              </span>
            </button>
          </div>

          <div
            id="past-sessions"
            className={pastOpen ? undefined : "hidden"}
          >
            <SessionFilters
              id="past-session-filters"
              mode="past"
              controls={pastControls}
              preserve={currentControls}
              gameSlug={gameSlug}
              open={pastFiltersOpen}
              onToggle={() => setPastFiltersOpen((open) => !open)}
            />

            {gameSlug ? (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-ink-08 bg-surface px-4 py-2.5">
                <p className="m-0 text-sm text-ink-70">
                  {t("sessions.filteredByGame", {
                    game: gameLabel || gameSlug,
                  })}
                </p>
                <Link
                  href={clearGameHref}
                  className="text-[13px] font-semibold text-accent-600 no-underline hover:text-accent-700"
                >
                  {t("sessions.clearGameFilter")}
                </Link>
              </div>
            ) : null}

            <ViewToggle view={view} onChange={changeView} />

            {visiblePast.length ? (
              <div
                className={
                  view === "list"
                    ? "grid gap-3"
                    : "grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3"
                }
              >
                {visiblePast.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    view={view}
                    past
                    signedIn={signedIn}
                    joined={Boolean(joinedMap[session.id])}
                    registeredCount={
                      countMap[session.id] ?? session.registered_count
                    }
                    onOpen={() => openSession(session, true)}
                    onJoinedChange={(next) => onJoinedChange(session.id, next)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[6px] border border-dashed border-ink-15 bg-surface px-6 py-12 text-center">
                <p className="font-semibold">
                  {pastHasFilters
                    ? t("sessions.noMatchTitle")
                    : t("sessions.pastEmpty")}
                </p>
                {pastHasFilters ? (
                  <p className="mt-1 text-sm text-ink-70">
                    {t("sessions.noMatchBody")}
                  </p>
                ) : null}
              </div>
            )}

            <ListFooter
              current={currentControls}
              past={pastControls}
              gameSlug={gameSlug}
              pageCount={pastPageCount}
              mode="past"
              perPageLabel={t("sessions.perPage")}
              paginationLabel={t("sessions.pagination")}
              previousLabel={t("sessions.previous")}
              nextLabel={t("sessions.next")}
            />
          </div>
        </div>
      </div>

      <SessionDetailModal
        session={activeSession}
        open={Boolean(activeSession)}
        signedIn={signedIn}
        past={activePast}
        canDelete={
          Boolean(activeSession) &&
          !activePast &&
          canDeleteSession(activeSession!)
        }
        joined={activeJoined}
        registeredCount={activeCount}
        games={games}
        titleSuggestions={titleSuggestions}
        viewerId={viewerId}
        onClose={closeSession}
        onJoinedChange={(next) => {
          if (!activeSession) return;
          onJoinedChange(activeSession.id, next);
        }}
        onDeleted={() => {
          if (!activeSession) return;
          hideSession(activeSession.id);
        }}
        onUpdated={(updated) => {
          setActiveSession(updated);
        }}
      />
    </section>
  );
}
