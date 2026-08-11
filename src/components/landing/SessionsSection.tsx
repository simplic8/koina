"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { SessionCard } from "@/components/sessions/SessionCard";
import { SessionDetailModal } from "@/components/sessions/SessionDetailModal";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Game, Session, SessionTitleSuggestion } from "@/lib/types";

export function SessionsSection({
  sessions,
  signedIn = false,
  viewerId = null,
  isAdmin = false,
  games = [],
  titleSuggestions = [],
}: {
  sessions: Session[];
  signedIn?: boolean;
  viewerId?: string | null;
  isAdmin?: boolean;
  games?: Game[];
  titleSuggestions?: SessionTitleSuggestion[];
}) {
  const { t } = useLocale();
  const visibleSessions = sessions.slice(0, 3);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Record<string, true>>({});
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const session of visibleSessions) {
      if (session.viewer_joined) initial[session.id] = true;
    }
    return initial;
  });
  const [countMap, setCountMap] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const session of visibleSessions) {
      initial[session.id] = session.registered_count;
    }
    return initial;
  });

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

  function canDeleteSession(session: Session) {
    if (!viewerId) return false;
    if (isAdmin) return true;
    return session.creator_id === viewerId;
  }

  const cards = visibleSessions.filter((session) => !hiddenIds[session.id]);
  const activeId = activeSession?.id;
  const activeJoined = activeId ? Boolean(joinedMap[activeId]) : false;
  const activeCount = useMemo(
    () =>
      activeId
        ? (countMap[activeId] ?? activeSession?.registered_count ?? 0)
        : 0,
    [activeId, activeSession?.registered_count, countMap],
  );

  return (
    <section id="sessions" className="py-16">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-[28px]">{t("sessions.featured")}</h2>
          <Link
            href="/sessions"
            className="whitespace-nowrap text-[13px] font-semibold text-accent-600 no-underline"
          >
            {t("sessions.seeAll")}
          </Link>
        </div>
        {cards.length ? (
          <div className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                signedIn={signedIn}
                canDelete={canDeleteSession(session)}
                joined={Boolean(joinedMap[session.id])}
                registeredCount={
                  countMap[session.id] ?? session.registered_count
                }
                games={games}
                titleSuggestions={titleSuggestions}
                onOpen={() => setActiveSession(session)}
                onJoinedChange={(next) => onJoinedChange(session.id, next)}
                onDeleted={() => {
                  setHiddenIds((prev) => ({ ...prev, [session.id]: true }));
                  if (activeSession?.id === session.id) setActiveSession(null);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[6px] border border-dashed border-ink-15 bg-surface px-6 py-12 text-center">
            <p className="font-semibold">{t("sessions.emptyTitle")}</p>
            <p className="mt-1 text-sm text-ink-70">
              {t("sessions.emptyBody")}
            </p>
          </div>
        )}
      </div>

      <SessionDetailModal
        session={activeSession}
        open={Boolean(activeSession)}
        signedIn={signedIn}
        canDelete={
          Boolean(activeSession) && canDeleteSession(activeSession!)
        }
        joined={activeJoined}
        registeredCount={activeCount}
        games={games}
        titleSuggestions={titleSuggestions}
        viewerId={viewerId}
        onClose={() => setActiveSession(null)}
        onJoinedChange={(next) => {
          if (!activeSession) return;
          onJoinedChange(activeSession.id, next);
        }}
        onDeleted={() => {
          if (!activeSession) return;
          setHiddenIds((prev) => ({ ...prev, [activeSession.id]: true }));
          setActiveSession(null);
        }}
        onUpdated={(updated) => setActiveSession(updated)}
      />
    </section>
  );
}
