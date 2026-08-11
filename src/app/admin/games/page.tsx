"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LOCALES, type LocaleCode } from "@/lib/i18n/locales";
import type { Game, GameTranslation } from "@/lib/types";

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  roblox_universe_id: "",
  roblox_place_id: "",
  ordered_datastore_id: "PlayerScores",
  sort_order: 0,
};

const TRANSLATION_LOCALES = LOCALES.filter((locale) => locale.code !== "en");

function translationDraft(
  game: Game,
  locale: LocaleCode,
): { title: string; description: string } {
  const existing = game.translations?.find((row) => row.locale === locale);
  return {
    title: existing?.title ?? "",
    description: existing?.description ?? "",
  };
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLocale, setEditLocale] = useState<LocaleCode>("ja");
  const [draft, setDraft] = useState({ title: "", description: "" });

  async function load() {
    const res = await fetch("/api/admin/games");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to load games");
      return;
    }
    setGames(data.games ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const editingGame = useMemo(
    () => games.find((game) => game.id === editingId) ?? null,
    [games, editingId],
  );

  useEffect(() => {
    if (!editingGame) return;
    setDraft(translationDraft(editingGame, editLocale));
  }, [editingGame, editLocale]);

  async function createGame(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Create failed");
      return;
    }
    setForm(emptyForm);
    await load();
  }

  async function patch(id: string, patchBody: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patchBody }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Update failed");
      return;
    }
    await load();
  }

  async function saveTranslation(game: Game) {
    const title = draft.title.trim();
    if (!title) {
      setError("Translation title is required.");
      return;
    }

    const next: GameTranslation = {
      locale: editLocale,
      title,
      description: draft.description.trim() || null,
    };
    const others =
      game.translations?.filter((row) => row.locale !== editLocale) ?? [];

    await patch(game.id, { translations: [...others, next] });
    setMessage(`Saved ${editLocale} translation for ${game.title}`);
  }

  async function remove(id: string) {
    if (!confirm("Delete this game?")) return;
    setBusy(true);
    const res = await fetch(`/api/admin/games?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Delete failed");
      return;
    }
    if (editingId === id) setEditingId(null);
    await load();
  }

  async function syncScores(gameId: string) {
    setBusy(true);
    setMessage(null);
    setError(null);
    const res = await fetch(`/api/roblox/sync?gameId=${gameId}`, {
      method: "POST",
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Sync failed");
      return;
    }
    setMessage(`Synced ${data.synced ?? 0} scores`);
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl">Games</h1>
      <p className="mb-8 text-ink-70">
        Vet and publish Roblox experiences. Configure Open Cloud IDs for score
        sync, and manage per-locale titles/descriptions.
      </p>

      {error && <p className="mb-4 text-sm text-accent-600">{error}</p>}
      {message && <p className="mb-4 text-sm text-ink-70">{message}</p>}

      <form
        onSubmit={createGame}
        className="mb-10 grid gap-3 rounded-[6px] border border-ink-08 bg-base p-5 md:grid-cols-2"
      >
        <h2 className="md:col-span-2 text-lg">Add game</h2>
        {(
          [
            ["title", "Title"],
            ["slug", "Slug (optional)"],
            ["description", "Description"],
            ["roblox_universe_id", "Roblox universe ID"],
            ["roblox_place_id", "Roblox place ID"],
            ["ordered_datastore_id", "Ordered DataStore ID"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm font-medium">
            {label}
            <input
              value={form[key]}
              onChange={(e) =>
                setForm((f) => ({ ...f, [key]: e.target.value }))
              }
              className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3 py-2 text-sm"
              required={key === "title"}
            />
          </label>
        ))}
        <label className="block text-sm font-medium">
          Sort order
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))
            }
            className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3 py-2 text-sm"
          />
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy}>
            Create draft
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="rounded-[6px] border border-ink-08 bg-base p-5"
          >
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg">{game.title}</h3>
                <p className="font-[family-name:var(--font-ibm-plex-mono)] text-xs text-ink-40">
                  {game.slug} · universe {game.roblox_universe_id ?? "—"} · DS{" "}
                  {game.ordered_datastore_id ?? "—"} ·{" "}
                  {game.translations?.length ?? 0} translations
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {game.is_vetted ? (
                  <Badge tone="vetted">Vetted</Badge>
                ) : (
                  <Badge>Draft</Badge>
                )}
                {game.is_published && <Badge tone="live">Published</Badge>}
                {game.is_featured && <Badge>Featured</Badge>}
              </div>
            </div>
            <p className="mb-4 text-sm text-ink-70">{game.description}</p>
            <div className="flex flex-wrap gap-2">
              {!game.is_vetted && (
                <Button
                  size="sm"
                  variant="dark"
                  disabled={busy}
                  onClick={() => patch(game.id, { is_vetted: true })}
                >
                  Mark vetted
                </Button>
              )}
              {game.is_vetted && !game.is_published && (
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => patch(game.id, { is_published: true })}
                >
                  Publish
                </Button>
              )}
              {game.is_published && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => patch(game.id, { is_published: false })}
                >
                  Unpublish
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  patch(game.id, { is_featured: !game.is_featured })
                }
              >
                {game.is_featured ? "Unfeature" : "Feature"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || !game.roblox_universe_id}
                onClick={() => syncScores(game.id)}
              >
                Sync scores
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  setEditingId((current) =>
                    current === game.id ? null : game.id,
                  )
                }
              >
                {editingId === game.id ? "Hide translations" : "Translations"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => remove(game.id)}
              >
                Delete
              </Button>
            </div>

            {editingId === game.id && (
              <div className="mt-5 rounded-[6px] border border-ink-08 bg-surface p-4">
                <div className="mb-3 flex flex-wrap items-end gap-3">
                  <label className="block text-sm font-medium">
                    Locale
                    <select
                      value={editLocale}
                      onChange={(e) =>
                        setEditLocale(e.target.value as LocaleCode)
                      }
                      className="mt-1.5 block rounded-[6px] border border-ink-15 bg-base px-3 py-2 text-sm"
                    >
                      {TRANSLATION_LOCALES.map((locale) => (
                        <option key={locale.code} value={locale.code}>
                          {locale.nativeLabel} ({locale.label})
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="pb-2 text-xs text-ink-40">
                    English comes from the base game title/description above.
                  </p>
                </div>
                <label className="mb-3 block text-sm font-medium">
                  Title
                  <input
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        title: e.target.value,
                      }))
                    }
                    className="mt-1.5 w-full rounded-[6px] border border-ink-15 bg-base px-3 py-2 text-sm"
                  />
                </label>
                <label className="mb-4 block text-sm font-medium">
                  Description
                  <textarea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1.5 w-full rounded-[6px] border border-ink-15 bg-base px-3 py-2 text-sm"
                  />
                </label>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => saveTranslation(game)}
                >
                  Save translation
                </Button>
              </div>
            )}
          </div>
        ))}
        {!games.length && (
          <p className="text-sm text-ink-40">
            No games yet. Create one above, or run the Supabase migration seed.
          </p>
        )}
      </div>
    </div>
  );
}
