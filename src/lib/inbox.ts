import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/server";
import { areFriends, isFriendUserId } from "@/lib/friends";
import type {
  DirectMessage,
  InboxConversation,
  InboxNotification,
} from "@/lib/types";

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

function unwrapProfile(
  raw: ProfileRow | ProfileRow[] | null | undefined,
): ProfileRow | null {
  if (!raw) return null;
  return Array.isArray(raw) ? (raw[0] ?? null) : raw;
}

export async function getUnreadInboxCount(
  supabase: SupabaseClient,
  userId: string,
) {
  const [{ count: notificationCount }, { count: messageCount }] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null),
      supabase
        .from("direct_messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .is("read_at", null),
    ]);

  return (notificationCount ?? 0) + (messageCount ?? 0);
}

export async function listNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 40,
): Promise<InboxNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, type, body, read_at, created_at, friendship_id, message_id, actor:profiles!actor_id(id, username, display_name, avatar_url)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const actor = unwrapProfile(
      row.actor as ProfileRow | ProfileRow[] | null,
    );
    return {
      id: row.id as string,
      type: row.type as InboxNotification["type"],
      body: (row.body as string | null) ?? null,
      read_at: (row.read_at as string | null) ?? null,
      created_at: row.created_at as string,
      actor: actor
        ? {
            id: actor.id,
            username: actor.username,
            display_name: actor.display_name,
            avatar_url: actor.avatar_url,
          }
        : null,
      friendship_id: (row.friendship_id as string | null) ?? null,
      message_id: (row.message_id as string | null) ?? null,
    };
  });
}

export async function markNotificationsRead(
  supabase: SupabaseClient,
  userId: string,
  ids?: string[],
) {
  let query = supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);

  if (ids?.length) {
    query = query.in("id", ids);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);
}

export async function listConversations(
  supabase: SupabaseClient,
  userId: string,
): Promise<InboxConversation[]> {
  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);

  const byPeer = new Map<
    string,
    {
      last: {
        id: string;
        body: string;
        sender_id: string;
        created_at: string;
        read_at: string | null;
      };
      unread: number;
    }
  >();

  for (const row of data ?? []) {
    const peerId =
      row.sender_id === userId
        ? (row.recipient_id as string)
        : (row.sender_id as string);
    const existing = byPeer.get(peerId);
    const message = {
      id: row.id as string,
      body: row.body as string,
      sender_id: row.sender_id as string,
      created_at: row.created_at as string,
      read_at: (row.read_at as string | null) ?? null,
    };
    if (!existing) {
      byPeer.set(peerId, {
        last: message,
        unread:
          row.recipient_id === userId && !row.read_at ? 1 : 0,
      });
    } else if (row.recipient_id === userId && !row.read_at) {
      existing.unread += 1;
    }
  }

  const peerIds = Array.from(byPeer.keys());
  if (!peerIds.length) return [];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", peerIds);

  if (profileError) throw new Error(profileError.message);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile as ProfileRow]),
  );

  const conversations: InboxConversation[] = [];
  for (const peerId of peerIds) {
    const profile = profileById.get(peerId);
    const convo = byPeer.get(peerId);
    if (!profile || !convo) continue;
    conversations.push({
      user: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
      },
      last_message: convo.last,
      unread_count: convo.unread,
    });
  }

  conversations.sort(
    (a, b) =>
      new Date(b.last_message?.created_at ?? 0).getTime() -
      new Date(a.last_message?.created_at ?? 0).getTime(),
  );

  return conversations;
}

export async function listThreadMessages(
  supabase: SupabaseClient,
  userId: string,
  otherId: string,
): Promise<DirectMessage[]> {
  if (!isFriendUserId(otherId)) {
    throw new Error("Invalid user id.");
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) throw new Error(error.message);

  // Mark inbound unread as read
  await supabase
    .from("direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherId)
    .eq("recipient_id", userId)
    .is("read_at", null);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    sender_id: row.sender_id as string,
    recipient_id: row.recipient_id as string,
    body: row.body as string,
    read_at: (row.read_at as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}

export async function sendDirectMessage(
  supabase: SupabaseClient,
  userId: string,
  recipientId: string,
  body: string,
) {
  const trimmed = body.trim();
  if (!trimmed) {
    return { error: "Message can’t be empty.", status: 400 as const };
  }
  if (trimmed.length > 2000) {
    return { error: "Message is too long.", status: 400 as const };
  }
  if (!isFriendUserId(recipientId) || recipientId === userId) {
    return { error: "Invalid recipient.", status: 400 as const };
  }

  const friends = await areFriends(supabase, userId, recipientId);
  if (!friends) {
    return {
      error: "You can only message accepted friends.",
      status: 403 as const,
    };
  }

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({
      sender_id: userId,
      recipient_id: recipientId,
      body: trimmed,
    })
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .maybeSingle();

  if (error || !data) {
    return {
      error: error?.message || "Could not send message.",
      status: 500 as const,
    };
  }

  const service = createServiceClient();
  if (service) {
    await service.from("notifications").insert({
      user_id: recipientId,
      actor_id: userId,
      type: "message",
      message_id: data.id,
      body: trimmed.slice(0, 140),
    });
  }

  return {
    ok: true as const,
    message: {
      id: data.id as string,
      sender_id: data.sender_id as string,
      recipient_id: data.recipient_id as string,
      body: data.body as string,
      read_at: (data.read_at as string | null) ?? null,
      created_at: data.created_at as string,
    } satisfies DirectMessage,
  };
}
