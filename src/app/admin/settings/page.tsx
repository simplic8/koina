"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
  MAX_CHAT_REFRESH_INTERVAL_SECONDS,
  MIN_CHAT_REFRESH_INTERVAL_SECONDS,
} from "@/lib/site-settings-constants";

export default function AdminSettingsPage() {
  const [intervalSeconds, setIntervalSeconds] = useState(
    DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
  );
  const [min, setMin] = useState(MIN_CHAT_REFRESH_INTERVAL_SECONDS);
  const [max, setMax] = useState(MAX_CHAT_REFRESH_INTERVAL_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const data = (await res.json()) as {
        error?: string;
        chatRefreshIntervalSeconds?: number;
        min?: number;
        max?: number;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load settings");
      setIntervalSeconds(
        data.chatRefreshIntervalSeconds ??
          DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS,
      );
      if (data.min) setMin(data.min);
      if (data.max) setMax(data.max);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatRefreshIntervalSeconds: intervalSeconds }),
      });
      const data = (await res.json()) as {
        error?: string;
        chatRefreshIntervalSeconds?: number;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setIntervalSeconds(
        data.chatRefreshIntervalSeconds ?? intervalSeconds,
      );
      setMessage("Settings saved. Chat will pick this up on the next poll.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-3xl">Settings</h1>
      <p className="mb-8 text-ink-70">
        Site-wide knobs for community chat and Discord mirroring.
      </p>

      {loading ? (
        <p className="text-sm text-ink-70">Loading…</p>
      ) : (
        <form
          onSubmit={onSave}
          className="max-w-md rounded-[6px] border border-ink-08 bg-base p-5"
        >
          <h2 className="mb-4 text-lg">Chat</h2>
          <label className="block text-sm font-medium">
            Auto-refresh interval (seconds)
            <input
              type="number"
              min={min}
              max={max}
              step={1}
              required
              value={intervalSeconds}
              onChange={(e) =>
                setIntervalSeconds(Number.parseInt(e.target.value, 10) || min)
              }
              className="mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />
          </label>
          <p className="mt-2 text-xs text-ink-40">
            Default {DEFAULT_CHAT_REFRESH_INTERVAL_SECONDS}s. Allowed range{" "}
            {min}–{max}s. The chat UI polls for new messages on this schedule
            and pulls from Discord when due.
          </p>

          {error && <p className="mt-4 text-sm text-accent-600">{error}</p>}
          {message && <p className="mt-4 text-sm text-ink-70">{message}</p>}

          <div className="mt-5">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
