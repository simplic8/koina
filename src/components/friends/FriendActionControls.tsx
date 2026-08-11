"use client";

import { Button } from "@/components/ui/Button";
import type { FriendshipStatus } from "@/lib/types";

type Labels = {
  add: string;
  pending: string;
  accept: string;
  decline: string;
  remove: string;
  cancel: string;
};

export async function applyFriendAction(
  userId: string,
  action: "request" | "accept" | "cancel" | "remove",
): Promise<FriendshipStatus> {
  if (action === "request") {
    const response = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const payload = (await response.json()) as {
      error?: string;
      status?: FriendshipStatus;
    };
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    return (payload.status ?? "outgoing") as FriendshipStatus;
  }

  if (action === "accept") {
    const response = await fetch(`/api/friends/${userId}/accept`, {
      method: "POST",
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error || "Accept failed.");
    return "friends";
  }

  const response = await fetch(`/api/friends/${userId}`, { method: "DELETE" });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(payload.error || "Update failed.");
  return "none";
}

export function FriendActionControls({
  userId,
  status,
  busy,
  disabled,
  labels,
  onBusy,
  onChange,
  onError,
}: {
  userId: string;
  status: FriendshipStatus;
  busy: boolean;
  disabled?: boolean;
  labels: Labels;
  onBusy: (busy: boolean) => void;
  onChange: (next: FriendshipStatus) => void;
  onError?: (message: string) => void;
}) {
  async function run(action: "request" | "accept" | "cancel" | "remove") {
    onBusy(true);
    try {
      const next = await applyFriendAction(userId, action);
      onChange(next);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Update failed.");
    } finally {
      onBusy(false);
    }
  }

  if (status === "incoming") {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          size="sm"
          disabled={busy || disabled}
          onClick={() => void run("accept")}
        >
          {busy ? "…" : labels.accept}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || disabled}
          onClick={() => void run("cancel")}
        >
          {busy ? "…" : labels.decline}
        </Button>
      </div>
    );
  }

  if (status === "outgoing") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || disabled}
        onClick={() => void run("cancel")}
        title={labels.pending}
      >
        {busy ? "…" : labels.cancel}
      </Button>
    );
  }

  if (status === "friends") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy || disabled}
        onClick={() => void run("remove")}
      >
        {busy ? "…" : labels.remove}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={busy || disabled}
      onClick={() => void run("request")}
    >
      {busy ? "…" : labels.add}
    </Button>
  );
}
