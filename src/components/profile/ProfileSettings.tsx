"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { AvatarImage } from "@/components/ui/AvatarImage";
import {
  linkOAuthProvider,
  unlinkOAuthProvider,
} from "@/lib/auth/oauth";
import { LanguageSelect } from "@/components/i18n/LanguageSelect";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { normalizeUsername } from "@/lib/auth/username";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile;
  email: string | null;
  hasEmailIdentity: boolean;
  hasGoogleIdentity: boolean;
  hasDiscordIdentity: boolean;
  identityCount: number;
};

const inputClass =
  "mt-1.5 w-full rounded-[6px] border border-ink-15 px-3.5 py-2.5 text-sm outline-none focus:border-ink";

function initials(name: string | null) {
  const cleaned = name?.trim() || "P";
  return cleaned.slice(0, 2).toUpperCase();
}

export function ProfileSettings({
  profile,
  email,
  hasEmailIdentity,
  hasGoogleIdentity,
  hasDiscordIdentity,
  identityCount,
}: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(
    normalizeUsername(profile.username ?? ""),
  );
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [usernameMsg, setUsernameMsg] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [googleLinked, setGoogleLinked] = useState(hasGoogleIdentity);
  const [discordLinked, setDiscordLinked] = useState(hasDiscordIdentity);
  const [linkCount, setLinkCount] = useState(identityCount);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState<"google" | "discord" | null>(null);

  useEffect(() => {
    setGoogleLinked(hasGoogleIdentity);
    setDiscordLinked(hasDiscordIdentity);
    setLinkCount(identityCount);
  }, [hasGoogleIdentity, hasDiscordIdentity, identityCount]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromError = params.get("error");
    const fromMessage = params.get("message");
    if (fromError) setLinkError(fromError);
    if (fromMessage) setLinkMessage(fromMessage);
    if (fromError || fromMessage) {
      window.history.replaceState({}, "", "/profile");
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onLink(provider: "google" | "discord") {
    setLinkError(null);
    setLinkMessage(null);
    setLinkBusy(provider);
    const { error } = await linkOAuthProvider(provider, "/profile");
    if (error) {
      setLinkError(error);
      setLinkBusy(null);
    }
  }

  async function onUnlink(provider: "google" | "discord") {
    setLinkError(null);
    setLinkMessage(null);
    setLinkBusy(provider);
    const { error } = await unlinkOAuthProvider(provider);
    if (error) {
      setLinkError(error);
      setLinkBusy(null);
      return;
    }
    if (provider === "google") setGoogleLinked(false);
    if (provider === "discord") setDiscordLinked(false);
    setLinkCount((n) => Math.max(1, n - 1));
    setLinkMessage(
      t("settings.unlinked", {
        provider: provider === "google" ? "Google" : "Discord",
      }),
    );
    setLinkBusy(null);
    router.refresh();
  }

  async function saveProfileNames(event: FormEvent) {
    event.preventDefault();
    setUsernameError(null);
    setUsernameMsg(null);
    setUsernameSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName }),
      });
      const data = (await response.json()) as {
        error?: string;
        username?: string;
        display_name?: string | null;
      };
      if (!response.ok) {
        throw new Error(data.error ?? t("settings.updateFailed"));
      }
      setUsername(data.username ?? username);
      setDisplayName(data.display_name ?? "");
      setUsernameMsg(t("settings.nameUpdated"));
      router.refresh();
    } catch (err) {
      setUsernameError(
        err instanceof Error ? err.message : t("settings.updateFailed"),
      );
    } finally {
      setUsernameSaving(false);
    }
  }

  function onPickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setAvatarError(null);
    setAvatarMsg(null);
  }

  async function uploadAvatar() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setAvatarError(t("settings.chooseImage"));
      return;
    }
    setAvatarSaving(true);
    setAvatarError(null);
    setAvatarMsg(null);
    try {
      const form = new FormData();
      form.set("avatar", file);
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        error?: string;
        avatar_url?: string;
      };
      if (!response.ok) throw new Error(data.error ?? t("settings.uploadFailed"));
      setAvatarUrl(data.avatar_url ?? null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
      setAvatarMsg(t("settings.avatarUpdated"));
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : t("settings.uploadFailed"));
    } finally {
      setAvatarSaving(false);
    }
  }

  async function removeAvatar() {
    setAvatarSaving(true);
    setAvatarError(null);
    setAvatarMsg(null);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? t("settings.removePhotoFailed"));
      setAvatarUrl(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
      setAvatarMsg(t("settings.avatarRemoved"));
      router.refresh();
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : t("settings.removePhotoFailed"),
      );
    } finally {
      setAvatarSaving(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordError(null);
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"));
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? t("settings.passwordFailed"));
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg(t("settings.passwordUpdated"));
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : t("settings.passwordFailed"),
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function deleteAccount(event: FormEvent) {
    event.preventDefault();
    setDeleteError(null);
    setDeleting(true);
    try {
      const response = await fetch("/api/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirm: deleteConfirm,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? t("settings.deleteFailed"));
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : t("settings.deleteFailed"),
      );
      setDeleting(false);
    }
  }

  const displayImage = previewUrl || avatarUrl;

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-[8px] border border-ink-08 bg-surface p-6">
        <h2 className="mb-1 text-xl">{t("profile.language")}</h2>
        <p className="mb-5 text-sm text-ink-70">{t("profile.languageHint")}</p>
        <LanguageSelect />
      </section>

      <section className="rounded-[8px] border border-ink-08 bg-surface p-6">
        <h2 className="mb-1 text-xl">{t("settings.avatarTitle")}</h2>
        <p className="mb-5 text-sm text-ink-70">
          {t("settings.avatarHint")}
        </p>
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink-15 bg-base">
            <AvatarImage
              src={displayImage}
              className="h-full w-full object-cover"
              fallback={
                <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold text-ink-40">
                  {initials(
                    displayName || username || profile.display_name || profile.username,
                  )}
                </span>
              }
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={onPickAvatar}
              className="block w-full text-sm text-ink-70 file:mr-3 file:cursor-pointer file:rounded-[6px] file:border file:border-ink-15 file:bg-base file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={uploadAvatar}
                disabled={avatarSaving}
              >
                {avatarSaving ? t("settings.uploading") : t("settings.upload")}
              </Button>
              {(avatarUrl || previewUrl) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={removeAvatar}
                  disabled={avatarSaving}
                >
                  {t("settings.remove")}
                </Button>
              )}
            </div>
          </div>
        </div>
        {avatarError && (
          <p className="mt-3 text-sm text-accent-600">{avatarError}</p>
        )}
        {avatarMsg && <p className="mt-3 text-sm text-ink-70">{avatarMsg}</p>}
      </section>

      <section className="rounded-[8px] border border-ink-08 bg-surface p-6">
        <h2 className="mb-1 text-xl">{t("settings.nameTitle")}</h2>
        <p className="mb-5 text-sm text-ink-70">
          {t("settings.nameLead")}
        </p>
        <form onSubmit={saveProfileNames} className="flex flex-col gap-4">
          <label className="block text-sm font-medium">
            {t("auth.username")}
            <input
              required
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9_\-.]+"
              title={t("auth.usernameFormat")}
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.replace(/\s+/g, ""))
              }
              className={inputClass}
              autoComplete="username"
              spellCheck={false}
            />
            <span className="mt-1 block text-xs font-normal text-ink-40">
              {t("settings.usernameHint")}
            </span>
          </label>
          <label className="block text-sm font-medium">
            {t("settings.displayName")}
            <input
              maxLength={48}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder={t("settings.displayNamePlaceholder")}
              autoComplete="nickname"
            />
          </label>
          {email && (
            <p className="text-sm text-ink-40">
              {t("settings.signedInAs")} <span className="text-ink-70">{email}</span>
            </p>
          )}
          {usernameError && (
            <p className="text-sm text-accent-600">{usernameError}</p>
          )}
          {usernameMsg && (
            <p className="text-sm text-ink-70">{usernameMsg}</p>
          )}
          <div>
            <Button type="submit" disabled={usernameSaving}>
              {usernameSaving ? t("profile.saving") : t("settings.save")}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[8px] border border-ink-08 bg-surface p-6">
        <h2 className="mb-1 text-xl">{t("settings.linkedTitle")}</h2>
        <p className="mb-5 text-sm text-ink-70">
          {t("settings.linkedLead")}
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-ink-08 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Google</p>
              <p className="text-xs text-ink-40">
                {googleLinked ? t("settings.linked") : t("settings.notLinked")}
              </p>
            </div>
            {googleLinked ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={linkBusy !== null || linkCount <= 1}
                onClick={() => onUnlink("google")}
              >
                {linkBusy === "google" ? t("settings.unlinking") : t("settings.unlink")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={linkBusy !== null}
                onClick={() => onLink("google")}
              >
                {linkBusy === "google" ? t("settings.redirecting") : t("settings.linkGoogle")}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-ink-08 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Discord</p>
              <p className="text-xs text-ink-40">
                {discordLinked ? t("settings.linked") : t("settings.notLinked")}
              </p>
            </div>
            {discordLinked ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={linkBusy !== null || linkCount <= 1}
                onClick={() => onUnlink("discord")}
              >
                {linkBusy === "discord" ? t("settings.unlinking") : t("settings.unlink")}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="dark"
                disabled={linkBusy !== null}
                onClick={() => onLink("discord")}
              >
                {linkBusy === "discord" ? t("settings.redirecting") : t("settings.linkDiscord")}
              </Button>
            )}
          </div>
        </div>
        {linkCount <= 1 && (googleLinked || discordLinked) && (
          <p className="mt-3 text-xs text-ink-40">
            {t("settings.keepOne")}
          </p>
        )}
        {linkError && (
          <p className="mt-3 text-sm text-accent-600">{linkError}</p>
        )}
        {linkMessage && (
          <p className="mt-3 text-sm text-ink-70">{linkMessage}</p>
        )}
      </section>

      <section className="rounded-[8px] border border-ink-08 bg-surface p-6">
        <h2 className="mb-1 text-xl">{t("settings.passwordTitle")}</h2>
        {hasEmailIdentity ? (
          <>
            <p className="mb-5 text-sm text-ink-70">
              {t("settings.passwordLead")}
            </p>
            <form onSubmit={changePassword} className="flex flex-col gap-4">
              <label className="block text-sm font-medium">
                {t("settings.currentPassword")}
                <input
                  type="password"
                  required
                  minLength={6}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                />
              </label>
              <label className="block text-sm font-medium">
                {t("settings.newPassword")}
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm font-medium">
                {t("settings.confirmPassword")}
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </label>
              {passwordError && (
                <p className="text-sm text-accent-600">{passwordError}</p>
              )}
              {passwordMsg && (
                <p className="text-sm text-ink-70">{passwordMsg}</p>
              )}
              <div>
                <Button type="submit" disabled={passwordSaving}>
                  {passwordSaving ? t("settings.updatingPassword") : t("settings.updatePassword")}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <p className="text-sm text-ink-70">
            {t("settings.oauthNoPassword")}
          </p>
        )}
      </section>

      <section className="rounded-[8px] border border-[#e11d48]/30 bg-surface p-6">
        <h2 className="mb-1 text-xl text-[#e11d48]">{t("settings.deleteTitle")}</h2>
        <p className="mb-5 text-sm text-ink-70">
          {t("settings.deleteLead")}
        </p>
        <form onSubmit={deleteAccount} className="flex flex-col gap-4">
          {hasEmailIdentity && (
            <label className="block text-sm font-medium">
              {t("auth.password")}
              <input
                type="password"
                required
                minLength={6}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </label>
          )}
          <label className="block text-sm font-medium">
            {t("settings.deleteTypePrompt")}
            <input
              required
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className={inputClass}
              placeholder="DELETE"
              autoComplete="off"
            />
          </label>
          {deleteError && (
            <p className="text-sm text-accent-600">{deleteError}</p>
          )}
          <div>
            <Button type="submit" variant="dark" disabled={deleting}>
              {deleting ? t("settings.deleting") : t("settings.deleteButton")}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
