export function isDiscordConfigured() {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHAT_CHANNEL_ID,
  );
}

type DiscordAvatarDecoration = {
  asset: string;
  sku_id?: string;
  expires_at?: number | null;
};

type DiscordApiMessage = {
  id: string;
  content: string;
  timestamp: string;
  author: {
    id: string;
    username: string;
    avatar?: string | null;
    bot?: boolean;
    global_name?: string | null;
    discriminator?: string;
    public_flags?: number;
    primary_guild?: {
      identity_guild_id?: string | null;
      identity_enabled?: boolean | null;
      tag?: string | null;
      badge?: string | null;
    } | null;
    avatar_decoration_data?: DiscordAvatarDecoration | null;
  };
  member?: {
    nick?: string | null;
    avatar?: string | null;
    avatar_decoration_data?: DiscordAvatarDecoration | null;
  } | null;
  webhook_id?: string | null;
};

type DiscordApiErrorBody = {
  message?: string;
  code?: number;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
  discriminator?: string;
  public_flags?: number;
  primary_guild?: {
    identity_guild_id?: string | null;
    identity_enabled?: boolean | null;
    tag?: string | null;
    badge?: string | null;
  } | null;
  avatar_decoration_data?: DiscordAvatarDecoration | null;
};

type DiscordWebhook = {
  id: string;
  token: string;
  name?: string;
  url?: string;
};

export type DiscordPostIdentity = {
  /** Discord snowflake — used to load name/avatar when linked. */
  discordUserId?: string | null;
  /** Fallback display name when Discord profile cannot be loaded. */
  displayName?: string | null;
  avatarUrl?: string | null;
};

const WEBHOOK_NAME = "KOINA Chat";
let cachedWebhook: DiscordWebhook | null = null;

async function discordFetch(path: string, init?: RequestInit) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("Discord bot is not configured");
  }

  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let parsed: DiscordApiErrorBody | null = null;
    try {
      parsed = JSON.parse(text) as DiscordApiErrorBody;
    } catch {
      /* ignore */
    }
    const message = parsed?.message || text || res.statusText;
    const code = parsed?.code;
    const err = new Error(
      code
        ? `Discord API error (${res.status}, code ${code}): ${message}`
        : `Discord API error (${res.status}): ${message}`,
    ) as Error & { discordCode?: number; status?: number };
    err.discordCode = code;
    err.status = res.status;
    throw err;
  }

  return res;
}

export function discordUserAvatarUrl(user: {
  id: string;
  avatar?: string | null;
  discriminator?: string;
}) {
  if (user.avatar) {
    const ext = user.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=128`;
  }
  // New username system (discriminator "0") uses (user_id >> 22) % 6
  const index =
    !user.discriminator || user.discriminator === "0"
      ? Number(BigInt(user.id) >> BigInt(22)) % 6
      : Number(user.discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

/** Prefer guild (server) avatar when present — matches what Discord shows in-channel. */
export function discordMessageAvatarUrl(
  message: Pick<DiscordApiMessage, "author" | "member">,
  guildId = process.env.DISCORD_GUILD_ID?.trim() || "",
) {
  if (guildId && message.member?.avatar) {
    const ext = message.member.avatar.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/guilds/${guildId}/users/${message.author.id}/avatars/${message.member.avatar}.${ext}?size=128`;
  }
  return discordUserAvatarUrl(message.author);
}

/** Nitro avatar decoration / profile sticker overlay. */
export function discordAvatarDecorationUrl(
  decoration: DiscordAvatarDecoration | null | undefined,
) {
  if (!decoration?.asset) return null;
  // passthrough=true keeps animated decorations animated (APNG).
  return `https://cdn.discordapp.com/avatar-decoration-presets/${decoration.asset}.png?size=96&passthrough=true`;
}

export function discordMessageDecorationUrl(
  message: Pick<DiscordApiMessage, "author" | "member">,
) {
  return (
    discordAvatarDecorationUrl(message.member?.avatar_decoration_data) ??
    discordAvatarDecorationUrl(message.author.avatar_decoration_data)
  );
}

export async function fetchDiscordUser(userId: string) {
  const res = await discordFetch(`/users/${userId}`);
  return res.json() as Promise<DiscordUser>;
}

async function listChannelWebhooks(channelId: string) {
  const res = await discordFetch(`/channels/${channelId}/webhooks`);
  return res.json() as Promise<DiscordWebhook[]>;
}

async function createChannelWebhook(channelId: string) {
  const res = await discordFetch(`/channels/${channelId}/webhooks`, {
    method: "POST",
    body: JSON.stringify({ name: WEBHOOK_NAME }),
  });
  return res.json() as Promise<DiscordWebhook>;
}

