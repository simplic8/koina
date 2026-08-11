import {
  Client,
  GatewayIntentBits,
  Partials,
  type Message,
} from "discord.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { SITE_CHAT_CHANNEL } from "../src/lib/chat-channel";
import { discordProfileBadges } from "../src/lib/discord/badges";
import { registerGuildCommands } from "./commands";
import { handleInteraction } from "./interactions";
import { getBotSupabase } from "./lib/supabase";

// Load .env.local when running via `npm run discord-bot`
function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_CHAT_CHANNEL_ID;
const guildId = process.env.DISCORD_GUILD_ID?.trim() || "";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!token || !channelId || !supabaseUrl || !serviceKey) {
  console.error(
    "Missing env: DISCORD_BOT_TOKEN, DISCORD_CHAT_CHANNEL_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const supabase = getBotSupabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

async function ingest(message: Message) {
  if (message.author.bot) return;
  if (message.webhookId) return;
  if (message.channelId !== channelId) return;
  if (!message.content?.trim()) return;

  const avatarUrl =
    message.member?.displayAvatarURL({ size: 128 }) ??
    message.author.displayAvatarURL({ size: 128 });

  const decorationAsset =
    // Prefer member decoration when Discord provides one.
    (
      message.member as { avatarDecorationData?: { asset: string } | null }
    )?.avatarDecorationData?.asset ??
    message.author.avatarDecorationData?.asset ??
    null;
  const decorationUrl = decorationAsset
    ? `https://cdn.discordapp.com/avatar-decoration-presets/${decorationAsset}.png?size=96&passthrough=true`
    : null;

  const primaryGuild = message.author.primaryGuild
    ? {
        identity_guild_id: message.author.primaryGuild.identityGuildId,
        identity_enabled: message.author.primaryGuild.identityEnabled,
        tag: message.author.primaryGuild.tag,
        badge: message.author.primaryGuild.badge,
      }
    : null;

  const authorBadges = discordProfileBadges({
    public_flags: message.author.flags?.bitfield ?? 0,
    primary_guild: primaryGuild,
  });

  const { error } = await supabase.from("chat_messages").upsert(
    {
      channel: SITE_CHAT_CHANNEL,
      author: message.member?.displayName ?? message.author.username,
      author_discord_id: message.author.id,
      author_avatar_url: avatarUrl,
      author_avatar_decoration_url: decorationUrl,
      author_badges: authorBadges,
      body: message.content.trim(),
      discord_message_id: message.id,
      source: "discord",
      user_id: null,
      created_at: message.createdAt.toISOString(),
    },
    { onConflict: "discord_message_id" },
  );

  if (error) {
    console.error("Failed to upsert chat message:", error.message);
  } else {
    console.log(`Mirrored message ${message.id} from ${message.author.username}`);
  }
}

client.once("clientReady", () => {
  console.log(`JustVibing Discord bridge online as ${client.user?.tag}`);
  console.log(`Watching channel ${channelId}`);

  if (!guildId || !client.user) {
    console.warn(
      "DISCORD_GUILD_ID unset — slash commands (/sessions, /schedule) will not be registered.",
    );
    return;
  }

  void registerGuildCommands({
    token,
    clientId: client.user.id,
    guildId,
  }).catch((err) => {
    console.error("Failed to register slash commands:", err);
  });
});

client.on("interactionCreate", (interaction) => {
  void handleInteraction(interaction);
});

client.on("messageCreate", (message) => {
  void ingest(message);
});

client.login(token);
