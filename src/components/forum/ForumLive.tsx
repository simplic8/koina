"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  applyTalliesToIframe,
  wireIframeActivities,
  type TalliesPayload,
} from "@/lib/forum/activity-dom";
import { createClient } from "@/lib/supabase/client";
import type { ForumPresenterState, ForumSession } from "@/lib/types";

type Props = {
  session: ForumSession;
  mode: "present" | "view";
  isAdmin: boolean;
};

function participantKey() {
  if (typeof window === "undefined") return "server";
  const key = "koina-forum-participant";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

/** Per-tab id so present + view in the same browser never collide. */
function connectionKey(role: "present" | "view") {
  if (typeof window === "undefined") return `server:${role}`;
  const key = "koina-forum-tab";
  let tab = window.sessionStorage.getItem(key);
  if (!tab) {
    tab =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(key, tab);
  }
  return `${role}:${tab}`;
}

function withSlideIndex(
  state: ForumPresenterState,
  fallback?: ForumPresenterState,
): ForumPresenterState & { slideIndex: number } {
  const slideIndex =
    typeof state.slideIndex === "number" && Number.isFinite(state.slideIndex)
      ? state.slideIndex
      : typeof fallback?.slideIndex === "number" &&
          Number.isFinite(fallback.slideIndex)
        ? fallback.slideIndex
        : 0;
  return {
    ...fallback,
    ...state,
    slideIndex: Math.max(0, Math.floor(slideIndex)),
  };
}

/** Same-origin deck iframe — read the real slide without postMessage. */
function readDeckStateFromIframe(
  iframe: HTMLIFrameElement | null,
): ForumPresenterState | null {
  try {
    const doc = iframe?.contentDocument;
    if (!doc?.body) return null;

    let slideIndex = 0;
    const pg = doc.querySelector("#pg") as HTMLInputElement | null;
    if (pg) {
      const n = parseInt(pg.value, 10);
      if (Number.isFinite(n) && n >= 1) slideIndex = n - 1;
    } else {
      const slides = Array.from(doc.querySelectorAll(".slide"));
      const onIdx = slides.findIndex((s) => s.classList.contains("on"));
      if (onIdx >= 0) {
        slideIndex = onIdx;
      } else {
        const hash = doc.defaultView?.location.hash.match(/^#s(\d+)$/);
        if (hash) slideIndex = Math.max(0, parseInt(hash[1], 10) - 1);
      }
    }

    let lang: ForumPresenterState["lang"] = "both";
    if (doc.body.classList.contains("m-ja")) lang = "ja";
    else if (doc.body.classList.contains("m-en")) lang = "en";

    const lb = doc.querySelector("#lightbox") as HTMLElement | null;
    const lightbox =
      lb && !lb.hidden
        ? {
            open: true as const,
            src: doc.querySelector("#lbImg")?.getAttribute("src") || "",
            alt: doc.querySelector("#lbImg")?.getAttribute("alt") || "",
            capHtml: doc.querySelector("#lbCap")?.innerHTML || "",
          }
        : { open: false as const };

    const qv = doc.querySelector("#qview") as HTMLElement | null;
    const qview =
      qv && !qv.hidden
        ? { open: true as const, index: null }
        : { open: false as const, index: null };

    return { slideIndex, lang, lightbox, qview };
  } catch {
    return null;
  }
}

type DeckWindow = Window & {
  __koinaForceGo?: (index: number, fromRemote?: boolean) => void;
};

/** Force a slide in the same-origin viewer iframe (bypasses postMessage). */
function applySlideToIframe(
  iframe: HTMLIFrameElement | null,
  state: ForumPresenterState,
) {
  try {
    const doc = iframe?.contentDocument;
    const win = iframe?.contentWindow as DeckWindow | null;
    if (!doc) return false;

    const slides = Array.from(doc.querySelectorAll<HTMLElement>(".slide"));
    if (!slides.length || typeof state.slideIndex !== "number") return false;

    const i = Math.max(0, Math.min(slides.length - 1, state.slideIndex));
    if (typeof win?.__koinaForceGo === "function") {
      win.__koinaForceGo(i, true);
    } else {
      slides.forEach((slide, idx) => {
        const on = idx === i;
        slide.classList.toggle("on", on);
        slide.style.setProperty("display", on ? "flex" : "none", "important");
      });
      const pg = doc.querySelector("#pg") as HTMLInputElement | null;
      if (pg) pg.value = String(i + 1);
      const pgTotal = doc.querySelector("#pgTotal");
      if (pgTotal) pgTotal.textContent = String(slides.length);
      const prog = doc.querySelector("#prog") as HTMLElement | null;
      if (prog) prog.style.width = `${((i + 1) / slides.length) * 100}%`;
      const secname = doc.querySelector("#secname");
      if (secname) {
        secname.textContent = slides[i]?.dataset.title || "";
      }
    }

    if (state.lang) {
      doc.body.classList.remove("m-en", "m-ja", "m-both");
      doc.body.classList.add(`m-${state.lang}`);
    }

    if (state.force || state.prompt) {
      const target = slides[i];
      if (target) {
        target.scrollTop = 0;
        target.classList.add("koina-sync-flash");
        window.setTimeout(
          () => target.classList.remove("koina-sync-flash"),
          700,
        );
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function ForumLive({ session, mode, isAdmin }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof createClient>>["channel"]
  > | null>(null);
  const subscribedRef = useRef(false);
  const pendingBroadcastRef = useRef<ForumPresenterState | null>(null);
  const frameReadyRef = useRef(false);
  const persistChainRef = useRef(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(session.is_live);
  const [status, setStatus] = useState("Connecting…");
  const [slideLabel, setSlideLabel] = useState<string>(() =>
    typeof session.presenter_state?.slideIndex === "number"
      ? `Slide ${session.presenter_state.slideIndex + 1}`
      : "",
  );
  const [promptNote, setPromptNote] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [presenterCount, setPresenterCount] = useState(0);
  const presenceFromDbRef = useRef(false);
  const participantKeyRef = useRef(participantKey());
  const connectionKeyRef = useRef(connectionKey(mode));
  const unwireActivitiesRef = useRef<(() => void) | null>(null);
  const lastTalliesRef = useRef<TalliesPayload | null>(null);
  const lastStateRef = useRef<ForumPresenterState>(
    session.presenter_state ?? {},
  );
  const lastAppliedSlideRef = useRef<number | undefined>(
    typeof session.presenter_state?.slideIndex === "number"
      ? session.presenter_state.slideIndex
      : undefined,
  );
  const lastSyncTokenRef = useRef<number | undefined>(
    session.presenter_state?.syncToken,
  );
  const lastBringTokenRef = useRef<number | undefined>(
    session.presenter_state?.bringToken,
  );
  const lastUpdatedAtRef = useRef<string | undefined>(session.updated_at);

  const postToFrame = useCallback((type: string, payload?: unknown) => {
    iframeRef.current?.contentWindow?.postMessage(
      { source: "koina-forum-host", type, payload },
      "*",
    );
  }, []);

  const markFrameReady = useCallback(() => {
    frameReadyRef.current = true;
    setReady(true);
  }, []);

  const persistState = useCallback(
    (state: ForumPresenterState) => {
      if (mode !== "present") return;
      const normalized = withSlideIndex(state, lastStateRef.current);

      const body: ForumPresenterState = {
        slideIndex: normalized.slideIndex,
        lang: normalized.lang,
        lightbox: normalized.lightbox ?? { open: false },
        qview: normalized.qview ?? { open: false, index: null },
        syncToken: normalized.syncToken ?? Date.now(),
        bringToken: normalized.bringToken,
      };

      persistChainRef.current = persistChainRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const res = await fetch(`/api/forum/sessions/${session.id}/sync`, {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ presenter_state: body }),
              cache: "no-store",
            });
            if (!res.ok) {
              const data = (await res.json()) as { error?: string };
              setError(data.error ?? "Could not sync slide to server.");
              return;
            }
            setLive(true);
            setError(null);
          } catch {
            setError("Could not sync slide to server.");
          }
        });
    },
    [mode, session.id],
  );

  const sendBroadcast = useCallback(
    (state: ForumPresenterState, event = "presenter-state") => {
      const channel = channelRef.current;
      if (!channel || !subscribedRef.current) {
        pendingBroadcastRef.current = state;
        return;
      }
      void channel.send({
        type: "broadcast",
        event,
        payload: state,
      });
    },
    [],
  );

  const pushToFrame = useCallback(
    (state: ForumPresenterState) => {
      if (!frameReadyRef.current) return;
      const applied = applySlideToIframe(iframeRef.current, {
        ...state,
        force: true,
      });
      // Keep postMessage as a secondary path for bridge-managed UI (lightbox etc.)
      postToFrame("force-slide", { ...state, force: true });
      if (!applied) {
        // Retry shortly — deck script may still be booting
        window.setTimeout(() => {
          applySlideToIframe(iframeRef.current, { ...state, force: true });
          postToFrame("force-slide", { ...state, force: true });
        }, 120);
      }
    },
    [postToFrame],
  );

  const applyViewerState = useCallback(
    (state: ForumPresenterState, updatedAt?: string) => {
      const normalized = withSlideIndex(state, lastStateRef.current);

      const tokenChanged =
        typeof normalized.syncToken === "number" &&
        normalized.syncToken !== lastSyncTokenRef.current;
      const bringChanged =
        typeof normalized.bringToken === "number" &&
        normalized.bringToken !== lastBringTokenRef.current;
      const slideChanged =
        normalized.slideIndex !== lastAppliedSlideRef.current;
      const forced = Boolean(state.force || state.prompt || bringChanged);
      const stampChanged = Boolean(
        updatedAt && updatedAt !== lastUpdatedAtRef.current,
      );

      if (!tokenChanged && !slideChanged && !forced && !stampChanged) return;

      lastStateRef.current = normalized;
      lastAppliedSlideRef.current = normalized.slideIndex;
      if (typeof normalized.syncToken === "number") {
        lastSyncTokenRef.current = normalized.syncToken;
      }
      if (typeof normalized.bringToken === "number") {
        lastBringTokenRef.current = normalized.bringToken;
      }
      if (updatedAt) lastUpdatedAtRef.current = updatedAt;
      setSlideLabel(`Slide ${normalized.slideIndex + 1}`);

      pushToFrame({ ...normalized, force: true, prompt: forced });

      if (state.prompt || bringChanged) {
        setPromptNote("Presenter moved everyone to their slide");
        window.setTimeout(() => setPromptNote(null), 2500);
      }
      setStatus(`Synced · slide ${normalized.slideIndex + 1}`);
    },
    [pushToFrame],
  );

  const broadcastState = useCallback(
    (state: ForumPresenterState, opts?: { bring?: boolean }) => {
      const normalized = withSlideIndex(state, lastStateRef.current);
      const token = state.syncToken ?? Date.now();
      const next: ForumPresenterState = {
        ...normalized,
        syncToken: token,
        bringToken: opts?.bring ? token : normalized.bringToken,
        force: opts?.bring || state.force,
        prompt: opts?.bring || state.prompt,
      };
      lastStateRef.current = next;
      if (typeof next.slideIndex === "number") {
        setSlideLabel(`Slide ${next.slideIndex + 1}`);
        setStatus(`Broadcasting · slide ${next.slideIndex + 1}`);
      }
      sendBroadcast(next);
      if (opts?.bring) {
        sendBroadcast(next, "bring-viewers");
      }
      persistState(next);
    },
    [persistState, sendBroadcast],
  );

  const broadcastTallies = useCallback(
    (payload: TalliesPayload | { tallies?: unknown; meta?: unknown }) => {
      const normalized: TalliesPayload = {
        tallies: (payload.tallies as TalliesPayload["tallies"]) || {},
        meta: (payload.meta as TalliesPayload["meta"]) || {},
      };
      lastTalliesRef.current = normalized;
      applyTalliesToIframe(iframeRef.current, normalized);
      const channel = channelRef.current;
      if (channel && subscribedRef.current) {
        void channel.send({
          type: "broadcast",
          event: "tallies",
          payload: normalized,
        });
      }
    },
    [],
  );

  const loadTallies = useCallback(async () => {
    const res = await fetch(`/api/forum/sessions/${session.id}/responses`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as TalliesPayload;
    if (data.tallies) {
      const normalized: TalliesPayload = {
        tallies: data.tallies,
        meta: data.meta ?? {},
      };
      lastTalliesRef.current = normalized;
      applyTalliesToIframe(iframeRef.current, normalized);
    }
  }, [session.id]);

  // Realtime (best-effort) + flush queued broadcasts
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setStatus(
        mode === "present" ? "Presenting (server sync)" : "Watching (server sync)",
      );
      return;
    }

    const presenceKey = connectionKeyRef.current;
    const channel = supabase.channel(`forum:${session.id}`, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: presenceKey },
      },
    });
    channelRef.current = channel;

    const syncPresenceCount = () => {
      // DB heartbeats are authoritative when available (Realtime can lag/miss)
      if (presenceFromDbRef.current) return;
      const state = channel.presenceState() as Record<
        string,
        Array<{ mode?: string }>
      >;
      let viewers = 0;
      let presenters = 0;
      for (const metas of Object.values(state)) {
        if (metas.some((meta) => meta.mode === "view")) viewers += 1;
        if (metas.some((meta) => meta.mode === "present")) presenters += 1;
      }
      setViewerCount(viewers);
      setPresenterCount(presenters);
    };

    channel
      .on("broadcast", { event: "presenter-state" }, ({ payload }) => {
        if (mode === "view") {
          applyViewerState(payload as ForumPresenterState);
        }
      })
      .on("broadcast", { event: "bring-viewers" }, ({ payload }) => {
        if (mode === "view") {
          applyViewerState({
            ...(payload as ForumPresenterState),
            force: true,
            prompt: true,
          });
        }
      })
      .on("broadcast", { event: "tallies" }, ({ payload }) => {
        const data = payload as TalliesPayload;
        const normalized: TalliesPayload = {
          tallies: data?.tallies || (payload as TalliesPayload["tallies"]) || {},
          meta: data?.meta || {},
        };
        // If payload was a bare tallies map, detect networks key at top level
        if (
          !data?.tallies &&
          payload &&
          typeof payload === "object" &&
          ("networks" in (payload as object) ||
            "spaces" in (payload as object))
        ) {
          normalized.tallies = payload as TalliesPayload["tallies"];
        }
        lastTalliesRef.current = normalized;
        applyTalliesToIframe(iframeRef.current, normalized);
      })
      .on("presence", { event: "sync" }, syncPresenceCount)
      .on("presence", { event: "join" }, syncPresenceCount)
      .on("presence", { event: "leave" }, syncPresenceCount)
      .subscribe((statusName) => {
        if (statusName === "SUBSCRIBED") {
          subscribedRef.current = true;
          setStatus(mode === "present" ? "Presenting live" : "Watching live");
          void channel.track({
            mode,
            at: Date.now(),
          });
          if (pendingBroadcastRef.current) {
            sendBroadcast(pendingBroadcastRef.current);
            pendingBroadcastRef.current = null;
          }
        } else if (
          statusName === "CHANNEL_ERROR" ||
          statusName === "TIMED_OUT"
        ) {
          subscribedRef.current = false;
          setStatus(
            mode === "present"
              ? "Presenting (server sync)"
              : "Watching (server sync)",
          );
        }
      });

    return () => {
      subscribedRef.current = false;
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [applyViewerState, mode, postToFrame, sendBroadcast, session.id]);

  // Presence heartbeat — tracks connected viewers (works without Realtime)
  useEffect(() => {
    let cancelled = false;

    async function beat() {
      try {
        const res = await fetch(`/api/forum/sessions/${session.id}/presence`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            participantKey: connectionKeyRef.current,
            role: mode === "present" ? "present" : "view",
          }),
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          viewers?: number;
          presenters?: number;
          unavailable?: boolean;
        };
        if (data.unavailable) return;
        if (typeof data.viewers === "number") {
          presenceFromDbRef.current = true;
          setViewerCount(data.viewers);
        }
        if (typeof data.presenters === "number") {
          setPresenterCount(data.presenters);
        }
      } catch {
        // ignore transient errors
      }
    }

    async function pullCount() {
      try {
        const res = await fetch(`/api/forum/sessions/${session.id}/presence`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          viewers?: number;
          presenters?: number;
          unavailable?: boolean;
        };
        if (data.unavailable) return;
        if (typeof data.viewers === "number") {
          presenceFromDbRef.current = true;
          setViewerCount(data.viewers);
        }
        if (typeof data.presenters === "number") {
          setPresenterCount(data.presenters);
        }
      } catch {
        // ignore
      }
    }

    void beat();
    const beatId = window.setInterval(beat, 10_000);
    const pullId = window.setInterval(pullCount, 4_000);
    return () => {
      cancelled = true;
      window.clearInterval(beatId);
      window.clearInterval(pullId);
    };
  }, [mode, session.id]);

  // Primary sync path for viewers: poll server
  useEffect(() => {
    if (mode !== "view") return;

    let cancelled = false;

    async function pull() {
      try {
        const res = await fetch(`/api/forum/sessions/${session.id}/sync`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          presenter_state?: ForumPresenterState;
          updated_at?: string;
        };
        if (data.presenter_state) {
          applyViewerState(data.presenter_state, data.updated_at);
        }
      } catch {
        // ignore transient errors
      }
    }

    void pull();
    const id = window.setInterval(pull, 400);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [applyViewerState, mode, session.id]);

  // Presenter heartbeat: read the deck DOM directly (private go() never exposes window.go)
  useEffect(() => {
    if (mode !== "present") return;
    const id = window.setInterval(() => {
      if (!frameReadyRef.current) return;
      const deck = readDeckStateFromIframe(iframeRef.current);
      if (!deck) {
        postToFrame("request-state");
        return;
      }
      const prev = lastStateRef.current;
      if (
        deck.slideIndex === prev.slideIndex &&
        deck.lang === prev.lang &&
        Boolean(deck.lightbox?.open) === Boolean(prev.lightbox?.open)
      ) {
        return;
      }
      broadcastState({
        ...deck,
        syncToken: Date.now(),
      });
    }, 350);
    return () => window.clearInterval(id);
  }, [broadcastState, mode, postToFrame]);

  // Viewer: keep re-asserting slide in case the deck fights back
  useEffect(() => {
    if (mode !== "view") return;
    const id = window.setInterval(() => {
      const state = lastStateRef.current;
      if (typeof state.slideIndex !== "number" || !frameReadyRef.current) return;
      postToFrame("force-slide", state);
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, postToFrame]);

  // Live activity results for presenter + viewers (poll / word cloud / spaces)
  useEffect(() => {
    let cancelled = false;
    async function pull() {
      if (!frameReadyRef.current || cancelled) return;
      await loadTallies();
    }
    void pull();
    const id = window.setInterval(pull, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [loadTallies]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as {
        source?: string;
        type?: string;
        payload?: Record<string, unknown>;
      };
      if (!data || data.source !== "koina-forum") return;

      if (data.type === "ready") {
        markFrameReady();
        if (mode === "view") {
          applyViewerState({ ...lastStateRef.current, force: true });
        } else if (mode === "present") {
          postToFrame("request-state");
        }
        void loadTallies();
        return;
      }

      if (data.type === "bring-viewers" && mode === "present") {
        const payload = data.payload as ForumPresenterState;
        broadcastState(
          {
            ...payload,
            syncToken: Date.now(),
            force: true,
            prompt: true,
          },
          { bring: true },
        );
        setPromptNote("Viewers prompted to jump to your slide");
        window.setTimeout(() => setPromptNote(null), 2500);
        return;
      }

      if (data.type === "presenter-state" && mode === "present") {
        const payload = data.payload as ForumPresenterState;
        const normalized = withSlideIndex(payload, lastStateRef.current);

        // Skip no-op spam from the poller / heartbeat
        if (
          normalized.slideIndex === lastStateRef.current.slideIndex &&
          normalized.lang === lastStateRef.current.lang &&
          Boolean(normalized.lightbox?.open) ===
            Boolean(lastStateRef.current.lightbox?.open) &&
          Boolean(normalized.qview?.open) ===
            Boolean(lastStateRef.current.qview?.open) &&
          !payload.force &&
          !payload.prompt
        ) {
          return;
        }
        broadcastState(payload);
        return;
      }

      // Deck iframe saves activities itself; host only relays tallies to peers
      if (data.type === "tallies-updated") {
        const payload = data.payload as {
          tallies?: unknown;
          meta?: unknown;
        };
        if (payload?.tallies) {
          broadcastTallies({
            tallies: payload.tallies,
            meta: payload.meta ?? {},
          });
        }
        return;
      }

      if (data.type === "activity-error") {
        const payload = data.payload as { error?: string };
        setError(payload?.error ?? "Could not save response.");
        return;
      }

      if (data.type === "activity") {
        // Fallback if the deck could not reach the API directly
        void (async () => {
          const res = await fetch(
            `/api/forum/sessions/${session.id}/responses`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data.payload,
                participantKey: participantKey(),
              }),
            },
          );
          const json = (await res.json()) as {
            tallies?: unknown;
            meta?: unknown;
            error?: string;
          };
          if (!res.ok) {
            setError(json.error ?? "Could not save response.");
            return;
          }
          if (json.tallies) {
            broadcastTallies({
              tallies: json.tallies,
              meta: json.meta ?? {},
            });
          }
        })();
        return;
      }

      if (data.type === "activity-reset") {
        // Presenter/admin can clear; viewers' reset clicks are ignored server-side
        if (mode !== "present" || !isAdmin) return;
        void (async () => {
          const res = await fetch(
            `/api/forum/sessions/${session.id}/responses`,
            {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                activityKey: data.payload?.activityKey,
                reset: true,
              }),
            },
          );
          const json = (await res.json()) as {
            tallies?: unknown;
            meta?: unknown;
          };
          if (res.ok && json.tallies) {
            const activityKey = String(data.payload?.activityKey || "");
            const tallies = {
              ...(json.tallies as Record<string, unknown>),
              // Keep empty map so the deck clears after reset
              ...(activityKey
                ? {
                    [activityKey]:
                      (json.tallies as Record<string, unknown>)[activityKey] ??
                      {},
                  }
                : {}),
            };
            broadcastTallies({
              tallies,
              meta: json.meta ?? {},
            });
          }
        })();
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [
    applyViewerState,
    broadcastState,
    broadcastTallies,
    isAdmin,
    loadTallies,
    markFrameReady,
    mode,
    postToFrame,
    session.id,
  ]);

  async function toggleLive() {
    if (!isAdmin || mode !== "present") return;
    const next = !live;
    try {
      const res = await fetch(`/api/forum/sessions/${session.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_live: next }),
      });
      const data = (await res.json()) as {
        error?: string;
        session?: { is_live?: boolean };
      };
      if (!res.ok) {
        setError(data.error ?? "Could not update live status.");
        return;
      }
      setLive(
        typeof data.session?.is_live === "boolean"
          ? data.session.is_live
          : next,
      );
      setError(null);
    } catch {
      setError("Could not update live status.");
    }
  }

  function bringViewers() {
    if (mode !== "present") return;
    const token = Date.now();
    // Prefer live DOM read from the same-origin deck iframe
    const deck = readDeckStateFromIframe(iframeRef.current);
    const payload: ForumPresenterState = {
      ...(deck ?? lastStateRef.current),
      syncToken: token,
      bringToken: token,
      force: true,
      prompt: true,
    };
    broadcastState(payload, { bring: true });
    setPromptNote(
      `Viewers prompted to slide ${(payload.slideIndex ?? 0) + 1}`,
    );
    window.setTimeout(() => setPromptNote(null), 2500);
    // Also poke the bridge in case DOM read failed
    if (!deck && frameReadyRef.current) {
      postToFrame("request-bring");
    }
  }

  function onIframeLoad() {
    markFrameReady();
    if (mode === "present") {
      postToFrame("request-state");
    } else {
      applyViewerState({ ...lastStateRef.current, force: true });
    }

    // Host-side activity wiring — reliable even when deck private handlers win
    unwireActivitiesRef.current?.();
    unwireActivitiesRef.current = wireIframeActivities(iframeRef.current, {
      sessionId: session.id,
      participantKey: participantKeyRef.current,
      isPresenter: mode === "present" && isAdmin,
      onTallies: (payload) => {
        broadcastTallies(payload);
      },
      onError: (message) => setError(message),
    });

    void loadTallies();
    // Re-apply after deck scripts finish mutating the cloud
    window.setTimeout(() => {
      if (lastTalliesRef.current) {
        applyTalliesToIframe(iframeRef.current, lastTalliesRef.current);
      } else {
        void loadTallies();
      }
    }, 400);
    window.setTimeout(() => {
      if (lastTalliesRef.current) {
        applyTalliesToIframe(iframeRef.current, lastTalliesRef.current);
      }
    }, 1200);
  }

  useEffect(() => {
    return () => {
      unwireActivitiesRef.current?.();
      unwireActivitiesRef.current = null;
    };
  }, []);

  const src = `/api/forum/sessions/${session.id}/html?mode=${mode}`;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0a0d18] text-[#edeff7]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 text-sm">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{session.title}</p>
          <p
            className={`truncate text-xs ${promptNote ? "text-[#f5a524]" : "text-white/55"}`}
            title={
              promptNote ||
              [
                mode === "present" ? "Presenter" : "Viewer",
                status,
                slideLabel,
                ready ? "" : "loading deck…",
              ]
                .filter(Boolean)
                .join(" · ")
            }
          >
            {promptNote
              ? promptNote
              : `${mode === "present" ? "Presenter" : "Viewer"} · ${status}${
                  slideLabel ? ` · ${slideLabel}` : ""
                }${ready ? "" : " · loading deck…"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80"
            title="People connected in the last 30 seconds"
          >
            {viewerCount} {viewerCount === 1 ? "viewer" : "viewers"}
            {presenterCount > 0
              ? ` · ${presenterCount} presenting`
              : ""}
          </span>
          {mode === "present" ? (
            <button
              type="button"
              onClick={bringViewers}
              title="Bring viewers to this slide"
              aria-label="Bring viewers to this slide"
              className="rounded border border-[#f5a524]/50 px-3 py-1.5 text-xs font-semibold text-[#f5a524] hover:border-[#f5a524] hover:bg-[#f5a524]/10"
            >
              ◎ Bring viewers
            </button>
          ) : null}
          {mode === "present" && isAdmin ? (
            <button
              type="button"
              onClick={() => void toggleLive()}
              className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold hover:border-white/40"
            >
              {live ? "Live" : "Mark live"}
            </button>
          ) : null}
          <Link
            href={`/forum/${session.id}`}
            className="rounded border border-white/20 px-3 py-1.5 text-xs font-semibold no-underline text-inherit hover:border-white/40"
          >
            Exit
          </Link>
        </div>
      </header>
      {error ? (
        <p className="bg-red-900/40 px-4 py-2 text-sm text-red-100">{error}</p>
      ) : null}
      <iframe
        ref={iframeRef}
        title={session.title}
        src={src}
        onLoad={onIframeLoad}
        className="h-full w-full flex-1 border-0 bg-white"
        allow="fullscreen"
      />
    </div>
  );
}
