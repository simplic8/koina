"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizeGame } from "@/lib/i18n/content";
import { gameCardImage } from "@/lib/games/images";
import { LOCALES } from "@/lib/i18n/locales";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";
import { FriendActionControls } from "@/components/friends/FriendActionControls";
import {
  EditIcon,
  ShareIcon,
  TrashIcon,
} from "@/components/sessions/SessionActionIcons";
import { shareSessionInvite } from "@/lib/sessions/share";
import type {
  FriendshipStatus,
  Game,
  Session,
  SessionDetail,
  SessionParticipant,
  SessionTitleSuggestion,
} from "@/lib/types";
import { sessionCreatorLabel } from "@/components/sessions/SessionCard";

type Props = {
  session: Session | null;
  open: boolean;
  signedIn: boolean;
  past?: boolean;
  canDelete?: boolean;
  viewerId?: string | null;
  joined: boolean;
  registeredCount: number;
  games?: Game[];
  titleSuggestions?: SessionTitleSuggestion[];
  onClose: () => void;
  onJoinedChange: (next: {
    joined: boolean;
    registered_count: number;
  }) => void;
  onDeleted?: () => void;
  onUpdated?: (session: Session) => void;
};

export function SessionDetailModal({
  session,
  open,
  signedIn,
  past = false,
  canDelete = false,
  viewerId = null,
  joined,
  registeredCount,
  games = [],
  titleSuggestions = [],
  onClose,
  onJoinedChange,
  onDeleted,
  onUpdated,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { t, locale } = useLocale();
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [shareNoteOpaque, setShareNoteOpaque] = useState(false);
  const [editing, setEditing] = useState(false);
  const [friendBusyId, setFriendBusyId] = useState<string | null>(null);
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && session) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, session]);

  useEffect(() => {
    if (!open) setEditing(false);
  }, [open]);

  useEffect(() => {
    if (!open || !session) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setShareNote(null);

    void (async () => {
      try {
        const response = await fetch(`/api/sessions/${session.id}`);
        const payload = (await response.json()) as SessionDetail & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || t("sessions.detailLoadError"));
        }
        if (cancelled) return;
        setParticipants(payload.participants);
        onJoinedChange({
          joined: payload.viewer_joined,
          registered_count: payload.session.registered_count,
        });
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : t("sessions.detailLoadError"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally only reload when the opened session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, session?.id]);

  function closeModal() {
    if (busy) return;
    onClose();
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeModal();
  }

  async function applyParticipantChange(payload: {
    participants?: SessionParticipant[];
    viewer_joined?: boolean;
    session?: { registered_count?: number };
    registered_count?: number;
  }) {
    if (payload.participants) setParticipants(payload.participants);
    onJoinedChange({
      joined: Boolean(payload.viewer_joined),
      registered_count: Number(
        payload.session?.registered_count ??
          payload.registered_count ??
          registeredCount,
      ),
    });
    router.refresh();
  }

  async function joinOrDrop() {
    if (!session || past) return;
    if (!signedIn) {
      router.push(
        `/login?next=${encodeURIComponent(`/sessions?session=${session.id}`)}`,
      );
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${session.id}/rsvp`, {
        method: joined ? "DELETE" : "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || t("sessions.actionError"));
      }
      await applyParticipantChange({
        ...payload,
        viewer_joined: Boolean(payload.viewer_joined ?? !joined),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sessions.actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function removeParticipant(userId: string) {
    if (!session || past) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/sessions/${session.id}/participants/${userId}`,
        { method: "DELETE" },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || t("sessions.actionError"));
      }
      await applyParticipantChange(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sessions.actionError"));
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!session) return;
    const localizedGame = localizeGame(session.game, locale);
    const coverImage = gameCardImage(session.game?.slug);
    setShareNote(null);
    try {
      await shareSessionInvite({
        session,
        gameTitle:
          session.game?.slug === "holodori"
            ? t("nav.holodori")
            : localizedGame.title || t("common.experience"),
        hostName: sessionCreatorLabel(session, t("sessions.unknownCreator")),
        whenLabel: new Date(session.starts_at).toLocaleString(locale, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }),
        joinLabel: t("sessions.shareJoinLink"),
        imageUrl: coverImage,
      });
      setShareNote(t("sessions.shareCopied"));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShareNote(t("sessions.shareFailed"));
    }
  }

  async function removeSession() {
    if (!session || past || !canDelete) return;
    if (!window.confirm(t("sessions.deleteConfirm"))) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || t("sessions.actionError"));
      }
      onDeleted?.();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sessions.actionError"));
    } finally {
      setBusy(false);
    }
  }

  if (!session) return null;

  const localizedGame = localizeGame(session.game, locale);
  const sessionLocaleMeta =
    LOCALES.find((item) => item.code === session.locale) ??
    LOCALES.find((item) => item.code === "en")!;
  const image = gameCardImage(session.game?.slug);
  const isFull = registeredCount >= session.capacity && !joined;
  const coverTitle =
    session.game?.slug === "holodori"
      ? t("nav.holodori")
      : localizedGame.title || t("common.experience");

  return (
    <>
    <dialog
      ref={dialogRef}
      onClick={onBackdropClick}
      onClose={onClose}
      className="m-auto w-[min(92vw,560px)] rounded-[8px] border border-ink-15 bg-base p-0 text-ink shadow-2xl backdrop:bg-black/55"
      aria-labelledby="session-detail-title"
    >
      <div className="overflow-hidden">
        {image ? (
          <div className="relative h-[160px]">
            <Image
              src={image}
              alt={coverTitle}
              fill
              sizes="560px"
              className="object-cover"
            />
          </div>
        ) : (
          <div
            className="h-[120px]"
            style={{
              background:
                "repeating-linear-gradient(135deg, var(--accent-100) 0 14px, var(--accent-50) 14px 28px)",
            }}
          />
        )}

        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <Badge>
                  {coverTitle}
                </Badge>
                <Badge>{sessionLocaleMeta.code.toUpperCase()}</Badge>
              </div>
              <h2 id="session-detail-title" className="text-2xl">
                {session.title}
              </h2>
              <p className="mt-1 text-sm text-ink-70">
                {t("sessions.hostedBy")}{" "}
                {sessionCreatorLabel(session, t("sessions.unknownCreator"))}
              </p>
              <p className="mt-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs text-ink-40">
                {new Date(session.starts_at).toLocaleString(locale, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </p>
              <p className="mt-2 text-sm text-ink-70">
                {registeredCount} / {session.capacity}{" "}
                {t("sessions.registered")}
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              disabled={busy}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-ink-15 bg-transparent text-xl text-ink-70 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t("sessions.close")}
            >
              ×
            </button>
          </div>

          <div className="mb-5">
            <h3 className="mb-2 text-sm font-semibold tracking-[0.04em] text-ink-40 uppercase">
              {t("sessions.participants")}
            </h3>
            {loading ? (
              <p className="text-sm text-ink-70">{t("sessions.loadingParticipants")}</p>
            ) : participants.length ? (
              <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                {participants.map((person) => {
                  const profileName =
                    person.display_name?.trim() ||
                    person.username?.trim() ||
                    t("sessions.unknownCreator");
                  const gameId = person.holodori_game_id?.trim();
                  const isHolodori = session.game?.slug === "holodori";
                  const name =
                    isHolodori && gameId
                      ? `${profileName} (${gameId})`
                      : profileName;
                  const isSelf = Boolean(viewerId && person.id === viewerId);
                  const masked = !joined && !canDelete && !isSelf;
                  const canRemove =
                    !past && (isSelf || canDelete) && !busy;
                  const avatarFallback = masked
                    ? "•"
                    : profileName.charAt(0).toUpperCase();
                  return (
                    <li
                      key={person.id}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <AvatarImage
                        src={masked ? null : person.avatar_url}
                        className="h-7 w-7 rounded-full object-cover"
                        fallback={
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">
                            {avatarFallback}
                          </span>
                        }
                      />
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {signedIn && !masked && !isSelf ? (
                          <FriendActionControls
                            userId={person.id}
                            status={
                              (person.friendship_status as FriendshipStatus) ||
                              (person.is_friend ? "friends" : "none")
                            }
                            busy={friendBusyId === person.id}
                            disabled={busy}
                            labels={{
                              add: t("sessions.addFriend"),
                              pending: t("sessions.friendPending"),
                              accept: t("sessions.acceptFriend"),
                              decline: t("sessions.declineFriend"),
                              remove: t("sessions.removeFriend"),
                              cancel: t("sessions.cancelFriendRequest"),
                            }}
                            onBusy={(next) =>
                              setFriendBusyId(next ? person.id : null)
                            }
                            onChange={(next) => {
                              setParticipants((prev) =>
                                prev.map((item) =>
                                  item.id === person.id
                                    ? {
                                        ...item,
                                        friendship_status: next,
                                        is_friend: next === "friends",
                                      }
                                    : item,
                                ),
                              );
                            }}
                            onError={setError}
                          />
                        ) : null}
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() => removeParticipant(person.id)}
                            disabled={busy}
                            aria-label={
                              isSelf
                                ? t("sessions.leaveParticipant")
                                : t("sessions.removeParticipant", { name })
                            }
                            title={
                              isSelf
                                ? t("sessions.leaveParticipant")
                                : t("sessions.removeParticipant", { name })
                            }
                            className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-[4px] text-base leading-none text-ink-40 transition-colors hover:bg-ink-08 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-ink-70">{t("sessions.noParticipants")}</p>
            )}
          </div>

          {error ? (
            <p role="alert" className="mb-3 text-sm text-accent-600">
              {error}
            </p>
          ) : null}
          {shareNote ? (
            <p
              className={`mb-3 text-sm text-ink-70 transition-opacity duration-300 ${
                shareNoteOpaque ? "opacity-100" : "opacity-0"
              }`}
              aria-live="polite"
            >
              {shareNote}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2.5">
            {!past ? (
              <Button
                type="button"
                variant={joined ? "outline" : "primary"}
                onClick={joinOrDrop}
                disabled={busy || isFull}
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
              className="!px-3"
              onClick={share}
              disabled={busy}
              aria-label={t("sessions.share")}
              title={t("sessions.share")}
            >
              <ShareIcon />
            </Button>
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                className="!px-3"
                onClick={() => setEditing(true)}
                disabled={busy}
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
                className="!px-3"
                onClick={removeSession}
                disabled={busy}
                aria-label={t("sessions.delete")}
                title={t("sessions.delete")}
              >
                <TrashIcon />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>

      {canEdit ? (
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
      ) : null}
    </>
  );
}
