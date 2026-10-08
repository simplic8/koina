"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SessionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  is_live: boolean;
  created_at: string;
  updated_at: string;
};

type Props = {
  sessions: SessionRow[];
  isAdmin: boolean;
};

export function ForumSessionList({ sessions, isAdmin }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(sessions);

  useEffect(() => {
    setRows(sessions);
  }, [sessions]);

  useEffect(() => {
    if (!sessions.length) return;
    let cancelled = false;

    async function pullLive() {
      try {
        const results = await Promise.all(
          sessions.map(async (session) => {
            const res = await fetch(
              `/api/forum/sessions/${session.id}/sync`,
              { cache: "no-store" },
            );
            if (!res.ok) return null;
            const data = (await res.json()) as { is_live?: boolean };
            return typeof data.is_live === "boolean"
              ? { id: session.id, is_live: data.is_live }
              : null;
          }),
        );
        if (cancelled) return;
        setRows((prev) =>
          prev.map((row) => {
            const hit = results.find((r) => r && r.id === row.id);
            return hit ? { ...row, is_live: hit.is_live } : row;
          }),
        );
      } catch {
        // ignore transient errors
      }
    }

    void pullLive();
    const id = window.setInterval(pullLive, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessions]);

  async function onDelete(session: SessionRow) {
    if (!isAdmin || busyId) return;
    const ok = window.confirm(
      `Delete “${session.title}”? This removes the deck and all activity responses.`,
    );
    if (!ok) return;

    setBusyId(session.id);
    setError(null);
    try {
      const res = await fetch(`/api/forum/sessions/${session.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not delete session.");
      setRows((prev) => prev.filter((item) => item.id !== session.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete session.");
    } finally {
      setBusyId(null);
    }
  }

  if (!rows.length) {
    return (
      <p className="text-sm text-ink-70">
        {isAdmin
          ? "No sessions yet. Upload an HTML deck above."
          : "No forum sessions yet. Check back when a host goes live."}
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <p className="mb-3 text-sm text-accent-600" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {rows.map((session) => (
          <li
            key={session.id}
            className="rounded-[8px] border border-ink-15 bg-surface px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/forum/${session.id}`}
                  className="text-lg font-semibold text-ink no-underline hover:text-accent-600"
                >
                  {session.title}
                </Link>
                {session.description ? (
                  <p className="mt-1 text-sm text-ink-70">
                    {session.description}
                  </p>
                ) : null}
                <p className="mt-2 font-[family-name:var(--font-ibm-plex-mono)] text-[11px] tracking-[0.06em] text-ink-40 uppercase">
                  {session.is_live ? "Live" : "Ready"} ·{" "}
                  {new Date(session.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/forum/${session.id}`}
                  className="rounded-[6px] border border-ink px-3.5 py-2 text-sm font-semibold no-underline hover:border-accent-500 hover:text-accent-500"
                >
                  Open
                </Link>
                {isAdmin ? (
                  <button
                    type="button"
                    disabled={busyId === session.id}
                    onClick={() => void onDelete(session)}
                    className="cursor-pointer rounded-[6px] border border-accent-500/40 px-3.5 py-2 text-sm font-semibold text-accent-600 hover:border-accent-500 hover:bg-accent-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyId === session.id ? "Deleting…" : "Delete"}
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
