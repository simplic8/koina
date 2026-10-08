"use client";

import { useEffect, useState } from "react";

type Props = {
  sessionId: string;
  initialLive: boolean;
};

export function ForumLiveStatus({ sessionId, initialLive }: Props) {
  const [live, setLive] = useState(initialLive);

  useEffect(() => {
    setLive(initialLive);
  }, [initialLive]);

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const res = await fetch(`/api/forum/sessions/${sessionId}/sync`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { is_live?: boolean };
        if (typeof data.is_live === "boolean") setLive(data.is_live);
      } catch {
        // ignore transient errors
      }
    }

    void pull();
    const id = window.setInterval(pull, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId]);

  return (
    <span className="font-semibold text-ink">
      {live ? "Live" : "Not marked live yet"}
    </span>
  );
}
