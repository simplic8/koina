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
      `${provider === "google" ? "Google" : "Discord"} unlinked.`,
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
        throw new Error(data.error ?? "Could not update profile.");
      }
      setUsername(data.username ?? username);
      setDisplayName(data.display_name ?? "");
      setUsernameMsg("Profile name updated.");
      router.refresh();
    } catch (err) {
      setUsernameError(
        err instanceof Error ? err.message : "Could not update profile.",
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
      setAvatarError("Choose an image first.");
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
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      setAvatarUrl(data.avatar_url ?? null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
      setAvatarMsg("Profile picture updated.");
      router.refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed.");
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
      if (!response.ok) throw new Error(data.error ?? "Could not remove photo.");
      setAvatarUrl(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
      setAvatarMsg("Profile picture removed.");
      router.refresh();
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Could not remove photo.",
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
      setPasswordError("New passwords do not match.");
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
        throw new Error(data.error ?? "Could not change password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg("Password updated.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Could not change password.",
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
        throw new Error(data.error ?? "Could not delete account.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete account.",
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
        <h2 className="mb-1 text-xl">Profile picture</h2>
        <p className="mb-5 text-sm text-ink-70">
          JPEG, PNG, WebP, or GIF up to 2MB.
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
                {avatarSaving ? "Uploading…" : "Upload"}
              </Button>
              {(avatarUrl || previewUrl) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={removeAvatar}
                  disabled={avatarSaving}
                >
                  Remove
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
        <h2 className="mb-1 text-xl">Name</h2>
        <p className="mb-5 text-sm text-ink-70">
          Username is your unique handle (no spaces). Display name is how you
          appear to others.
        </p>
        <form onSubmit={saveProfileNames} className="flex flex-col gap-4">
          <label className="block text-sm font-medium">
            Username
            <input
              required
              minLength={2}
              maxLength={32}
              pattern="[A-Za-z0-9_\-.]+"
              title="Letters, numbers, hyphens, dots, or underscores — no spaces"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.replace(/\s+/g, ""))
              }
              className={inputClass}
              autoComplete="username"
              spellCheck={false}
            />
            <span className="mt-1 block text-xs font-normal text-ink-40">
              No spaces. Letters, numbers, hyphens, dots, underscores.
            </span>
          </label>
          <label className="block text-sm font-medium">
            Display name
            <input
              maxLength={48}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              placeholder="Optional — spaces allowed"
              autoComplete="nickname"
            />
          </label>
          {email && (
            <p className="text-sm text-ink-40">
              Signed in as <span className="text-ink-70">{email}</span>
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
              {usernameSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[8px] border border-ink-08 bg-surface p-6">
        <h2 className="mb-1 text-xl">Linked accounts</h2>
        <p className="mb-5 text-sm text-ink-70">
          Connect Google or Discord to sign in faster. Discord also lets chat
          posts show as you in #web.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-ink-08 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Google</p>
              <p className="text-xs text-ink-40">
                {googleLinked ? "Linked" : "Not linked"}
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
                {linkBusy === "google" ? "Unlinking…" : "Unlink"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                disabled={linkBusy !== null}
                onClick={() => onLink("google")}
              >
                {linkBusy === "google" ? "Redirecting…" : "Link Google"}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-ink-08 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Discord</p>
              <p className="text-xs text-ink-40">
                {discordLinked ? "Linked" : "Not linked"}
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
                {linkBusy === "discord" ? "Unlinking…" : "Unlink"}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="dark"
                disabled={linkBusy !== null}
                onClick={() => onLink("discord")}
              >
                {linkBusy === "discord" ? "Redirecting…" : "Link Discord"}
              </Button>
            )}
          </div>
        </div>
        {linkCount <= 1 && (googleLinked || discordLinked) && (
          <p className="mt-3 text-xs text-ink-40">
            Keep at least one sign-in method linked.
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
        <h2 className="mb-1 text-xl">Password</h2>
        {hasEmailIdentity ? (
          <>
            <p className="mb-5 text-sm text-ink-70">
              Change the password you use to sign in with email.
            </p>
            <form onSubmit={changePassword} className="flex flex-col gap-4">
              <label className="block text-sm font-medium">
                Current password
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
                New password
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
                Confirm new password
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
                  {passwordSaving ? "Updating…" : "Update password"}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <p className="text-sm text-ink-70">
            This account signs in with Google or Discord, so there&apos;s no
            email password to change here.
          </p>
        )}
      </section>

      <section className="rounded-[8px] border border-[#e11d48]/30 bg-surface p-6">
        <h2 className="mb-1 text-xl text-[#e11d48]">Delete account</h2>
        <p className="mb-5 text-sm text-ink-70">
          Permanently delete your account and profile data. This cannot be
          undone.
        </p>
        <form onSubmit={deleteAccount} className="flex flex-col gap-4">
          {hasEmailIdentity && (
            <label className="block text-sm font-medium">
              Password
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
            Type DELETE to confirm
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
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
