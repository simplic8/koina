"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { FriendActionControls } from "@/components/friends/FriendActionControls";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizeGame } from "@/lib/i18n/content";
import type {
  FriendPerson,
  FriendshipStatus,
  FriendSessionSummary,
} from "@/lib/types";

function personLabel(person: FriendPerson, fallback: string) {
  return person.display_name?.trim() || person.username?.trim() || fallback;
}

function withStatus(
  person: FriendPerson,
  status: FriendshipStatus,
): FriendPerson {
  return {
    ...person,
    friendship_status: status,
    is_friend: status === "friends",
  };
}

export function FriendsProfile({ viewerId }: { viewerId: string }) {
  const { t, locale } = useLocale();
  const [friends, setFriends] = useState<FriendPerson[]>([]);
  const [playedWith, setPlayedWith] = useState<FriendPerson[]>([]);
  const [sessions, setSessions] = useState<FriendSessionSummary[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fallback = t("sessions.unknownCreator");

  const labels = useMemo(
    () => ({
      add: t("sessions.addFriend"),
      pending: t("sessions.friendPending"),
      accept: t("sessions.acceptFriend"),
      decline: t("sessions.declineFriend"),
      remove: t("sessions.removeFriend"),
      cancel: t("sessions.cancelFriendRequest"),
    }),
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [friendsRes, playedRes, sessionsRes] = await Promise.all([
        fetch("/api/friends"),
        fetch("/api/friends/played-with"),
        fetch("/api/friends/sessions"),
      ]);
      const friendsPayload = (await friendsRes.json()) as {
        friends?: FriendPerson[];
        error?: string;
      };
      const playedPayload = (await playedRes.json()) as {
        people?: FriendPerson[];
        error?: string;
      };
      const sessionsPayload = (await sessionsRes.json()) as {
        sessions?: FriendSessionSummary[];
        error?: string;
      };
      if (!friendsRes.ok) {
        throw new Error(friendsPayload.error || t("profile.friends.loadError"));
      }
      if (!playedRes.ok) {
        throw new Error(playedPayload.error || t("profile.friends.loadError"));
      }
      if (!sessionsRes.ok) {
        throw new Error(
          sessionsPayload.error || t("profile.friends.loadError"),
        );
      }
      setFriends(friendsPayload.friends ?? []);
      setPlayedWith(playedPayload.people ?? []);
      setSessions(sessionsPayload.sessions ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("profile.friends.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFriendState(person: FriendPerson, status: FriendshipStatus) {
    setFriends((prev) => {
      if (status === "friends") {
        if (prev.some((item) => item.id === person.id)) {
          return prev.map((item) =>
            item.id === person.id ? withStatus(item, status) : item,
          );
        }
        return [withStatus(person, status), ...prev];
      }
      return prev.filter((item) => item.id !== person.id);
    });
    setPlayedWith((prev) =>
      prev.map((item) =>
        item.id === person.id ? withStatus(item, status) : item,
      ),
    );
    setSessions((prev) =>
      prev.map((session) => ({
        ...session,
        participants: session.participants.map((item) =>
          item.id === person.id ? withStatus(item, status) : item,
        ),
      })),
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold">{t("profile.friends.title")}</h2>
        <p className="mt-1 text-sm text-ink-70">{t("profile.friends.lead")}</p>

        {loading ? (
          <p className="mt-4 text-sm text-ink-70">{t("profile.friends.loading")}</p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 text-sm text-accent-600">
            {error}
          </p>
        ) : null}

        {!loading ? (
          friends.length ? (
            <div className="mt-4 overflow-x-auto rounded-[6px] border border-ink-15">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-08 bg-surface text-ink-70">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {t("profile.friends.colPlayer")}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      <span className="sr-only">
                        {t("profile.friends.colAction")}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {friends.map((person) => {
                    const name = personLabel(person, fallback);
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
                        <td className="px-3.5 py-2.5 text-right">
                          <FriendActionControls
                            userId={person.id}
                            status="friends"
                            busy={busyId === person.id}
                            labels={labels}
                            onBusy={(busy) =>
                              setBusyId(busy ? person.id : null)
                            }
                            onChange={(next) =>
                              applyFriendState(person, next)
                            }
                            onError={setError}
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
              {t("profile.friends.listEmpty")}
            </p>
          )
        ) : null}
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          {t("profile.friends.playedTitle")}
        </h2>
        <p className="mt-1 text-sm text-ink-70">
          {t("profile.friends.playedLead")}
        </p>

        {!loading ? (
          playedWith.length ? (
            <div className="mt-4 overflow-x-auto rounded-[6px] border border-ink-15">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-ink-08 bg-surface text-ink-70">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {t("profile.friends.colPlayer")}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {t("profile.friends.colLastPlayed")}
                    </th>
                    <th className="px-3.5 py-2.5 font-semibold">
                      {t("profile.friends.colStatus")}
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
                    const name = personLabel(person, fallback);
                    const status = person.friendship_status ?? "none";
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
                        <td className="px-3.5 py-2.5 text-ink-70">
                          {status === "friends"
                            ? t("profile.friends.statusFriend")
                            : status === "outgoing"
                              ? t("sessions.friendPending")
                              : status === "incoming"
                                ? t("sessions.acceptFriend")
                                : t("profile.friends.statusNotFriend")}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <FriendActionControls
                            userId={person.id}
                            status={status}
                            busy={busyId === person.id}
                            labels={labels}
                            onBusy={(busy) =>
                              setBusyId(busy ? person.id : null)
                            }
                            onChange={(next) =>
                              applyFriendState(person, next)
                            }
                            onError={setError}
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
              {t("profile.friends.playedEmpty")}
            </p>
          )
        ) : null}
      </section>

      <section>
        <h2 className="text-xl font-semibold">
          {t("profile.friends.sessionsTitle")}
        </h2>
        <p className="mt-1 text-sm text-ink-70">
          {t("profile.friends.sessionsLead")}
        </p>

        {!loading ? (
          sessions.length ? (
            <ul className="mt-4 flex flex-col gap-3">
              {sessions.map((session) => {
                const open = Boolean(expanded[session.id]);
                const game = localizeGame(session.game, locale);
                return (
                  <li
                    key={session.id}
                    className="rounded-[6px] border border-ink-15 bg-surface"
                  >
                    <button
                      type="button"
                      className="flex w-full cursor-pointer items-start justify-between gap-3 px-3.5 py-3 text-left"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [session.id]: !prev[session.id],
                        }))
                      }
                      aria-expanded={open}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{session.title}</p>
                        <p className="mt-0.5 text-sm text-ink-70">
                          {game.title || session.game?.title || "—"} ·{" "}
                          {new Date(session.starts_at).toLocaleString(locale, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-ink-40">
                        {open ? "−" : "+"}
                      </span>
                    </button>
                    {open ? (
                      <ul className="border-t border-ink-08 px-3.5 py-3">
                        {session.participants.length ? (
                          session.participants.map((person) => {
                            const name = personLabel(person, fallback);
                            const isSelf = person.id === viewerId;
                            return (
                              <li
                                key={person.id}
                                className="flex items-center gap-2.5 py-1.5 text-sm"
                              >
                                <AvatarImage
                                  src={person.avatar_url}
                                  className="h-7 w-7 rounded-full object-cover"
                                  fallback={
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">
                                      {name.charAt(0).toUpperCase()}
                                    </span>
                                  }
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {name}
                                  {isSelf
                                    ? ` (${t("profile.friends.you")})`
                                    : ""}
                                </span>
                                {!isSelf ? (
                                  <FriendActionControls
                                    userId={person.id}
                                    status={
                                      person.friendship_status ?? "none"
                                    }
                                    busy={busyId === person.id}
                                    labels={labels}
                                    onBusy={(busy) =>
                                      setBusyId(busy ? person.id : null)
                                    }
                                    onChange={(next) =>
                                      applyFriendState(person, next)
                                    }
                                    onError={setError}
                                  />
                                ) : null}
                              </li>
                            );
                          })
                        ) : (
                          <li className="text-sm text-ink-70">
                            {t("sessions.noParticipants")}
                          </li>
                        )}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-70">
              {t("profile.friends.sessionsEmpty")}
            </p>
          )
        ) : null}
      </section>
    </div>
  );
}