async function resolveChatWebhook(): Promise<DiscordWebhook> {
  const fromEnv = process.env.DISCORD_CHAT_WEBHOOK_URL?.trim();
  if (fromEnv) {
    // https://discord.com/api/webhooks/{id}/{token}
    const match = fromEnv.match(/\/webhooks\/(\d+)\/([^/?#]+)/);
    if (match) {
      return { id: match[1], token: match[2], url: fromEnv };
    }
  }

  if (cachedWebhook?.id && cachedWebhook.token) {
    return cachedWebhook;
  }

  const channelId = process.env.DISCORD_CHAT_CHANNEL_ID;
  if (!channelId) {
    throw new Error("Discord bot is not configured");
  }

  const existing = (await listChannelWebhooks(channelId)).find(
    (hook) => hook.name === WEBHOOK_NAME && hook.token,
  );
  const webhook = existing ?? (await createChannelWebhook(channelId));
  if (!webhook.token) {
    throw new Error(
      "Could not create a Discord webhook. Grant the bot Manage Webhooks, or set DISCORD_CHAT_WEBHOOK_URL.",
    );
  }
  cachedWebhook = webhook;
  return webhook;
}

async function postViaWebhook(
  content: string,
  identity: { username: string; avatarUrl?: string | null },
) {
  const webhook = await resolveChatWebhook();
  const username = identity.username.slice(0, 80) || "KOINA";
  const payload: {
    content: string;
    username: string;
    avatar_url?: string;
    allowed_mentions: { parse: string[] };
  } = {
    content,
    username,
    allowed_mentions: { parse: [] },
  };
  if (identity.avatarUrl) {
    payload.avatar_url = identity.avatarUrl;
  }

  const res = await fetch(
    `https://discord.com/api/v10/webhooks/${webhook.id}/${webhook.token}?wait=true`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook error (${res.status}): ${text}`);
  }

  return res.json() as Promise<{ id: string }>;
}

/** Bot message (shows as the KOINA bot). */
export async function postDiscordMessage(content: string) {
  const channelId = process.env.DISCORD_CHAT_CHANNEL_ID;
  if (!channelId) {
    throw new Error("Discord bot is not configured");
  }

  const res = await discordFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  return res.json() as Promise<{ id: string }>;
}

function sanitizeWebhookUsername(name: string) {
  const cleaned = name.trim().slice(0, 80) || "Player";
  // Discord rejects these webhook usernames.
  if (/^(clyde|discord|everyone|here)$/i.test(cleaned)) {
    return `${cleaned}_`;
  }
  return cleaned;
}

/**
 * Post chat content to #web.
 * Prefers a webhook (custom name/avatar). Falls back to a bot message when the
 * bot lacks Manage Webhooks or DISCORD_CHAT_WEBHOOK_URL is unset.
 */
export async function postDiscordChatMessage(
  content: string,
  identity?: DiscordPostIdentity | null,
) {
  const text = content.trim();
  if (!text) {
    throw new Error("Message required");
  }

  const fallbackName = identity?.displayName?.trim() || "Player";
  let webhookUsername = sanitizeWebhookUsername(fallbackName);
  let webhookAvatar: string | null | undefined =
    identity?.discordUserId ? null : identity?.avatarUrl;

  if (identity?.discordUserId) {
    try {
      const user = await fetchDiscordUser(identity.discordUserId);
      webhookUsername = sanitizeWebhookUsername(
        user.global_name?.trim() ||
          user.username ||
          fallbackName,
      );
      webhookAvatar = discordUserAvatarUrl(user);
    } catch (err) {
      console.error("Discord user lookup failed; using display name:", err);
    }
  }

  try {
    return await postViaWebhook(text, {
      username: webhookUsername,
      avatarUrl: webhookAvatar,
    });
  } catch (err) {
    console.error("Discord webhook post failed, using bot:", err);
    return postDiscordMessage(`**${fallbackName}**: ${text}`);
  }
}

/** Newest messages first (Discord default). */
export async function fetchDiscordChannelMessages(limit = 50) {
  const channelId = process.env.DISCORD_CHAT_CHANNEL_ID;
  if (!channelId) {
    throw new Error("Discord bot is not configured");
  }

  const capped = Math.min(Math.max(limit, 1), 100);
  const res = await discordFetch(
    `/channels/${channelId}/messages?limit=${capped}`,
  );
  return res.json() as Promise<DiscordApiMessage[]>;
}

export async function probeDiscordChatAccess() {
  const channelId = process.env.DISCORD_CHAT_CHANNEL_ID;
  if (!isDiscordConfigured() || !channelId) {
    return {
      ok: false as const,
      error: "Discord is not configured",
      hint: "Set DISCORD_BOT_TOKEN and DISCORD_CHAT_CHANNEL_ID.",
    };
  }

  try {
    const meRes = await discordFetch("/users/@me");
    const me = (await meRes.json()) as { id: string; username: string };
    const channelRes = await discordFetch(`/channels/${channelId}`);
    const channel = (await channelRes.json()) as {
      id: string;
      name?: string;
      type?: number;
    };
    return {
      ok: true as const,
      botUsername: me.username,
      botId: me.id,
      channelId: channel.id,
      channelName: channel.name ? `#${channel.name}` : channelId,
    };
  } catch (err) {
    const discordCode =
      err && typeof err === "object" && "discordCode" in err
        ? Number((err as { discordCode?: number }).discordCode)
        : undefined;
    const message = err instanceof Error ? err.message : "Discord probe failed";

    let hint =
      "Check DISCORD_BOT_TOKEN, DISCORD_CHAT_CHANNEL_ID, and bot permissions.";
    if (discordCode === 50001) {
      hint =
        "Missing Access: invite the KOINA bot into your Discord server and ensure it can view #web (Read Message History + Send Messages).";
    } else if (discordCode === 50013) {
      hint =
        "Missing Permissions: give the bot Send Messages, Read Message History, and Manage Webhooks on #web.";
    } else if (discordCode === 10003) {
      hint = "Unknown Channel: DISCORD_CHAT_CHANNEL_ID is not a valid channel.";
    }

    return {
      ok: false as const,
      error: message,
      code: discordCode,
      hint,
    };
  }
}

/**
 * Bot invite: View Channel + Send Messages + Read History + Manage Webhooks.
 * Includes `applications.commands` so slash commands (/sessions, /schedule) work.
 * Re-invite (or enable the scope) once if the bot was invited without it.
 */
export function discordBotInviteUrl(clientId: string) {
  const permissions = (1024 | 2048 | 65536 | 536870912).toString();
  const params = new URLSearchParams({
    client_id: clientId,
    permissions,
    scope: "bot applications.commands",
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}
