"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { Button } from "@/components/ui/Button";
import { FriendActionControls } from "@/components/friends/FriendActionControls";
import {
  CardsViewIcon,
  ListViewIcon,
} from "@/components/sessions/SessionActionIcons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  getHolomemGenerations,
  HOLOMEM_BY_ID,
  type Holomem,
  type HolomemGeneration,
} from "@/lib/hololive/holomems";
import type { FriendPerson, FriendshipStatus, GameProfile } from "@/lib/types";

const inputClass =
  "mt-1.5 w-full rounded-[6px] border border-ink-15 bg-base px-3.5 py-2.5 text-sm outline-none focus:border-ink";

type OshiView = "card" | "list";

type Props = {
  initial: GameProfile | null;
};

function memberInitials(member: Holomem) {
  return member.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function initialsTextColor(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#ffffff";
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72 ? "#1a1a1a" : "#ffffff";
}

function matchesQuery(member: Holomem, query: string) {
  if (!query) return true;
  const haystack = `${member.name} ${member.nameJa ?? ""} ${member.id}`.toLowerCase();
  return haystack.includes(query);
}

function OshiBadge({
  member,
  className,
}: {
  member: Holomem;
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-center font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold ${className}`}
      style={{
        backgroundColor: member.color,
        color: initialsTextColor(member.color),
      }}
    >
      {memberInitials(member)}
    </div>
  );
}

export function HolodoriGameProfile({ initial }: Props) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const generations = useMemo(() => getHolomemGenerations(), []);
  const [gameId, setGameId] = useState(initial?.holodori_game_id ?? "");
  const [oshiIds, setOshiIds] = useState<string[]>(initial?.oshi_ids ?? []);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<OshiView>("card");
  const [savingGameId, setSavingGameId] = useState(false);
  const [savingOshi, setSavingOshi] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<"saved" | "removed" | null>(null);
  const [playedWith, setPlayedWith] = useState<FriendPerson[]>([]);
  const [playedLoading, setPlayedLoading] = useState(true);
  const [playedError, setPlayedError] = useState<string | null>(null);
  const [friendBusyId, setFriendBusyId] = useState<string | null>(null);
  const oshiSaveTimer = useRef<number | null>(null);
  const toastTimer = useRef<number | null>(null);
  const oshiRequestId = useRef(0);
  const pendingOshiAction = useRef<"saved" | "removed">("saved");

  useEffect(() => {
    let cancelled = false;
    setPlayedLoading(true);
    setPlayedError(null);
    void (async () => {
      try {
        const response = await fetch(
          "/api/friends/played-with?game=holodori",
        );
        const payload = (await response.json()) as {
          people?: FriendPerson[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(
            payload.error || t("profile.holodori.playedError"),
          );
        }
        if (!cancelled) setPlayedWith(payload.people ?? []);
      } catch (err) {
        if (!cancelled) {
          setPlayedError(
            err instanceof Error
              ? err.message
              : t("profile.holodori.playedError"),
          );
        }
      } finally {
        if (!cancelled) setPlayedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    return () => {
      if (oshiSaveTimer.current != null) {
        window.clearTimeout(oshiSaveTimer.current);
      }
      if (toastTimer.current != null) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  function showToast(kind: "saved" | "removed") {
    setToast(kind);
    if (toastTimer.current != null) {
      window.clearTimeout(toastTimer.current);
    }
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }

  function onFriendStatus(person: FriendPerson, status: FriendshipStatus) {
    setPlayedWith((prev) =>
      prev.map((item) =>
        item.id === person.id
          ? {
              ...item,
              friendship_status: status,
              is_friend: status === "friends",
            }
          : item,
      ),
    );
  }

  const selectedOshis = useMemo(
    () =>
      oshiIds
        .map((id) => HOLOMEM_BY_ID[id])
        .filter((member): member is Holomem => Boolean(member)),
    [oshiIds],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredGenerations = useMemo(() => {
    return generations
      .map((generation) => {
        const generationMatch = generation.label
          .toLowerCase()
          .includes(normalizedQuery);
        return {
          ...generation,
          members: generation.members.filter(
            (member) =>
              generationMatch || matchesQuery(member, normalizedQuery),
          ),
        };
      })
      .filter((generation) => generation.members.length > 0);
  }, [generations, normalizedQuery]);

  const visibleCount = filteredGenerations.reduce(
    (sum, generation) => sum + generation.members.length,
    0,
  );

  function openOshiModal() {
    dialogRef.current?.showModal();
  }

  function closeOshiModal() {
    dialogRef.current?.close();
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeOshiModal();
  }

  async function saveOshiIds(
    nextOshiIds: string[],
    action: "saved" | "removed",
  ) {
    const requestId = ++oshiRequestId.current;
    setSavingOshi(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/game-profiles/holodori", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oshiIds: nextOshiIds }),
      });
      const data = (await response.json()) as {
        error?: string;
        profile?: GameProfile;
      };
      if (!response.ok) {
        throw new Error(data.error || t("profile.holodori.saveError"));
      }
      if (requestId !== oshiRequestId.current) return;
      setOshiIds(data.profile?.oshi_ids ?? nextOshiIds);
      showToast(action);
      router.refresh();
    } catch (err) {
      if (requestId !== oshiRequestId.current) return;
      setError(
        err instanceof Error ? err.message : t("profile.holodori.saveError"),
      );
    } finally {
      if (requestId === oshiRequestId.current) {
        setSavingOshi(false);
      }
    }
  }

  function toggleOshi(id: string, options?: { closeModalOnSelect?: boolean }) {
    const removing = oshiIds.includes(id);
    const next = removing
      ? oshiIds.filter((item) => item !== id)
      : [...oshiIds, id];
    pendingOshiAction.current = removing ? "removed" : "saved";
    setOshiIds(next);

    if (oshiSaveTimer.current != null) {
      window.clearTimeout(oshiSaveTimer.current);
    }
    oshiSaveTimer.current = window.setTimeout(() => {
      void saveOshiIds(next, pendingOshiAction.current);
    }, 250);

    if (!removing && options?.closeModalOnSelect) {
      closeOshiModal();
    }
  }

  async function onSaveGameId(event: FormEvent) {
    event.preventDefault();
    setSavingGameId(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/profile/game-profiles/holodori", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holodoriGameId: gameId,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        profile?: GameProfile;
      };
      if (!response.ok) {
        throw new Error(data.error || t("profile.holodori.saveError"));
      }
      setGameId(data.profile?.holodori_game_id ?? "");
      setMessage(t("profile.holodori.saved"));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("profile.holodori.saveError"),
      );
    } finally {
      setSavingGameId(false);
    }
  }

  function renderMember(member: Holomem, generation: HolomemGeneration) {
    const selected = oshiIds.includes(member.id);
    const style = {
      "--oshi": member.color,
      borderColor: selected ? member.color : undefined,
      backgroundColor: selected
        ? `color-mix(in srgb, ${member.color} 22%, var(--surface))`
        : undefined,
      boxShadow: selected
        ? `0 0 0 2px color-mix(in srgb, ${member.color} 55%, transparent)`
        : undefined,
    } as CSSProperties;

    if (view === "list") {
      return (
        <button
          key={member.id}
          type="button"
          onClick={() => toggleOshi(member.id, { closeModalOnSelect: true })}
          aria-pressed={selected}
          className={`flex w-full items-center gap-3 rounded-[6px] border-2 px-3 py-2.5 text-left transition-[box-shadow,background-color,border-color] ${
            selected
              ? "border-[color:var(--oshi)]"
              : "border-ink-15 bg-surface hover:border-ink-40"
          }`}
          style={style}
        >
          <OshiBadge
            member={member}
            className="h-12 w-12 shrink-0 rounded-[6px]"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold leading-tight">
              {member.name}
            </div>
            {member.nameJa ? (
              <div className="mt-0.5 text-[12px] text-ink-40">
                {member.nameJa}
              </div>
            ) : null}
            <div className="mt-0.5 text-[11px] text-ink-40">
              {generation.label}
            </div>
          </div>
          {selected ? (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: member.color }}
              aria-hidden
            >
              ✓
            </span>
          ) : null}
        </button>
      );
    }

    return (
      <button
        key={member.id}
        type="button"
        onClick={() => toggleOshi(member.id, { closeModalOnSelect: true })}
        aria-pressed={selected}
        className={`relative rounded-[6px] border-2 px-2.5 py-3 text-left transition-[box-shadow,background-color,border-color] ${
          selected
            ? "border-[color:var(--oshi)]"
            : "border-ink-15 bg-surface hover:border-ink-40"
        }`}
        style={style}
      >
        {selected ? (
          <span
            className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: member.color }}
            aria-hidden
          >
            ✓
          </span>
        ) : null}
        <OshiBadge member={member} className="mb-2 h-10 w-10 rounded-[6px]" />
        <div className="text-[13px] font-semibold leading-tight">
          {member.name}
        </div>
        {member.nameJa ? (
          <div className="mt-0.5 text-[11px] text-ink-40">{member.nameJa}</div>
        ) : null}
      </button>
    );
  }

  return (
    <>
      <form onSubmit={onSaveGameId} className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold">
            {t("profile.holodori.title")}
          </h3>
          <p className="mt-1 text-sm text-ink-70">
            {t("profile.holodori.lead")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold">
            {t("profile.holodori.gameId")}
            <input
              value={gameId}
              onChange={(event) => setGameId(event.target.value)}
              className={inputClass}
              placeholder={t("profile.holodori.gameIdPlaceholder")}
              autoComplete="off"
              maxLength={64}
            />
            <span className="mt-1 block text-xs font-normal text-ink-40">
              {t("profile.holodori.gameIdHint")}
            </span>
          </label>
          <div className="mt-3">
            <Button type="submit" disabled={savingGameId}>
              {savingGameId ? t("profile.saving") : t("profile.holodori.save")}
            </Button>
          </div>
        </div>

        <div className="rounded-[6px] border border-ink-15 bg-surface">
          <button
            type="button"
            onClick={openOshiModal}
            className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-base/60"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold">
                {t("profile.holodori.oshi")}
              </span>
              <span
                className="mt-0.5 block text-xs font-semibold text-ink-40"
                aria-live="polite"
              >
                {savingOshi
                  ? t("profile.saving")
                  : t("profile.holodori.selectedCount", {
                      count: oshiIds.length,
                    })}
              </span>
            </span>
            <span className="shrink-0 text-xs font-semibold text-ink-40">
              {t("profile.holodori.oshiChoose")} →
            </span>
          </button>

          <div className="border-t border-ink-15 px-4 py-3">
            {selectedOshis.length ? (
              <ul className="flex flex-wrap gap-2">
                {selectedOshis.map((member) => (
                  <li
                    key={member.id}
                    className="inline-flex items-center gap-1.5 rounded-[6px] border py-1.5 pr-1 pl-2"
                    style={{
                      borderColor: member.color,
                      backgroundColor: `color-mix(in srgb, ${member.color} 12%, var(--surface))`,
                    }}
                  >
                    <OshiBadge
                      member={member}
                      className="h-7 w-7 shrink-0 rounded-[4px]"
                    />
                    <span className="text-[13px] font-semibold leading-tight">
                      {member.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleOshi(member.id)}
                      aria-label={t("profile.holodori.removeOshi", {
                        name: member.name,
                      })}
                      title={t("profile.holodori.removeOshi", {
                        name: member.name,
                      })}
                      className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[4px] text-ink-40 transition-colors hover:bg-ink-08 hover:text-ink"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={openOshiModal}
                className="w-full cursor-pointer text-left text-sm text-ink-40 hover:text-ink-70"
              >
                {t("profile.holodori.oshiEmpty")}
              </button>
            )}
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-accent-600">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-ink-70" aria-live="polite">
            {message}
          </p>
        ) : null}
      </form>

      <section className="mt-10">
        <h3 className="text-lg font-semibold">
          {t("profile.holodori.playedTitle")}
        </h3>
        <p className="mt-1 text-sm text-ink-70">
          {t("profile.holodori.playedLead")}
        </p>

        {playedLoading ? (
          <p className="mt-4 text-sm text-ink-70">
            {t("profile.holodori.playedLoading")}
          </p>
        ) : null}
        {playedError ? (
          <p role="alert" className="mt-4 text-sm text-accent-600">
            {playedError}
          </p>
        ) : null}

        {!playedLoading && !playedError ? (
          playedWith.length ? (
            <div className="mt-4 overflow-x-auto rounded-[6px] border border-ink-15">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-08 bg-surface text-ink-70">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {t("profile.holodori.colPlayer")}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {t("profile.holodori.colGameId")}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {t("profile.holodori.colLastPlayed")}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      <span className="sr-only">
                        {t("profile.friends.colAction")}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {playedWith.map((person) => {
                    const name =
                      person.display_name?.trim() ||
                      person.username?.trim() ||
                      t("sessions.unknownCreator");
                    const inGameId = person.holodori_game_id?.trim() || "—";
                    return (
                      <tr
                        key={person.id}
                        className="border-b border-ink-08 last:border-b-0"
                      >
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <AvatarImage
                              src={person.avatar_url}
                              className="h-7 w-7 rounded-full object-cover"
                              fallback={
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">
                                  {name.charAt(0).toUpperCase()}
                                </span>
                              }
                            />
                            <span className="font-medium">{name}</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 font-[family-name:var(--font-ibm-plex-mono)] text-ink-70">
                          {inGameId}
                        </td>
                        <td className="px-3.5 py-2.5 text-ink-70">
                          {person.last_played_at
                            ? new Date(person.last_played_at).toLocaleString(
                                locale,
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <FriendActionControls
                            userId={person.id}
                            status={person.friendship_status ?? "none"}
                            busy={friendBusyId === person.id}
                            labels={{
                              add: t("sessions.addFriend"),
                              pending: t("sessions.friendPending"),
                              accept: t("sessions.acceptFriend"),
                              decline: t("sessions.declineFriend"),
                              remove: t("sessions.removeFriend"),
                              cancel: t("sessions.cancelFriendRequest"),
                            }}
                            onBusy={(busy) =>
                              setFriendBusyId(busy ? person.id : null)
                            }
                            onChange={(next) => onFriendStatus(person, next)}
                            onError={setPlayedError}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-70">
              {t("profile.holodori.playedEmpty")}
            </p>
          )
        ) : null}
      </section>

      <dialog
        ref={dialogRef}
        onClick={onBackdropClick}
        className="m-auto w-[min(96vw,720px)] max-h-[min(88vh,820px)] rounded-[8px] border border-ink-15 bg-base p-0 text-ink shadow-2xl backdrop:bg-black/55"
        aria-labelledby="holodori-oshi-title"
      >
        <div className="flex max-h-[min(88vh,820px)] flex-col">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-15 px-5 py-4">
            <div className="min-w-0">
              <h2 id="holodori-oshi-title" className="text-xl font-semibold">
                {t("profile.holodori.oshi")}
              </h2>
              <p className="mt-1 text-sm text-ink-70">
                {t("profile.holodori.oshiHint")}
              </p>
              <p
                className="mt-1 text-xs font-semibold text-ink-40"
                aria-live="polite"
              >
                {savingOshi
                  ? t("profile.saving")
                  : t("profile.holodori.selectedCount", {
                      count: oshiIds.length,
                    })}
              </p>
            </div>
            <button
              type="button"
              onClick={closeOshiModal}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-ink-15 bg-transparent text-xl text-ink-70 hover:border-ink hover:text-ink"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[14rem] flex-1 text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
                {t("profile.holodori.search")}
                <span className="relative mt-1.5 block">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("profile.holodori.searchPlaceholder")}
                    className={`${inputClass} mt-0 pr-10`}
                    autoComplete="off"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label={t("profile.holodori.clearSearch")}
                      title={t("profile.holodori.clearSearch")}
                      className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[4px] text-lg leading-none text-ink-40 hover:bg-ink-08 hover:text-ink"
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              </label>

              <div
                className="inline-flex overflow-hidden rounded-[6px] border border-ink-15"
                role="group"
                aria-label={t("profile.holodori.viewMode")}
              >
                <button
                  type="button"
                  onClick={() => setView("card")}
                  aria-pressed={view === "card"}
                  aria-label={t("profile.holodori.viewCards")}
                  title={t("profile.holodori.viewCards")}
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
                  onClick={() => setView("list")}
                  aria-pressed={view === "list"}
                  aria-label={t("profile.holodori.viewList")}
                  title={t("profile.holodori.viewList")}
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

            {visibleCount === 0 ? (
              <div className="rounded-[6px] border border-dashed border-ink-15 bg-surface px-4 py-10 text-center text-sm text-ink-70">
                {t("profile.holodori.noMatch")}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGenerations.map((generation) => (
                  <section key={generation.id}>
                    <h5 className="mb-2 text-xs font-semibold tracking-[0.04em] text-ink-40 uppercase">
                      {generation.label}
                    </h5>
                    <div
                      className={
                        view === "list"
                          ? "grid gap-2"
                          : "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
                      }
                    >
                      {generation.members.map((member) =>
                        renderMember(member, generation),
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </dialog>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
        >
          <div className="rounded-[6px] border border-ink-15 bg-btn-dark px-4 py-2.5 text-sm font-semibold !text-btn-dark-fg shadow-lg">
            {toast === "removed"
              ? t("profile.holodori.toastRemoved")
              : t("profile.holodori.toastSaved")}
          </div>
        </div>
      ) : null}
    </>
  );
}
