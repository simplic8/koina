import type { SupabaseClient } from "@supabase/supabase-js";

export type ForumTallies = Record<string, Record<string, number>>;

export type ForumTallyMeta = Record<
  string,
  Record<
    string,
    {
      en?: string;
      ja?: string;
      label?: string;
      name?: string;
      kind?: string;
    }
  >
>;

export async function loadForumTallies(
  supabase: SupabaseClient,
  sessionId: string,
): Promise<{ tallies: ForumTallies; meta: ForumTallyMeta }> {
  const { data, error } = await supabase
    .from("forum_responses")
    .select("activity_key, option_key, payload")
    .eq("session_id", sessionId);

  if (error || !data) return { tallies: {}, meta: {} };

  const tallies: ForumTallies = {};
  const meta: ForumTallyMeta = {};

  for (const row of data) {
    const activity = row.activity_key as string;
    const option = row.option_key as string;
    const payload = (row.payload ?? {}) as {
      count?: number;
      en?: string;
      ja?: string;
      label?: string | null;
      name?: string;
      kind?: string;
    };
    const n =
      typeof payload.count === "number" && Number.isFinite(payload.count)
        ? payload.count
        : 1;
    if (!tallies[activity]) tallies[activity] = {};
    tallies[activity][option] =
      (tallies[activity][option] ?? 0) + Math.max(0, n);

    if (
      payload.en ||
      payload.ja ||
      payload.label ||
      payload.name ||
      payload.kind
    ) {
      if (!meta[activity]) meta[activity] = {};
      meta[activity][option] = {
        en: typeof payload.en === "string" ? payload.en : undefined,
        ja: typeof payload.ja === "string" ? payload.ja : undefined,
        label:
          typeof payload.label === "string" ? payload.label : undefined,
        name: typeof payload.name === "string" ? payload.name : undefined,
        kind: typeof payload.kind === "string" ? payload.kind : undefined,
      };
    }
  }

  return { tallies, meta };
}
