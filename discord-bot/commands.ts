import {
  REST,
  Routes,
  SlashCommandBuilder,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import { listPublishedGames } from "./lib/sessions";

const LOCALE_CHOICES = [
  { name: "English", value: "en" },
  { name: "Japanese", value: "ja" },
  { name: "Korean", value: "ko" },
  { name: "Filipino", value: "fil" },
  { name: "Bahasa Melayu", value: "ms" },
  { name: "Bahasa Indonesia", value: "id" },
  { name: "简体中文", value: "zh-CN" },
  { name: "繁體中文", value: "zh-TW" },
] as const;

export async function buildCommandBodies(): Promise<
  RESTPostAPIApplicationCommandsJSONBody[]
> {
  const games = await listPublishedGames(25);
  const gameChoices = games.map((g) => ({
    name: `${g.title} (${g.platform})`.slice(0, 100),
    value: g.id,
  }));

  const sessions = new SlashCommandBuilder()
    .setName("sessions")
    .setDescription("List upcoming JustVibing sessions")
    .addStringOption((opt) => {
      opt
        .setName("game")
        .setDescription("Filter by game")
        .setRequired(false);
      if (gameChoices.length > 0) {
        opt.addChoices(...gameChoices);
      }
      return opt;
    });

  const schedule = new SlashCommandBuilder()
    .setName("schedule")
    .setDescription("Schedule a JustVibing session")
    .addStringOption((opt) => {
      opt
        .setName("game")
        .setDescription("Published game")
        .setRequired(true);
      if (gameChoices.length > 0) {
        opt.addChoices(...gameChoices);
      }
      return opt;
    })
    .addStringOption((opt) =>
      opt
        .setName("locale")
        .setDescription("Title language")
        .setRequired(false)
        .addChoices(...LOCALE_CHOICES),
    );

  return [sessions.toJSON(), schedule.toJSON()];
}

export async function registerGuildCommands(options: {
  token: string;
  clientId: string;
  guildId: string;
}) {
  const rest = new REST({ version: "10" }).setToken(options.token);
  const body = await buildCommandBodies();
  await rest.put(
    Routes.applicationGuildCommands(options.clientId, options.guildId),
    { body },
  );
  console.log(
    `Registered ${body.length} guild commands for guild ${options.guildId}`,
  );
}
