"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizeGame } from "@/lib/i18n/content";
import { gameCardImage } from "@/lib/games/images";
import { LOCALES } from "@/lib/i18n/locales";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import {
  EditIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/sessions/SessionActionIcons";
import { shareSessionInvite } from "@/lib/sessions/share";
import type { Game, Session, SessionTitleSuggestion } from "@/lib/types";

function formatCountdown(ms: number, startingNow: string): string {
  if (ms <= 0) return startingNow;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Countdown({
  startsAt,
  startingNow,
}: {
  startsAt: string;
  startingNow: string;
}) {
  const [label, setLabel] = useState("—");

  useEffect(() => {
    const tick = () =>
      setLabel(
        formatCountdown(
          new Date(startsAt).getTime() - Date.now(),
          startingNow,
        ),
      );
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [startsAt, startingNow]);

  return <span className="font-semibold text-accent-600">{label}</span>;
}

export function sessionCreatorLabel(
  session: Session,
  unknownCreator: string,
) {
  if (!session.creator_id) return unknownCreator;
  return session.creator?.username?.trim() || unknownCreator;
}

type Props = {
  session: Session;
  past?: boolean;
  view?: "card" | "list";
  signedIn?: boolean;
  canDelete?: boolean;
  joined?: boolean;
  registeredCount?: number;
  games?: Game[];
  titleSuggestions?: SessionTitleSuggestion[];
  onOpen?: () => void;
  onJoinedChange?: (next: {
    joined: boolean;
    registered_count: number;
  }) => void;
  onDeleted?: () => void;
  onUpdated?: (session: Session) => void;
};

export function SessionCard({
  session,
  past = false,
  view = "card",
  signedIn = false,
  canDelete = false,
  joined = false,
  registeredCount,
  games = [],
  titleSuggestions = [],
  onOpen,
  onJoinedChange,
  onDeleted,
  onUpdated,
}: Props) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const unknownCreator = t("sessions.unknownCreator");
  const localizedGame = localizeGame(session.game, locale);
  const sessionLocaleMeta =
    LOCALES.find((item) => item.code === session.locale) ??
    LOCALES.find((item) => item.code === "en")!;
  const platform =
    session.game?.slug === "holodori"
      ? t("nav.holodori")
      : session.game?.platform === "roblox"
        ? t("common.roblox")
        : session.game?.platform === "external"
          ? t("common.external")
          : session.game?.platform
            ? session.game.platform.charAt(0).toUpperCase() +
              session.game.platform.slice(1)
            : t("common.game");

  const image = gameCardImage(session.game?.slug);
  const coverTitle =
    session.game?.slug === "holodori"
      ? t("nav.holodori")
      : localizedGame.title || t("common.experience");
  const count = registeredCount ?? session.registered_count;
  const isFull = count >= session.capacity && !joined;
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [shareNoteOpaque, setShareNoteOpaque] = useState(false);
  const canEdit = !past && canDelete && games.length > 0;

  useEffect(() => {
    if (!shareNote) {
      setShareNoteOpaque(false);
      return;
    }
    setShareNoteOpaque(true);
    const fadeTimer = window.setTimeout(() => setShareNoteOpaque(false), 3000);
    const clearTimer = window.setTimeout(() => setShareNote(null), 3400);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [shareNote]);

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  async function joinOrDrop(event: MouseEvent) {
    stop(event);
    if (past) return;

    if (!signedIn) {
      router.push(
        `/login?next=${encodeURIComponent(`/sessions?session=${session.id}`)}`,
      );
      return;
    }

    setBusy(true);
    setShareNote(null);
    try {
      const response = await fetch(`/api/sessions/${session.id}/rsvp`, {
        method: joined ? "DELETE" : "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || t("sessions.actionError"));
      }
      onJoinedChange?.({
        joined: Boolean(payload.viewer_joined ?? !joined),
        registered_count: Number(
          payload.session?.registered_count ??
            payload.registered_count ??
            count,
        ),
      });
      router.refresh();
    } catch (err) {
      setShareNote(
        err instanceof Error ? err.message : t("sessions.actionError"),
      );
    } finally {
      setBusy(false);
    }
  }

  async function share(event: MouseEvent) {
    stop(event);
    setShareNote(null);
    try {
      await shareSessionInvite({
        session,
        gameTitle:
          session.game?.slug === "holodori"
            ? t("nav.holodori")
            : localizedGame.title || t("common.experience"),
        hostName: sessionCreatorLabel(session, unknownCreator),
        whenLabel: new Date(session.starts_at).toLocaleString(locale, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }),
        joinLabel: t("sessions.shareJoinLink"),
        imageUrl: image,
      });
      setShareNote(t("sessions.shareCopied"));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShareNote(t("sessions.shareFailed"));
    }
  }

  async function removeSession(event: MouseEvent) {
    stop(event);
    if (past || !canDelete) return;
    if (!window.confirm(t("sessions.deleteConfirm"))) return;

    setBusy(true);
    setShareNote(null);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || t("sessions.actionError"));
      }
      onDeleted?.();
      router.refresh();
    } catch (err) {
      setShareNote(
        err instanceof Error ? err.message : t("sessions.actionError"),
      );
    } finally {
      setBusy(false);
    }
  }

  const whenLabel = new Date(session.starts_at).toLocaleString(locale, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const actions = (
    <div className="flex flex-wrap gap-2" onClick={stop}>
      {!past ? (
        <Button
          type="button"
          variant={joined ? "outline" : "primary"}
          size="sm"
          disabled={busy || isFull}
          onClick={joinOrDrop}
        >
          {busy
            ? t("sessions.working")
            : joined
              ? t("sessions.drop")
              : isFull
                ? t("sessions.full")
                : t("sessions.join")}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="!px-2.5"
        onClick={share}
        aria-label={t("sessions.share")}
        title={t("sessions.share")}
      >
        <ShareIcon />
      </Button>
      {canEdit ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="!px-2.5"
          disabled={busy}
          onClick={(event) => {
            stop(event);
            setEditing(true);
          }}
          aria-label={t("sessions.edit")}
          title={t("sessions.edit")}
        >
          <EditIcon />
        </Button>
      ) : null}
      {!past && canDelete ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="!px-2.5"
          disabled={busy}
          onClick={removeSession}
          aria-label={t("sessions.delete")}
          title={t("sessions.delete")}
        >
          <TrashIcon />
        </Button>
      ) : null}
    </div>
  );

  const editModal = canEdit ? (
    <CreateSessionModal
      games={games}
      titleSuggestions={titleSuggestions}
      editingSession={session}
      open={editing}
      onOpenChange={setEditing}
      hideTrigger
      onSaved={(updated) => {
        onUpdated?.(updated);
        setEditing(false);
      }}
    />
  ) : null;

  const interactiveClass = onOpen
    ? "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
    : "";

  if (view === "list") {
    return (
      <>
      <div
        role={onOpen ? "button" : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen}
        onKeyDown={
          onOpen
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpen();
                }
              }
            : undefined
        }
        className={`group flex flex-col gap-3 rounded-[6px] border border-ink-15 bg-surface p-3 text-left transition-[border-color,box-shadow] duration-300 hover:border-accent-500 hover:shadow-[0_0_0_1px_var(--accent-500)] sm:flex-row sm:items-center sm:gap-4 ${interactiveClass}`}
      >
        <div className="relative h-16 w-full shrink-0 overflow-hidden rounded-[4px] sm:h-14 sm:w-20">
          {image ? (
            <Image
              src={image}
              alt={coverTitle}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
          ) : (
            <div
              className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
              style={{
                background:
                  "repeating-linear-gradient(135deg, var(--accent-100) 0 14px, var(--accent-50) 14px 28px)",
              }}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge>
              {platform} · {localizedGame.title || t("common.experience")}
            </Badge>
            <Badge>{sessionLocaleMeta.code.toUpperCase()}</Badge>
            {joined && !past ? (
              <Badge>{t("sessions.youJoined")}</Badge>
            ) : null}
          </div>
          <div className="mt-1 font-[family-name:var(--font-space-grotesk)] text-[16px] font-bold">
            {session.title}
          </div>
          <p className="mt-0.5 text-xs text-ink-40">
            {t("sessions.hostedBy")}{" "}
            {sessionCreatorLabel(session, unknownCreator)}
            {" · "}
            <span className="font-[family-name:var(--font-ibm-plex-mono)]">
              {whenLabel}
            </span>
            {!past ? (
              <>
                {" · "}
                {t("sessions.startsIn")}{" "}
                <Countdown
                  startsAt={session.starts_at}
                  startingNow={t("sessions.startingNow")}
                />
              </>
            ) : null}
            {" · "}
            {count} / {session.capacity} {t("sessions.registered")}
          </p>
          {shareNote ? (
            <p
              className={`mt-1 text-xs text-ink-70 transition-opacity duration-300 ${
                shareNoteOpaque ? "opacity-100" : "opacity-0"
              }`}
              aria-live="polite"
            >
              {shareNote}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 sm:ml-auto">{actions}</div>
      </div>
      {editModal}
      </>
    );
  }

  return (
    <>
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={`group overflow-hidden rounded-[6px] border border-ink-15 bg-surface text-left transition-[border-color,box-shadow] duration-300 hover:border-accent-500 hover:shadow-[0_0_0_1px_var(--accent-500)] ${interactiveClass}`}
    >
      {image ? (
        <div className="relative h-[130px] overflow-hidden">
          <Image
            src={image}
            alt={coverTitle}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
      ) : (
        <div className="relative h-[130px] overflow-hidden">
          <div
            className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110"
            style={{
              background:
                "repeating-linear-gradient(135deg, var(--accent-100) 0 14px, var(--accent-50) 14px 28px)",
            }}
          />
        </div>
      )}
      <div className="p-[18px]">
        <div className="flex flex-wrap gap-1.5">
          <Badge>
            {platform} · {localizedGame.title || t("common.experience")}
          </Badge>
          <Badge>{sessionLocaleMeta.code.toUpperCase()}</Badge>
          {joined && !past ? (
            <Badge>{t("sessions.youJoined")}</Badge>
          ) : null}
        </div>
        <div className="mt-1.5 mb-1 font-[family-name:var(--font-space-grotesk)] text-[17px] font-bold">
          {session.title}
        </div>
        <p className="mb-3 text-xs text-ink-40">
          {t("sessions.hostedBy")} {sessionCreatorLabel(session, unknownCreator)}
        </p>
        <div className="mb-3.5 flex items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs text-ink-40">
          {whenLabel}
          {!past && (
            <>
              {" "}
              · {t("sessions.startsIn")}{" "}
              <Countdown
                startsAt={session.starts_at}
                startingNow={t("sessions.startingNow")}
              />
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-ink-40">
            {count} / {session.capacity} {t("sessions.registered")}
          </span>
          {actions}
        </div>
        {shareNote ? (
          <p
            className={`mt-2 text-xs text-ink-70 transition-opacity duration-300 ${
              shareNoteOpaque ? "opacity-100" : "opacity-0"
            }`}
            aria-live="polite"
          >
            {shareNote}
          </p>
        ) : null}
      </div>
    </div>
    {editModal}
    </>
  );
}
