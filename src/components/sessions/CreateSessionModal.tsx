"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizeGame } from "@/lib/i18n/content";
import { LOCALES, isLocaleCode, type LocaleCode } from "@/lib/i18n/locales";
import type { Game, Session, SessionTitleSuggestion } from "@/lib/types";

type Props = {
  games: Game[];
  titleSuggestions: SessionTitleSuggestion[];
  openOnMount?: boolean;
  defaultGameSlug?: string;
  triggerLabel?: string;
  triggerClassName?: string;
  /** When set, modal edits this session instead of creating. */
  editingSession?: Session | null;
  /** Controlled open (used with editingSession / hideTrigger). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (session: Session) => void;
  /** Hide the default trigger button (parent opens via `open`). */
  hideTrigger?: boolean;
};

function resolveGameId(games: Game[], defaultGameSlug?: string) {
  if (defaultGameSlug) {
    const match = games.find((game) => game.slug === defaultGameSlug);
    if (match) return match.id;
  }
  return games[0]?.id ?? "";
}

function toLocalDateTimeValue(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function CreateSessionModal({
  games,
  titleSuggestions,
  openOnMount = false,
  defaultGameSlug,
  triggerLabel = "Create session",
  triggerClassName,
  editingSession = null,
  open,
  onOpenChange,
  onSaved,
  hideTrigger = false,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { locale: uiLocale, t } = useLocale();
  const isEditing = Boolean(editingSession);
  const [gameId, setGameId] = useState(() =>
    resolveGameId(games, defaultGameSlug),
  );
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [sessionLocale, setSessionLocale] = useState<LocaleCode>(uiLocale);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minCapacity = Math.max(
    2,
    Number(editingSession?.registered_count ?? 0),
  );

  function fillFromSession(session: Session) {
    setGameId(session.game_id || resolveGameId(games, defaultGameSlug));
    setTitle(session.title);
    setStartsAt(toLocalDateTimeValue(session.starts_at));
    setCapacity(String(session.capacity));
    setSessionLocale(
      isLocaleCode(session.locale) ? session.locale : uiLocale,
    );
  }

  function resetCreateForm() {
    setGameId(resolveGameId(games, defaultGameSlug));
    setTitle("");
    setStartsAt("");
    setCapacity("40");
    setSessionLocale(uiLocale);
  }

  useEffect(() => {
    if (!editingSession) {
      setGameId(resolveGameId(games, defaultGameSlug));
    }
  }, [games, defaultGameSlug, editingSession]);

  useEffect(() => {
    if (!editingSession) setSessionLocale(uiLocale);
  }, [uiLocale, editingSession]);

  useEffect(() => {
    if (openOnMount && !hideTrigger) dialogRef.current?.showModal();
  }, [openOnMount, hideTrigger]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || open === undefined) return;
    if (open) {
      setError(null);
      if (editingSession) fillFromSession(editingSession);
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill when open flips
  }, [open, editingSession?.id]);

  function openModal() {
    setError(null);
    if (editingSession) {
      fillFromSession(editingSession);
    } else {
      resetCreateForm();
    }
    onOpenChange?.(true);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    if (submitting) return;
    dialogRef.current?.close();
    onOpenChange?.(false);
  }

  function onDialogClose() {
    onOpenChange?.(false);
  }

  function onBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) closeModal();
  }

  function suggestTitle() {
    const selectedSlug = games.find((game) => game.id === gameId)?.slug;
    const relevant = titleSuggestions.filter(
      (suggestion) =>
        !suggestion.game_slug || suggestion.game_slug === selectedSlug,
    );
    const pool = relevant.length ? relevant : titleSuggestions;
    const currentBaseTitle = title.replace(/\s\d{4}$/, "");
    const alternatives = pool.filter(
      (suggestion) => suggestion.title !== currentBaseTitle,
    );
    const choices = alternatives.length ? alternatives : pool;
    const suggestion = choices[Math.floor(Math.random() * choices.length)];

    if (suggestion) {
      const suffix = String(Math.floor(Math.random() * 10_000)).padStart(4, "0");
      setTitle(`${suggestion.title} ${suffix}`);
    }
  }

  function setToNow() {
    const date = new Date(Date.now() + 5 * 60 * 1000);
    date.setSeconds(0, 0);
    const localDateTime = new Date(
      date.getTime() - date.getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 16);
    setStartsAt(localDateTime);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const date = new Date(startsAt);
    if (!startsAt || Number.isNaN(date.getTime())) {
      setError("Choose a valid date and time.");
      return;
    }
    if (date.getTime() <= Date.now()) {
      setError("The session must be scheduled in the future.");
      return;
    }

    const capacityNumber = Number(capacity);
    if (
      !Number.isInteger(capacityNumber) ||
      capacityNumber < minCapacity ||
      capacityNumber > 500
    ) {
      setError(
        minCapacity > 2
          ? `Capacity must be between ${minCapacity} and 500.`
          : "Capacity must be a whole number between 2 and 500.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        isEditing ? `/api/sessions/${editingSession!.id}` : "/api/sessions",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game_id: gameId,
            title: title.trim(),
            starts_at: date.toISOString(),
            capacity: capacityNumber,
            locale: sessionLocale,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.push(
            `/login?next=${encodeURIComponent("/sessions?create=true")}`,
          );
          return;
        }
        throw new Error(
          data.error ??
            (isEditing
              ? "Could not update the session."
              : "Could not create the session."),
        );
      }

      const saved = data.session as Session | undefined;
      if (!isEditing) resetCreateForm();
      dialogRef.current?.close();
      onOpenChange?.(false);
      if (saved) onSaved?.(saved);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEditing
            ? "Could not update the session."
            : "Could not create the session.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!hideTrigger ? (
        triggerClassName ? (
          <button
            type="button"
            onClick={openModal}
            disabled={!games.length}
            className={triggerClassName}
          >
            {triggerLabel}
          </button>
        ) : (
          <Button onClick={openModal} disabled={!games.length}>
            {triggerLabel}
          </Button>
        )
      ) : null}

      <dialog
        ref={dialogRef}
        onClick={onBackdropClick}
        onClose={onDialogClose}
        className="m-auto w-[min(92vw,520px)] rounded-[8px] border border-ink-15 bg-base p-0 text-ink shadow-2xl backdrop:bg-black/55"
        aria-labelledby="create-session-title"
      >
        <form onSubmit={onSubmit} className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 id="create-session-title" className="text-2xl">
                {isEditing ? t("sessions.editTitle") : "Schedule a session"}
              </h2>
              <p className="mt-1 text-sm text-ink-70">
                {isEditing
                  ? t("sessions.editLead")
                  : "Set up the next community game night. Tag the language of the title — we keep your original wording."}
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-ink-15 bg-transparent text-xl text-ink-70 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <label className="block text-sm font-medium">
              Game
              <select
                required
                value={gameId}
                onChange={(event) => setGameId(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {localizeGame(game, uiLocale).title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Title language
              <select
                required
                value={sessionLocale}
                onChange={(event) =>
                  setSessionLocale(event.target.value as LocaleCode)
                }
                className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              >
                {LOCALES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nativeLabel} ({item.label})
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="session-title" className="text-sm font-medium">
                  Session title
                </label>
                <button
                  type="button"
                  onClick={suggestTitle}
                  disabled={!titleSuggestions.length}
                  className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-accent-600 hover:text-accent-700 disabled:cursor-not-allowed disabled:text-ink-40"
                >
                  ✦ Suggest random title
                </button>
              </div>
              <input
                id="session-title"
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Friday night speedrun"
                className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="session-starts-at"
                  className="text-sm font-medium"
                >
                  Date and time
                </label>
                <button
                  type="button"
                  onClick={setToNow}
                  className="cursor-pointer border-0 bg-transparent p-0 text-xs font-semibold text-accent-600 hover:text-accent-700"
                >
                  Schedule now
                </button>
              </div>
              <input
                id="session-starts-at"
                required
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              />
              <span className="mt-1 block text-xs font-normal text-ink-40">
                Uses your local time zone. “Schedule now” starts five minutes
                from now.
              </span>
            </div>

            <label className="block text-sm font-medium">
              Capacity
              <input
                required
                type="number"
                min={minCapacity}
                max={500}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              />
              {minCapacity > 2 ? (
                <span className="mt-1 block text-xs font-normal text-ink-40">
                  At least {minCapacity} (current signups).
                </span>
              ) : null}
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-accent-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !games.length}>
              {submitting
                ? isEditing
                  ? t("sessions.savingEdit")
                  : "Creating…"
                : isEditing
                  ? t("sessions.saveEdit")
                  : "Create session"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
