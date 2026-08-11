import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  type ChatInputCommandInteraction,
  type Interaction,
  type ModalSubmitInteraction,
  type ButtonInteraction,
} from "discord.js";
import { resolveProfileByDiscordId } from "./lib/profile";
import {
  createSession,
  joinSessionAsUser,
  leaveSessionAsUser,
  listPublishedGames,
  listUpcomingSessions,
  type BotSession,
} from "./lib/sessions";
import { sessionDeepLink } from "./lib/supabase";

const JOIN_PREFIX = "jv:join:";
const LEAVE_PREFIX = "jv:leave:";
const SCHEDULE_MODAL_PREFIX = "jv:schedule:";

function formatWhen(iso: string) {
  const ms = Math.floor(new Date(iso).getTime() / 1000);
  return `<t:${ms}:F> (<t:${ms}:R>)`;
}

function sessionEmbed(session: BotSession, footer?: string) {
  const spots = `${session.registered_count}/${session.capacity}`;
  const host = session.creator?.username ?? "unknown";
  const game = session.game
    ? `${session.game.title} · ${session.game.platform}`
    : "Unknown game";

  const embed = new EmbedBuilder()
    .setColor(0xef4e25)
    .setTitle(session.title)
    .addFields(
      { name: "Game", value: game, inline: true },
      { name: "Spots", value: spots, inline: true },
      { name: "Host", value: host, inline: true },
      { name: "Starts", value: formatWhen(session.starts_at) },
    );

  if (footer) embed.setFooter({ text: footer });
  return embed;
}

function sessionButtons(sessionId: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${JOIN_PREFIX}${sessionId}`)
      .setLabel("Join")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`${LEAVE_PREFIX}${sessionId}`)
      .setLabel("Leave")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel("Open on web")
      .setStyle(ButtonStyle.Link)
      .setURL(sessionDeepLink(sessionId)),
  );
}

async function requireLinkedProfile(
  interaction: Interaction,
  options?: { requireEmailConfirmed?: boolean },
) {
  const resolved = await resolveProfileByDiscordId(interaction.user.id, options);
  if (resolved.ok === false) {
    const message = resolved.message;
    if (interaction.isRepliable()) {
      await interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    }
    return null;
  }
  return resolved.profile;
}

async function handleSessions(interaction: ChatInputCommandInteraction) {
  const profile = await requireLinkedProfile(interaction);
  if (!profile) return;

  const gameId = interaction.options.getString("game");

  await interaction.deferReply();
  const sessions = await listUpcomingSessions({ gameId, limit: 10 });

  if (sessions.length === 0) {
    await interaction.editReply({
      content: gameId
        ? "No upcoming sessions for that game."
        : "No upcoming sessions yet. Use `/schedule` to create one.",
    });
    return;
  }

  // Discord allows one embed + components per message; send first session with buttons,
  // then follow-ups for the rest (max ~9 more).
  const [first, ...rest] = sessions;
  await interaction.editReply({
    content: `Upcoming sessions (${sessions.length}):`,
    embeds: [sessionEmbed(first)],
    components: [sessionButtons(first.id)],
  });

  for (const session of rest.slice(0, 9)) {
    await interaction.followUp({
      embeds: [sessionEmbed(session)],
      components: [sessionButtons(session.id)],
    });
  }
}

async function handleScheduleCommand(interaction: ChatInputCommandInteraction) {
  const profile = await requireLinkedProfile(interaction, {
    requireEmailConfirmed: true,
  });
  if (!profile) return;

  const gameId = interaction.options.getString("game", true);
  const locale = interaction.options.getString("locale") ?? "en";

  const games = await listPublishedGames(25);
  const game = games.find((g) => g.id === gameId);
  if (!game) {
    await interaction.reply({
      content: "That game is not available.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`${SCHEDULE_MODAL_PREFIX}${gameId}:${locale}`)
    .setTitle(`Schedule · ${game.title}`.slice(0, 45));

  const titleInput = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Session title")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(120)
    .setPlaceholder("Friday night co-op");

  const startsInput = new TextInputBuilder()
    .setCustomId("starts_at")
    .setLabel("Start time (UTC)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("2026-07-30 19:00 or ISO");

  const capacityInput = new TextInputBuilder()
    .setCustomId("capacity")
    .setLabel("Capacity (2–500)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue("40")
    .setMaxLength(3);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(startsInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(capacityInput),
  );

  await interaction.showModal(modal);
}

async function handleScheduleModal(interaction: ModalSubmitInteraction) {
  const profile = await requireLinkedProfile(interaction, {
    requireEmailConfirmed: true,
  });
  if (!profile) return;

  const payload = interaction.customId.slice(SCHEDULE_MODAL_PREFIX.length);
  const colon = payload.indexOf(":");
  if (colon === -1) {
    await interaction.reply({
      content: "Invalid schedule form.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const gameId = payload.slice(0, colon);
  const locale = payload.slice(colon + 1) || "en";
  const title = interaction.fields.getTextInputValue("title");
  const startsAtRaw = interaction.fields.getTextInputValue("starts_at");
  const capacityRaw =
    interaction.fields.getTextInputValue("capacity")?.trim() || "40";

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const result = await createSession({
    gameId,
    title,
    startsAtRaw,
    capacityRaw,
    locale,
    creator: profile,
  });

  if (result.ok === false) {
    await interaction.editReply({ content: result.message });
    return;
  }

  await interaction.editReply({ content: "Session scheduled." });
  await interaction.followUp({
    content: `Scheduled by <@${interaction.user.id}>`,
    embeds: [sessionEmbed(result.session, "JustVibing")],
    components: [sessionButtons(result.session.id)],
  });
}

async function handleJoinLeave(
  interaction: ButtonInteraction,
  action: "join" | "leave",
) {
  const profile = await requireLinkedProfile(interaction, {
    requireEmailConfirmed: true,
  });
  if (!profile) return;

  const sessionId = interaction.customId.slice(
    action === "join" ? JOIN_PREFIX.length : LEAVE_PREFIX.length,
  );

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const result =
    action === "join"
      ? await joinSessionAsUser(sessionId, profile.id)
      : await leaveSessionAsUser(sessionId, profile.id);

  if (result.ok === false) {
    await interaction.editReply({ content: result.message });
    return;
  }

  const verb = result.joined ? "joined" : "left";
  await interaction.editReply({
    content: `You ${verb} **${result.session.title}**.`,
  });
  await interaction.followUp({
    content: `<@${interaction.user.id}> ${verb} **${result.session.title}** (${result.registered_count}/${result.capacity})`,
    embeds: [sessionEmbed(result.session)],
    components: [sessionButtons(result.session.id)],
  });
}

export async function handleInteraction(interaction: Interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "sessions") {
        await handleSessions(interaction);
        return;
      }
      if (interaction.commandName === "schedule") {
        await handleScheduleCommand(interaction);
        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith(SCHEDULE_MODAL_PREFIX)) {
        await handleScheduleModal(interaction);
        return;
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith(JOIN_PREFIX)) {
        await handleJoinLeave(interaction, "join");
        return;
      }
      if (interaction.customId.startsWith(LEAVE_PREFIX)) {
        await handleJoinLeave(interaction, "leave");
        return;
      }
    }
  } catch (err) {
    console.error("Interaction error:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong.";
    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: message,
          flags: MessageFlags.Ephemeral,
        }).catch(() => undefined);
      } else {
        await interaction.reply({
          content: message,
          flags: MessageFlags.Ephemeral,
        }).catch(() => undefined);
      }
    }
  }
}
