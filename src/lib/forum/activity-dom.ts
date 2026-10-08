/**
 * Host-side word-cloud / poll / spaces sync via same-origin iframe DOM.
 * Bypasses fragile in-deck event fights with the uploaded HTML's private handlers.
 */

export type TallyMap = Record<string, Record<string, number>>;
export type TallyMeta = Record<
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

export type TalliesPayload = {
  tallies: TallyMap;
  meta?: TallyMeta;
};

type ActivityBody = {
  activityKey: string;
  optionKey?: string;
  delta?: number;
  label?: string;
  payload?: Record<string, unknown>;
  reset?: boolean;
};

type DeckWindow = Window & {
  __rc?: () => void;
  __koinaApplyingNetworks?: boolean;
  __koinaApplyingSpaces?: boolean;
  __koinaApplyingTallies?: boolean;
};

let lastApplied: TalliesPayload | null = null;

function splitWords(raw: string): string[] {
  return raw
    .split(/[,，、]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((t) => t.slice(0, 40));
}

function deckWin(iframe: HTMLIFrameElement | null): DeckWindow | null {
  return (iframe?.contentWindow as DeckWindow | null) ?? null;
}

function markApplying(iframe: HTMLIFrameElement | null, on: boolean): void {
  const win = deckWin(iframe);
  if (!win) return;
  win.__koinaApplyingTallies = on;
  win.__koinaApplyingNetworks = on;
  win.__koinaApplyingSpaces = on;
}

/** Paint networks word cloud + category counts into the deck iframe. */
export function applyNetworksToIframe(
  iframe: HTMLIFrameElement | null,
  counts: Record<string, number>,
  meta: TallyMeta["networks"] = {},
): boolean {
  try {
    const doc = iframe?.contentDocument;
    if (!doc) return false;
    const cloud = doc.getElementById("cloud");
    const cats = doc.getElementById("nwCats");
    if (!cloud && !cats) return false;

    if (cats) {
      Array.from(cats.children).forEach((b, i) => {
        const el = b as HTMLElement;
        const c = el.querySelector(".c");
        const n = counts[`cat:${i}`] || 0;
        if (c) c.textContent = n ? String(n) : "";
        (el as HTMLButtonElement).onclick = null;
        el.oncontextmenu = null;
      });
    }

    if (!cloud) return true;

    const keys = Object.keys(counts).filter((k) => (counts[k] || 0) > 0);
    cloud.innerHTML = "";
    if (!keys.length) {
      cloud.innerHTML =
        '<p class="empty"><span class="e">Words appear here as people answer.</span><span class="j">回答すると、ここに言葉が現れます。</span></p>';
      return true;
    }

    let max = 1;
    keys.forEach((k) => {
      max = Math.max(max, counts[k] || 0);
    });
    const ranked = [...keys].sort((a, b) => (counts[b] || 0) - (counts[a] || 0));
    const mode = doc.body.classList.contains("m-ja")
      ? "ja"
      : doc.body.classList.contains("m-en")
        ? "en"
        : "both";

    const hash = (t: string) => {
      let h = 0;
      for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
      return h;
    };
    keys.sort((a, b) => hash(a) % 97 - (hash(b) % 97));

    for (const k of keys) {
      const n = counts[k] || 0;
      const m = meta[k] || {};
      const en =
        m.en || m.label || (k.startsWith("free:") ? k.slice(5) : k);
      const ja = m.ja || en;
      const btn = doc.createElement("button");
      btn.className = "w";
      btn.type = "button";
      btn.title = "Remove one";
      btn.dataset.koinaKey = k;
      btn.dataset.koinaEn = en;
      btn.dataset.koinaJa = ja;
      if (mode === "both" && ja && ja !== en) {
        const e1 = doc.createElement("span");
        e1.textContent = en;
        const j1 = doc.createElement("small");
        j1.textContent = ja;
        btn.append(e1, j1);
      } else {
        btn.textContent = mode === "ja" ? ja : en;
      }
      const r = max === 1 ? 0.35 : (n - 1) / (max - 1);
      btn.style.fontSize = `calc(max(15px, var(--u) * ${(1.4 + r * 3.2).toFixed(2)}))`;
      const rank = ranked.indexOf(k);
      btn.style.color =
        rank < 1 && max > 1
          ? "var(--kaki)"
          : rank < 4
            ? "var(--ai)"
            : "var(--ink)";
      btn.style.opacity = String((0.55 + 0.45 * (r || 0.35)).toFixed(2));
      cloud.appendChild(btn);
    }
    return true;
  } catch {
    return false;
  }
}

export function applyPollsToIframe(
  iframe: HTMLIFrameElement | null,
  tallies: TallyMap,
): void {
  try {
    const doc = iframe?.contentDocument;
    if (!doc) return;
    const polls = doc.querySelectorAll(".poll[data-poll]");
    polls.forEach((poll) => {
      const activityKey = poll.getAttribute("data-poll");
      if (!activityKey) return;
      const counts = tallies[activityKey] || {};
      const opts = poll.querySelectorAll(".opt");
      let max = 1;
      opts.forEach((o, i) => {
        const n = counts[String(i)] || counts[`opt:${i}`] || 0;
        max = Math.max(max, n);
      });
      opts.forEach((o, i) => {
        const n = counts[String(i)] || counts[`opt:${i}`] || 0;
        const ct = o.querySelector(".ct");
        const bar = o.querySelector(".bar") as HTMLElement | null;
        if (ct) ct.textContent = String(n);
        if (bar) {
          bar.style.width = `${(n / max) * 100}%`;
          bar.classList.toggle("zero", !n);
        }
        (o as HTMLButtonElement).onclick = null;
        (o as HTMLElement).oncontextmenu = null;
      });
    });
  } catch {
    // ignore
  }
}

export function applySpacesToIframe(
  iframe: HTMLIFrameElement | null,
  counts: Record<string, number>,
  meta: TallyMeta["spaces"] = {},
): void {
  try {
    const doc = iframe?.contentDocument;
    if (!doc) return;
    const spG = doc.getElementById("spGrid");
    if (!spG) return;

    spG.querySelectorAll(".sp").forEach((card) => {
      const nameEl =
        card.querySelector(".sp-name .e") ||
        card.querySelector(".sp-name span");
      const name = nameEl?.textContent || "";
      card.querySelectorAll("button[data-k]").forEach((btn) => {
        const kind = btn.getAttribute("data-k");
        const n = counts[`${name}:${kind}`] || 0;
        const span = btn.querySelector(".n");
        if (span) span.textContent = String(n);
        (btn as HTMLButtonElement).onclick = null;
        (btn as HTMLElement).oncontextmenu = null;
      });
    });

    Object.keys(counts).forEach((key) => {
      if (!key.endsWith(":added") || !counts[key]) return;
      const name = meta[key]?.name || key.slice(0, -6);
      let exists = false;
      spG.querySelectorAll(".sp").forEach((card) => {
        const nameEl =
          card.querySelector(".sp-name .e") ||
          card.querySelector(".sp-name span");
        if (nameEl?.textContent === name) exists = true;
      });
      if (exists) return;
      const c = doc.createElement("div");
      c.className = "sp";
      c.innerHTML =
        `<div class="sp-name"><span><span class="e">${name}</span></span><span class="sp-kind">added</span></div>` +
        `<div class="sp-btns">` +
        `<button data-k="been" type="button"><span class="in"><span class="e">Been</span><span class="j">行った</span></span><span class="n">0</span></button>` +
        `<button data-k="heard" type="button"><span class="in"><span class="e">Heard</span><span class="j">知ってる</span></span><span class="n">0</span></button>` +
        `<button data-k="up" class="up" type="button">★<span class="n">${counts[key]}</span></button>` +
        `</div>`;
      c.querySelectorAll("button[data-k]").forEach((btn) => {
        (btn as HTMLButtonElement).onclick = null;
        (btn as HTMLElement).oncontextmenu = null;
      });
      spG.appendChild(c);
    });
  } catch {
    // ignore
  }
}

export function applyTalliesToIframe(
  iframe: HTMLIFrameElement | null,
  payload: TalliesPayload,
): void {
  const tallies = payload.tallies || {};
  const meta = payload.meta || {};
  lastApplied = { tallies, meta };
  markApplying(iframe, true);
  try {
    applyNetworksToIframe(iframe, tallies.networks || {}, meta.networks || {});
    applySpacesToIframe(iframe, tallies.spaces || {}, meta.spaces || {});
    applyPollsToIframe(iframe, tallies);
  } finally {
    window.setTimeout(() => markApplying(iframe, false), 0);
  }
  const win = deckWin(iframe);
  if (win) {
    win.__rc = () => {
      if (lastApplied) applyTalliesToIframe(iframe, lastApplied);
    };
  }
  try {
    iframe?.contentWindow?.postMessage(
      {
        source: "koina-forum-host",
        type: "apply-tallies",
        payload: { tallies, meta },
      },
      "*",
    );
  } catch {
    // ignore
  }
}

/** Point deck __rc at server re-apply (never the private empty-Map renderer). */
export function neutralizeDeckCloud(iframe: HTMLIFrameElement | null): void {
  const win = deckWin(iframe);
  if (!win) return;
  win.__rc = () => {
    if (lastApplied) applyTalliesToIframe(iframe, lastApplied);
  };
}

function disarmDeckNetworks(doc: Document): void {
  const form = doc.getElementById("nwForm") as HTMLFormElement | null;
  if (form?.parentNode && !form.dataset.koinaWired) {
    const clone = form.cloneNode(true) as HTMLFormElement;
    clone.dataset.koinaWired = "1";
    form.parentNode.replaceChild(clone, form);
  }
  const clearBtn = doc.getElementById("nwClear") as HTMLButtonElement | null;
  if (clearBtn) {
    clearBtn.onclick = null;
    clearBtn.dataset.koinaWired = "1";
  }
  doc.querySelectorAll("#nwCats button").forEach((b) => {
    const btn = b as HTMLButtonElement;
    btn.onclick = null;
    btn.oncontextmenu = null;
  });
}

function disarmDeckPolls(doc: Document): void {
  doc.querySelectorAll(".poll .opt").forEach((o) => {
    const el = o as HTMLButtonElement;
    el.onclick = null;
    el.oncontextmenu = null;
  });
  doc.querySelectorAll("[data-reset]").forEach((r) => {
    (r as HTMLButtonElement).onclick = null;
  });
}

function disarmDeckSpaces(doc: Document): void {
  const form = doc.getElementById("spForm") as HTMLFormElement | null;
  if (form?.parentNode && !form.dataset.koinaWired) {
    const clone = form.cloneNode(true) as HTMLFormElement;
    clone.dataset.koinaWired = "1";
    form.parentNode.replaceChild(clone, form);
  }
  const reset = doc.getElementById("spReset") as HTMLButtonElement | null;
  if (reset) reset.onclick = null;
  doc.querySelectorAll("#spGrid button[data-k]").forEach((b) => {
    const btn = b as HTMLButtonElement;
    btn.onclick = null;
    btn.oncontextmenu = null;
  });
}

function disarmAll(doc: Document): void {
  disarmDeckNetworks(doc);
  disarmDeckPolls(doc);
  disarmDeckSpaces(doc);
}

type WireOptions = {
  sessionId: string;
  participantKey: string;
  isPresenter: boolean;
  onTallies: (payload: TalliesPayload) => void;
  onError?: (message: string) => void;
};

async function saveActivity(
  sessionId: string,
  body: ActivityBody & { participantKey?: string },
): Promise<TalliesPayload | null> {
  const res = await fetch(`/api/forum/sessions/${sessionId}/responses`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as TalliesPayload & {
    error?: string;
    ok?: boolean;
  };
  if (!res.ok) throw new Error(json.error || "Could not save response.");
  return { tallies: json.tallies || {}, meta: json.meta || {} };
}

async function persist(
  iframe: HTMLIFrameElement | null,
  opts: WireOptions,
  body: ActivityBody & { participantKey?: string },
): Promise<void> {
  try {
    const latest = await saveActivity(opts.sessionId, body);
    if (!latest) return;
    if (body.reset && body.activityKey) {
      latest.tallies = {
        ...latest.tallies,
        [body.activityKey]: latest.tallies[body.activityKey] || {},
      };
    }
    applyTalliesToIframe(iframe, latest);
    opts.onTallies(latest);
  } catch (err) {
    opts.onError?.(
      err instanceof Error ? err.message : "Could not save response.",
    );
  }
}

/**
 * Attach capture listeners on the iframe document so poll / word-cloud /
 * spaces interactions always hit our API, not only the deck's private handlers.
 */
export function wireIframeActivities(
  iframe: HTMLIFrameElement | null,
  opts: WireOptions,
): () => void {
  const doc = iframe?.contentDocument;
  if (!doc) return () => undefined;

  neutralizeDeckCloud(iframe);
  disarmAll(doc);
  window.setTimeout(() => disarmAll(doc), 0);
  window.setTimeout(() => disarmAll(doc), 250);

  const onSubmit = (e: Event) => {
    const form = e.target as HTMLElement | null;
    if (!form) return;

    if (form.id === "nwForm") {
      e.preventDefault();
      e.stopImmediatePropagation();
      const inp = doc.getElementById("nwInput") as HTMLInputElement | null;
      const raw = (inp?.value || "").trim();
      if (!raw) return;
      const words = splitWords(raw);
      if (inp) inp.value = "";
      void (async () => {
        let latest: TalliesPayload | null = null;
        try {
          for (const t of words) {
            latest = await saveActivity(opts.sessionId, {
              activityKey: "networks",
              optionKey: `free:${t.toLowerCase()}`,
              delta: 1,
              label: t,
              payload: { en: t, ja: t },
              participantKey: opts.participantKey,
            });
          }
          if (latest) {
            applyTalliesToIframe(iframe, latest);
            opts.onTallies(latest);
          }
        } catch (err) {
          opts.onError?.(
            err instanceof Error ? err.message : "Could not save word.",
          );
        }
      })();
      return;
    }

    if (form.id === "spForm") {
      e.preventDefault();
      e.stopImmediatePropagation();
      const inp = doc.getElementById("spInput") as HTMLInputElement | null;
      const v = (inp?.value || "").trim().slice(0, 40);
      if (!v) return;
      if (inp) inp.value = "";
      void persist(iframe, opts, {
        activityKey: "spaces",
        optionKey: `${v}:added`,
        delta: 1,
        label: v,
        payload: { name: v, kind: "added" },
        participantKey: opts.participantKey,
      });
    }
  };

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest) return;
    const mouse = e as MouseEvent;

    if (t.closest("#nwClear")) {
      if (!opts.isPresenter) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      void persist(iframe, opts, { activityKey: "networks", reset: true });
      return;
    }

    const catBtn = t.closest("#nwCats button") as HTMLButtonElement | null;
    if (catBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const cats = doc.getElementById("nwCats");
      const buttons = cats
        ? Array.from(cats.querySelectorAll("button"))
        : [];
      const i = buttons.indexOf(catBtn);
      if (i < 0) return;
      const en =
        catBtn.querySelector(".e")?.textContent ||
        catBtn.textContent?.trim() ||
        `cat ${i}`;
      const ja = catBtn.querySelector(".j")?.textContent || en;
      void persist(iframe, opts, {
        activityKey: "networks",
        optionKey: `cat:${i}`,
        delta: mouse.shiftKey ? -1 : 1,
        label: en,
        payload: { en, ja },
        participantKey: opts.participantKey,
      });
      return;
    }

    const wordBtn = t.closest("#cloud button.w") as HTMLButtonElement | null;
    if (wordBtn?.dataset.koinaKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const key = wordBtn.dataset.koinaKey;
      const en = wordBtn.dataset.koinaEn || key;
      const ja = wordBtn.dataset.koinaJa || en;
      void persist(iframe, opts, {
        activityKey: "networks",
        optionKey: key,
        delta: -1,
        label: en,
        payload: { en, ja },
        participantKey: opts.participantKey,
      });
      return;
    }

    const opt = t.closest(".poll .opt") as HTMLElement | null;
    if (opt) {
      const poll = opt.closest(".poll[data-poll]");
      if (!poll) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const key = poll.getAttribute("data-poll") || "poll";
      const optsList = Array.from(poll.querySelectorAll(".opt"));
      const i = optsList.indexOf(opt);
      if (i < 0) return;
      const lab =
        opt.querySelector(".lab")?.textContent || `Option ${i + 1}`;
      void persist(iframe, opts, {
        activityKey: key,
        optionKey: String(i),
        delta: mouse.shiftKey ? -1 : 1,
        label: lab,
        participantKey: opts.participantKey,
      });
      return;
    }

    const resetBtn = t.closest("[data-reset]") as HTMLElement | null;
    if (resetBtn) {
      const slide = resetBtn.closest(".slide");
      const resetPoll =
        slide?.querySelector(".poll[data-poll]") ||
        resetBtn.parentElement?.querySelector(".poll[data-poll]");
      if (resetPoll) {
        if (!opts.isPresenter) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        void persist(iframe, opts, {
          activityKey: resetPoll.getAttribute("data-poll") || "poll",
          reset: true,
        });
        return;
      }
    }

    if (t.closest("#spReset")) {
      if (!opts.isPresenter) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      void persist(iframe, opts, { activityKey: "spaces", reset: true });
      return;
    }

    const spBtn = t.closest("#spGrid button[data-k]") as HTMLElement | null;
    if (spBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const card = spBtn.closest(".sp");
      const nameEl =
        card?.querySelector(".sp-name .e") ||
        card?.querySelector(".sp-name span");
      const name = nameEl?.textContent || "space";
      const kind = spBtn.getAttribute("data-k") || "up";
      void persist(iframe, opts, {
        activityKey: "spaces",
        optionKey: `${name}:${kind}`,
        delta: mouse.shiftKey ? -1 : 1,
        label: `${name} / ${kind}`,
        payload: { name, kind },
        participantKey: opts.participantKey,
      });
    }
  };

  const onContextMenu = (e: Event) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest) return;

    const opt = t.closest(".poll .opt") as HTMLElement | null;
    if (opt) {
      const poll = opt.closest(".poll[data-poll]");
      if (!poll) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const key = poll.getAttribute("data-poll") || "poll";
      const optsList = Array.from(poll.querySelectorAll(".opt"));
      const i = optsList.indexOf(opt);
      if (i < 0) return;
      const lab =
        opt.querySelector(".lab")?.textContent || `Option ${i + 1}`;
      void persist(iframe, opts, {
        activityKey: key,
        optionKey: String(i),
        delta: -1,
        label: lab,
        participantKey: opts.participantKey,
      });
      return;
    }

    const spBtn = t.closest("#spGrid button[data-k]") as HTMLElement | null;
    if (spBtn) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const card = spBtn.closest(".sp");
      const nameEl =
        card?.querySelector(".sp-name .e") ||
        card?.querySelector(".sp-name span");
      const name = nameEl?.textContent || "space";
      const kind = spBtn.getAttribute("data-k") || "up";
      void persist(iframe, opts, {
        activityKey: "spaces",
        optionKey: `${name}:${kind}`,
        delta: -1,
        label: `${name} / ${kind}`,
        payload: { name, kind },
        participantKey: opts.participantKey,
      });
    }
  };

  doc.addEventListener("submit", onSubmit, true);
  doc.addEventListener("click", onClick, true);
  doc.addEventListener("contextmenu", onContextMenu, true);

  const cloud = doc.getElementById("cloud");
  const cats = doc.getElementById("nwCats");
  const spGrid = doc.getElementById("spGrid");
  let moTimer: number | null = null;
  const mo = new MutationObserver(() => {
    const win = deckWin(iframe);
    if (
      !lastApplied ||
      win?.__koinaApplyingTallies ||
      win?.__koinaApplyingNetworks ||
      win?.__koinaApplyingSpaces
    ) {
      return;
    }
    if (moTimer != null) window.clearTimeout(moTimer);
    moTimer = window.setTimeout(() => {
      if (lastApplied) applyTalliesToIframe(iframe, lastApplied);
    }, 0);
  });
  if (cloud) mo.observe(cloud, { childList: true, subtree: true });
  if (cats) {
    mo.observe(cats, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  if (spGrid) {
    mo.observe(spGrid, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  doc.querySelectorAll(".poll").forEach((p) => {
    mo.observe(p, { childList: true, subtree: true, characterData: true });
  });

  const keepAlive = window.setInterval(() => {
    neutralizeDeckCloud(iframe);
    disarmAll(doc);
    if (lastApplied) {
      markApplying(iframe, true);
      try {
        applyNetworksToIframe(
          iframe,
          lastApplied.tallies.networks || {},
          lastApplied.meta?.networks || {},
        );
        applySpacesToIframe(
          iframe,
          lastApplied.tallies.spaces || {},
          lastApplied.meta?.spaces || {},
        );
        applyPollsToIframe(iframe, lastApplied.tallies);
      } finally {
        window.setTimeout(() => markApplying(iframe, false), 0);
      }
    }
  }, 500);

  return () => {
    doc.removeEventListener("submit", onSubmit, true);
    doc.removeEventListener("click", onClick, true);
    doc.removeEventListener("contextmenu", onContextMenu, true);
    mo.disconnect();
    if (moTimer != null) window.clearTimeout(moTimer);
    window.clearInterval(keepAlive);
  };
}
