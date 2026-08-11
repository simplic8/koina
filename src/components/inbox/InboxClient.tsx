"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AvatarImage } from "@/components/ui/AvatarImage";
import { Button } from "@/components/ui/Button";
import { FriendActionControls } from "@/components/friends/FriendActionControls";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type {
  DirectMessage,
  InboxConversation,
  InboxNotification,
} from "@/lib/types";

function personLabel(
  person: {
    display_name?: string | null;
    username?: string | null;
  } | null,
  fallback: string,
) {
  return person?.display_name?.trim() || person?.username?.trim() || fallback;
}

export function InboxClient({ viewerId }: { viewerId: string }) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "messages" ? "messages" : "notifications";
  const withUser = searchParams.get("with")?.trim() || null;

  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [friendBusyId, setFriendBusyId] = useState<string | null>(null);
  const fallback = t("sessions.unknownCreator");

  const friendLabels = useMemo(
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

  const activeConversation = useMemo(
    () => conversations.find((item) => item.user.id === withUser) ?? null,
    [conversations, withUser],
  );

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/inbox");
      const payload = (await response.json()) as {
        notifications?: InboxNotification[];
        conversations?: InboxConversation[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || t("inbox.loadError"));
      }
      setNotifications(payload.notifications ?? []);
      setConversations(payload.conversations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inbox.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  const markedRead = useRef(false);

  useEffect(() => {
    if (tab !== "notifications" || loading || markedRead.current) return;
    const unreadIds = notifications
      .filter((item) => !item.read_at)
      .map((item) => item.id);
    if (!unreadIds.length) return;
    markedRead.current = true;
    void fetch("/api/inbox/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    }).then(() => {
      setNotifications((prev) =>
        prev.map((item) =>
          item.read_at ? item : { ...item, read_at: new Date().toISOString() },
        ),
      );
    });
  }, [tab, loading, notifications]);

  useEffect(() => {
    if (!withUser) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setThreadLoading(true);
    void (async () => {
      try {
        const response = await fetch(
          `/api/inbox/messages?with=${encodeURIComponent(withUser)}`,
        );
        const payload = (await response.json()) as {
          messages?: DirectMessage[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || t("inbox.loadError"));
        }
        if (!cancelled) setMessages(payload.messages ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("inbox.loadError"));
        }
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [withUser, t]);

  function setTab(next: "notifications" | "messages") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    if (next === "notifications") params.delete("with");
    router.replace(`/inbox?${params.toString()}`);
  }

  function openThread(userId: string) {
    router.replace(`/inbox?tab=messages&with=${encodeURIComponent(userId)}`);
  }

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!withUser || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/inbox/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: withUser, body: draft }),
      });
      const payload = (await response.json()) as {
        message?: DirectMessage;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || t("inbox.sendError"));
      }
      if (payload.message) {
        setMessages((prev) => [...prev, payload.message!]);
        setDraft("");
        await loadInbox();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("inbox.sendError"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-ink-08 pb-3">
        <button
          type="button"
          onClick={() => setTab("notifications")}
          className={`cursor-pointer rounded-[6px] border px-3.5 py-2 text-sm font-semibold ${
            tab === "notifications"
              ? "border-ink bg-btn-dark !text-btn-dark-fg"
              : "border-ink-15 bg-surface text-ink hover:border-accent-500"
          }`}
        >
          {t("inbox.notifications")}
        </button>
        <button
          type="button"
          onClick={() => setTab("messages")}
          className={`cursor-pointer rounded-[6px] border px-3.5 py-2 text-sm font-semibold ${
            tab === "messages"
              ? "border-ink bg-btn-dark !text-btn-dark-fg"
              : "border-ink-15 bg-surface text-ink hover:border-accent-500"
          }`}
        >
          {t("inbox.messages")}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-accent-600">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-ink-70">{t("inbox.loading")}</p>
      ) : null}

      {!loading && tab === "notifications" ? (
        notifications.length ? (
          <ul className="flex flex-col gap-2">
            {notifications.map((item) => {
              const name = personLabel(item.actor, fallback);
              const actorId = item.actor?.id;
              const notificationText =
                item.type === "friend_request"
                  ? t("inbox.friendRequest", { name })
                  : item.type === "friend_request_accepted"
                    ? t("inbox.friendRequestAccepted", { name })
                    : item.type === "friend_request_declined"
                      ? t("inbox.friendRequestDeclined", { name })
                      : item.type === "friend_accepted"
                        ? t("inbox.friendAccepted", { name })
                        : t("inbox.newMessage", { name });
              return (
                <li
                  key={item.id}
                  className={`rounded-[6px] border border-ink-15 px-3.5 py-3 ${
                    item.read_at ? "bg-surface" : "bg-accent-100/40"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{notificationText}</p>
                      {item.body ? (
                        <p className="mt-1 text-sm text-ink-70">{item.body}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-ink-40">
                        {new Date(item.created_at).toLocaleString(locale, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.type === "friend_request" && actorId ? (
                        <FriendActionControls
                          userId={actorId}
                          status="incoming"
                          busy={friendBusyId === actorId}
                          labels={friendLabels}
                          onBusy={(busy) =>
                            setFriendBusyId(busy ? actorId : null)
                          }
                          onChange={(next) => {
                            setNotifications((prev) =>
                              prev.map((notification) =>
                                notification.id === item.id
                                  ? {
                                      ...notification,
                                      type:
                                        next === "friends"
                                          ? "friend_request_accepted"
                                          : "friend_request_declined",
                                      read_at:
                                        notification.read_at ??
                                        new Date().toISOString(),
                                    }
                                  : notification,
                              ),
                            );
                            void loadInbox();
                          }}
                          onError={setError}
                        />
                      ) : null}
                      {(item.type === "message" ||
                        item.type === "friend_accepted" ||
                        item.type === "friend_request_accepted") &&
                      actorId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => openThread(actorId)}
                        >
                          {item.type === "message"
                            ? t("inbox.openChat")
                            : t("inbox.messageFriend")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-ink-70">{t("inbox.notificationsEmpty")}</p>
        )
      ) : null}

      {!loading && tab === "messages" ? (
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="rounded-[6px] border border-ink-15 bg-surface">
            {conversations.length ? (
              <ul>
                {conversations.map((convo) => {
                  const name = personLabel(convo.user, fallback);
                  const active = withUser === convo.user.id;
                  return (
                    <li key={convo.user.id} className="border-b border-ink-08 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => openThread(convo.user.id)}
                        className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left ${
                          active ? "bg-accent-100/50" : "hover:bg-base"
                        }`}
                      >
                        <AvatarImage
                          src={convo.user.avatar_url}
                          className="h-8 w-8 rounded-full object-cover"
                          fallback={
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-[11px] font-semibold text-accent-700">
                              {name.charAt(0).toUpperCase()}
                            </span>
                          }
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {name}
                          </span>
                          <span className="block truncate text-xs text-ink-40">
                            {convo.last_message?.body ?? "—"}
                          </span>
                        </span>
                        {convo.unread_count > 0 ? (
                          <span className="rounded-full bg-accent-500 px-1.5 text-[10px] font-semibold text-white">
                            {convo.unread_count}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-3 py-4 text-sm text-ink-70">
                {t("inbox.messagesEmpty")}{" "}
                <Link
                  href="/profile?section=friends"
                  className="font-semibold text-accent-600"
                >
                  {t("inbox.findFriends")}
                </Link>
              </p>
            )}
          </div>

          <div className="flex min-h-[360px] flex-col rounded-[6px] border border-ink-15 bg-surface">
            {withUser ? (
              <>
                <div className="border-b border-ink-08 px-3.5 py-3">
                  <p className="font-semibold">
                    {personLabel(activeConversation?.user ?? null, fallback)}
                  </p>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto px-3.5 py-3">
                  {threadLoading ? (
                    <p className="text-sm text-ink-70">{t("inbox.loading")}</p>
                  ) : messages.length ? (
                    messages.map((message) => {
                      const mine = message.sender_id === viewerId;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-[8px] px-3 py-2 text-sm ${
                              mine
                                ? "bg-accent-500 text-white"
                                : "bg-base border border-ink-15"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {message.body}
                            </p>
                            <p
                              className={`mt-1 text-[10px] ${
                                mine ? "text-white/70" : "text-ink-40"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString(
                                locale,
                                { hour: "numeric", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-ink-70">{t("inbox.threadEmpty")}</p>
                  )}
                </div>
                <form
                  onSubmit={onSend}
                  className="flex gap-2 border-t border-ink-08 p-3"
                >
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    className="min-w-0 flex-1 rounded-[6px] border border-ink-15 bg-base px-3 py-2 text-sm outline-none focus:border-ink"
                    placeholder={t("inbox.messagePlaceholder")}
                    maxLength={2000}
                  />
                  <Button type="submit" disabled={sending || !draft.trim()}>
                    {sending ? t("inbox.sending") : t("inbox.send")}
                  </Button>
                </form>
              </>
            ) : (
              <p className="m-auto px-4 text-center text-sm text-ink-70">
                {t("inbox.selectConversation")}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
