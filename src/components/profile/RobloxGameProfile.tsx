"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { GameProfile } from "@/lib/types";

const inputClass =
  "mt-1.5 w-full rounded-[6px] border border-ink-15 bg-base px-3.5 py-2.5 text-sm outline-none focus:border-ink";

type Props = {
  initial: GameProfile | null;
};

export function RobloxGameProfile({ initial }: Props) {
  const { t } = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState(initial?.roblox_username ?? "");
  const [displayName, setDisplayName] = useState(
    initial?.roblox_display_name ?? "",
  );
  const [bio, setBio] = useState(initial?.roblox_bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.roblox_avatar_url ?? "");
  const [onlineStatus, setOnlineStatus] = useState(
    initial?.roblox_online_status ?? "",
  );
  const [robloxUserId, setRobloxUserId] = useState(
    initial?.roblox_user_id ?? "",
  );
  const [syncedAt, setSyncedAt] = useState(initial?.roblox_synced_at ?? null);
  const [busy, setBusy] = useState<"save" | "sync" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyProfile(profile: GameProfile) {
    setUsername(profile.roblox_username ?? "");
    setDisplayName(profile.roblox_display_name ?? "");
    setBio(profile.roblox_bio ?? "");
    setAvatarUrl(profile.roblox_avatar_url ?? "");
    setOnlineStatus(profile.roblox_online_status ?? "");
    setRobloxUserId(profile.roblox_user_id ?? "");
    setSyncedAt(profile.roblox_synced_at);
  }

  async function onSync() {
    setBusy("sync");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/profile/game-profiles/roblox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = (await response.json()) as {
        error?: string;
        profile?: GameProfile;
      };
      if (!response.ok) {
        throw new Error(data.error || t("profile.roblox.syncError"));
      }
      if (data.profile) applyProfile(data.profile);
      setMessage(t("profile.roblox.synced"));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("profile.roblox.syncError"),
      );
    } finally {
      setBusy(null);
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy("save");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/profile/game-profiles/roblox", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          displayName,
          bio,
          avatarUrl: avatarUrl || null,
          onlineStatus: onlineStatus || null,
          robloxUserId: robloxUserId || null,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        profile?: GameProfile;
      };
      if (!response.ok) {
        throw new Error(data.error || t("profile.roblox.saveError"));
      }
      if (data.profile) applyProfile(data.profile);
      setMessage(t("profile.roblox.saved"));
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("profile.roblox.saveError"),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <form onSubmit={onSave} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t("profile.roblox.title")}</h3>
        <p className="mt-1 text-sm text-ink-70">{t("profile.roblox.lead")}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[6px] border border-ink-08 bg-ink-08">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || username || "Roblox avatar"}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs font-semibold text-ink-40">
              {t("profile.roblox.noAvatar")}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <label className="block text-sm font-semibold">
            {t("profile.roblox.username")}
            <div className="mt-1.5 flex flex-wrap gap-2">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className={`${inputClass} mt-0 min-w-[12rem] flex-1`}
                placeholder={t("profile.roblox.usernamePlaceholder")}
                autoComplete="off"
                maxLength={20}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null || !username.trim()}
                onClick={onSync}
              >
                {busy === "sync"
                  ? t("profile.roblox.syncing")
                  : t("profile.roblox.pullFromRoblox")}
              </Button>
            </div>
          </label>
          {syncedAt ? (
            <p className="text-xs text-ink-40">
              {t("profile.roblox.lastSynced", {
                when: new Date(syncedAt).toLocaleString(),
              })}
            </p>
          ) : null}
        </div>
      </div>

      <label className="block text-sm font-semibold">
        {t("profile.roblox.displayName")}
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={inputClass}
          maxLength={64}
        />
      </label>

      <label className="block text-sm font-semibold">
        {t("profile.roblox.onlineStatus")}
        <input
          value={onlineStatus}
          onChange={(event) => setOnlineStatus(event.target.value)}
          className={inputClass}
          maxLength={64}
        />
      </label>

      <label className="block text-sm font-semibold">
        {t("profile.roblox.bio")}
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          className={`${inputClass} min-h-[120px] resize-y`}
          maxLength={1000}
        />
      </label>

      {robloxUserId ? (
        <p className="text-xs text-ink-40">
          {t("profile.roblox.userId")}: {robloxUserId}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-accent-600">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="text-sm text-ink-70" aria-live="polite">
          {message}
        </p>
      ) : null}

      <Button type="submit" disabled={busy !== null}>
        {busy === "save" ? t("profile.saving") : t("profile.roblox.save")}
      </Button>
    </form>
  );
}
