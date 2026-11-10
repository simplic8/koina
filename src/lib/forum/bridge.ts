/** Injected into uploaded deck HTML for presenter/viewer sync. */
export function buildForumBridgeScript(
  mode: "present" | "view" | "browse",
  sessionId: string,
) {
  return `<script>
(function(){
  if (window.__KOINA_FORUM_BRIDGE__) return;
  window.__KOINA_FORUM_BRIDGE__ = true;
  var MODE = ${JSON.stringify(mode)};
  var SESSION_ID = ${JSON.stringify(sessionId)};
  var ORIGIN = "*";
  var forceGo = null;
  var pendingState = null;
  var lastClickPayload = null;
  var emitRaf = 0;
  var CHROME_SEL = "#bar, #prev, #next, #grid, #gridbtn, #pg, #koinaBring, #clock, .poll, #cloud, #nwCats, #nwClear, #nwInput, #spGrid, #spReset, [data-reset], input, textarea, select, label";

  function post(type, payload) {
    try {
      parent.postMessage({ source: "koina-forum", type: type, payload: payload || {} }, ORIGIN);
    } catch (e) {}
  }

  function participantKey() {
    try {
      var key = "koina-forum-participant";
      var existing = localStorage.getItem(key);
      if (existing) return existing;
      var next = (crypto.randomUUID && crypto.randomUUID()) || ("p-" + Date.now());
      localStorage.setItem(key, next);
      return next;
    } catch (e) {
      return "anon-" + Date.now();
    }
  }

  /** Save activity directly to the API, then notify the host to relay to peers. */
  function postActivity(payload) {
    if (!SESSION_ID) {
      post("activity", payload);
      return;
    }
    fetch("/api/forum/sessions/" + SESSION_ID + "/responses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({}, payload, { participantKey: participantKey() })),
      cache: "no-store"
    }).then(function(res) { return res.json(); }).then(function(json) {
      if (json && json.tallies) {
        applyTallies({ tallies: json.tallies, meta: json.meta || {} });
        post("tallies-updated", { tallies: json.tallies, meta: json.meta || {} });
      } else if (json && json.error) {
        post("activity-error", { error: json.error });
      }
    }).catch(function() {
      // Fallback: let the host attempt the save
      post("activity", payload);
    });
  }

  function postActivityReset(activityKey) {
    if (!SESSION_ID) {
      post("activity-reset", { activityKey: activityKey });
      return;
    }
    if (MODE !== "present") return;
    fetch("/api/forum/sessions/" + SESSION_ID + "/responses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityKey: activityKey, reset: true }),
      cache: "no-store"
    }).then(function(res) { return res.json(); }).then(function(json) {
      if (json && json.tallies) {
        var tallies = Object.assign({}, json.tallies);
        tallies[activityKey] = tallies[activityKey] || {};
        applyTallies({ tallies: tallies, meta: json.meta || {} });
        post("tallies-updated", { tallies: tallies, meta: json.meta || {} });
      } else {
        post("activity-reset", { activityKey: activityKey });
      }
    }).catch(function() {
      post("activity-reset", { activityKey: activityKey });
    });
  }

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function isActiveSlide(el) {
    return el && (el.classList.contains("on") || el.classList.contains("cur"));
  }

  function lightboxRoot() {
    return $("#lightbox") || $("#lb");
  }

  function currentSlideIndex() {
    // Prefer the deck's page input — private go() always updates #pg
    var pg = $("#pg");
    if (pg) {
      var n = parseInt(pg.value, 10);
      if (n >= 1 && isFinite(n)) return n - 1;
    }
    var slides = $$(".slide");
    for (var i = 0; i < slides.length; i++) {
      if (isActiveSlide(slides[i])) return i;
    }
    var hash = String(location.hash || "").match(/^#s(\d+)$/);
    if (hash) {
      var h = parseInt(hash[1], 10);
      if (h >= 1 && isFinite(h)) return h - 1;
    }
    // Visible slide fallback (inline styles / CSS)
    for (var j = 0; j < slides.length; j++) {
      var st = window.getComputedStyle(slides[j]);
      if (st.display !== "none" && st.visibility !== "hidden" && st.opacity !== "0") return j;
    }
    return 0;
  }

  function currentStep() {
    var slides = $$(".slide");
    var slide = slides[currentSlideIndex()];
    if (!slide) return 0;
    var nodes = slide.querySelectorAll("[data-step]");
    if (!nodes.length) return 0;
    var max = 0;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].classList.contains("pending")) continue;
      var n = parseInt(nodes[i].getAttribute("data-step") || "0", 10);
      if (isFinite(n) && n > max) max = n;
    }
    return max;
  }

  function currentLang() {
    if (document.body.classList.contains("m-ja")) return "ja";
    if (document.body.classList.contains("m-en")) return "en";
    return "both";
  }

  /** Tag gallery thumbs so sync can address them without shipping base64 srcs. */
  function tagThumbs() {
    $$(".thumbs").forEach(function(g, gi) {
      var group = g.getAttribute("data-group") || ("g" + gi);
      if (!g.getAttribute("data-group")) g.setAttribute("data-group", group);
      var thumbs = g.querySelectorAll(".thumb");
      for (var i = 0; i < thumbs.length; i++) {
        thumbs[i].setAttribute("data-koina-thumb", group + ":" + i);
      }
    });
  }

  function findThumbRef(src) {
    if (!src) return null;
    var groups = $$(".thumbs");
    for (var g = 0; g < groups.length; g++) {
      var group = groups[g].getAttribute("data-group") || ("g" + g);
      var imgs = groups[g].querySelectorAll("img");
      for (var i = 0; i < imgs.length; i++) {
        if (imgs[i].getAttribute("src") === src) {
          return { group: group, index: i };
        }
      }
    }
    return null;
  }

  function parseLbCount() {
    var el = $("#lbCount");
    if (!el) return null;
    var m = String(el.textContent || "").match(/^(.+?)\s*·\s*(\d+)\s*\/\s*(\d+)/);
    if (!m) return null;
    return { group: m[1].trim(), index: Math.max(0, parseInt(m[2], 10) - 1) };
  }

  function wireSrc(src) {
    if (!src) return "";
    // Never put data: URLs on the wire — they blow past realtime payload limits
    if (/^data:/i.test(src)) return "";
    if (src.length > 2000) return "";
    return src;
  }

  function readLightbox() {
    var lb = lightboxRoot();
    if (!lb || lb.hidden) return { open: false };
    var img = $("#lbImg");
    var cap = $("#lbCap");
    var src = img ? img.getAttribute("src") || "" : "";
    var ref = findThumbRef(src) || parseLbCount();
    return {
      open: true,
      group: ref ? ref.group : null,
      index: ref && typeof ref.index === "number" ? ref.index : null,
      src: wireSrc(src),
      alt: img ? img.getAttribute("alt") || "" : "",
      capHtml: cap ? (cap.textContent || cap.innerHTML || "") : ""
    };
  }

  function readQview() {
    var q = $("#qview");
    if (!q || q.hidden) return { open: false, index: null };
    return { open: true, index: typeof window.__koinaOpenQ === "number" ? window.__koinaOpenQ : null };
  }

  function escapeIdent(id) {
    if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(id);
    return String(id).replace(/([^\w-])/g, "\\\\$1");
  }

  /** Stable-enough selector so viewers can replay the presenter's click. */
  function cssPath(el) {
    if (!el || el.nodeType !== 1) return "";
    if (el.id) return "#" + escapeIdent(el.id);
    var parts = [];
    var cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
      if (cur.id) {
        parts.unshift("#" + escapeIdent(cur.id));
        break;
      }
      var tag = cur.tagName.toLowerCase();
      var parent = cur.parentElement;
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      var same = [];
      for (var i = 0; i < parent.children.length; i++) {
        if (parent.children[i].tagName === cur.tagName) same.push(parent.children[i]);
      }
      if (same.length > 1) {
        parts.unshift(tag + ":nth-of-type(" + (same.indexOf(cur) + 1) + ")");
      } else {
        parts.unshift(tag);
      }
      cur = parent;
      if (parts.length > 14) break;
    }
    return parts.join(" > ");
  }

  function clickTarget(t) {
    if (!t || !t.closest) return null;
    return t.closest(
      "button.thumb, .thumb, [data-koina-thumb], button, a, summary, [role='button'], [data-open], [data-lb], [data-lightbox], .shot-btn, figure, img, [onclick]"
    ) || t;
  }

  function thumbKeyFromEl(el) {
    if (!el || !el.closest) return null;
    var thumb = el.closest("[data-koina-thumb], .thumb");
    if (!thumb) return null;
    var key = thumb.getAttribute("data-koina-thumb");
    if (key) return key;
    var group = thumb.closest(".thumbs");
    if (!group) return null;
    var g = group.getAttribute("data-group") || "";
    var thumbs = group.querySelectorAll(".thumb");
    for (var i = 0; i < thumbs.length; i++) {
      if (thumbs[i] === thumb) return g + ":" + i;
    }
    return null;
  }

  function shouldSyncClick(t) {
    if (!t || !t.closest) return false;
    if (t.closest(CHROME_SEL)) return false;
    if (t.closest("a[href^='http'], a[target='_blank']")) return false;
    // Stage background clicks only advance slides — synced via slideIndex/step
    if (t.closest("#stage") && !t.closest(".thumb, [data-koina-thumb], .slide button, .slide a, #lb, #lightbox, button.lbbtn")) {
      return false;
    }
    return Boolean(t.closest(".slide, #deck, #stage, #lightbox, #lb, #qview, #lbClose, .lightbox, .thumb, [data-koina-thumb]"));
  }

  function collectState() {
    return {
      slideIndex: currentSlideIndex(),
      step: currentStep(),
      lang: currentLang(),
      lightbox: readLightbox(),
      qview: readQview(),
      lastClick: lastClickPayload,
      syncToken: Date.now()
    };
  }

  function emitState(extra) {
    if (MODE !== "present") return;
    var state = collectState();
    if (extra && typeof extra === "object") {
      for (var k in extra) state[k] = extra[k];
    }
    post("presenter-state", state);
  }

  /** Coalesce to next frame so deck click handlers (next/lightbox) finish first. */
  function scheduleEmit(extra) {
    if (MODE !== "present" || window.__koinaApplying) return;
    if (extra && typeof extra === "object") {
      emitState(extra);
      return;
    }
    if (emitRaf) return;
    emitRaf = requestAnimationFrame(function() {
      emitRaf = 0;
      if (!window.__koinaApplying) emitState();
    });
  }

  function applyLang(lang) {
    if (!lang) return;
    document.body.classList.remove("m-en", "m-ja", "m-both");
    document.body.classList.add("m-" + lang);
    $$("#bar .seg button").forEach(function(b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-m") === lang ? "true" : "false");
    });
    if (window.__rc) window.__rc();
  }

  function openThumb(group, index) {
    if (typeof index !== "number" || index < 0) return false;
    var root = null;
    if (group) {
      try {
        root = document.querySelector('.thumbs[data-group="' + escapeIdent(group) + '"]');
      } catch (e) { root = null; }
    }
    if (!root) {
      var groups = $$(".thumbs");
      root = groups[0] || null;
    }
    if (!root) return false;
    var thumbs = root.querySelectorAll(".thumb");
    var btn = thumbs[index];
    if (!btn || typeof btn.click !== "function") return false;
    try { btn.click(); } catch (e) { return false; }
    return true;
  }

  function applyLightbox(lb) {
    var box = lightboxRoot();
    if (!box) return;
    if (!lb || !lb.open) {
      box.hidden = true;
      return;
    }
    // Prefer opening the local thumb so gallery prev/next keeps working
    if (typeof lb.index === "number" && openThumb(lb.group, lb.index)) {
      return;
    }
    var img = $("#lbImg");
    var cap = $("#lbCap");
    var count = $("#lbCount");
    if (img && lb.src && !/^data:/i.test(lb.src)) {
      img.src = lb.src;
      img.alt = lb.alt || "";
    }
    if (cap) {
      if (lb.capHtml && /[<]/.test(lb.capHtml)) cap.innerHTML = lb.capHtml;
      else cap.textContent = lb.capHtml || lb.alt || "";
    }
    if (count && lb.group && typeof lb.index === "number") {
      count.textContent = lb.group + " · " + (lb.index + 1);
    }
    box.hidden = false;
  }

  function applyStep(slideIndex, step) {
    if (typeof step !== "number" || !isFinite(step)) return;
    var slides = $$(".slide");
    var slide = slides[slideIndex];
    if (!slide) return;
    var nodes = slide.querySelectorAll("[data-step]");
    if (!nodes.length) return;
    var max = 0;
    for (var i = 0; i < nodes.length; i++) {
      var n = parseInt(nodes[i].getAttribute("data-step") || "0", 10) || 0;
      if (n > max) max = n;
      nodes[i].classList.toggle("pending", n > step);
    }
    var dots = $("#dots");
    if (dots) {
      var html = "";
      for (var d = 0; d < max; d++) {
        html += '<i class="' + (d < step ? "on" : "") + '"></i>';
      }
      dots.innerHTML = html;
    }
    var progress = $("#progress");
    if (progress && slides.length) {
      progress.style.width =
        ((slideIndex + (max ? step / max : 1)) / slides.length * 100) + "%";
    }
  }

  function applyQview(qv) {
    var box = $("#qview");
    if (!box) return;
    if (!qv || !qv.open) {
      box.hidden = true;
      return;
    }
    if (typeof qv.index === "number" && typeof window.openQ === "function") {
      try { window.openQ(qv.index); } catch (e) { box.hidden = false; }
    } else {
      box.hidden = false;
    }
  }

  function applyClick(click) {
    if (!click || typeof click.at !== "number") return;
    if (window.__koinaLastClickAt === click.at) return;
    window.__koinaLastClickAt = click.at;
    if (click.thumb) {
      var parts = String(click.thumb).split(":");
      var idx = parseInt(parts.pop() || "", 10);
      var group = parts.join(":");
      if (openThumb(group, idx)) return;
    }
    if (!click.path) return;
    var el = null;
    try { el = document.querySelector(click.path); } catch (e) { el = null; }
    if (!el && click.path.indexOf("[data-koina-thumb=") >= 0) {
      try {
        var m = click.path.match(/data-koina-thumb=['"]([^'"]+)['"]/);
        if (m) el = document.querySelector('[data-koina-thumb="' + m[1] + '"]');
      } catch (e2) {}
    }
    if (!el || typeof el.click !== "function") return;
    try { el.click(); } catch (e) {}
  }

  function applyArtifacts(state) {
    if (typeof state.slideIndex === "number") {
      applyStep(state.slideIndex, typeof state.step === "number" ? state.step : 0);
    }
    applyClick(state.lastClick);
    applyLightbox(state.lightbox);
    applyQview(state.qview);
  }

  function applyState(state) {
    if (!state) return;
    if (!forceGo) {
      pendingState = state;
      return;
    }
    window.__koinaApplying = true;
    try {
      if (typeof state.slideIndex === "number") {
        forceGo(state.slideIndex, true);
        // Re-apply on next frames — deck private go() can fight the first paint
        if (state.force || state.prompt) {
          var idx = state.slideIndex;
          requestAnimationFrame(function() {
            if (forceGo) forceGo(idx, true);
            requestAnimationFrame(function() {
              if (forceGo) forceGo(idx, true);
            });
          });
        }
      }
      if (state.lang) applyLang(state.lang);
      applyArtifacts(state);
      // Beat any late deck render()/hashchange that resets build steps
      requestAnimationFrame(function() {
        window.__koinaApplying = true;
        try { applyArtifacts(state); } finally {
          setTimeout(function(){ window.__koinaApplying = false; }, 80);
        }
      });
      if (state.force || state.prompt) {
        try {
          var slides = $$(".slide");
          var i = typeof state.slideIndex === "number" ? state.slideIndex : 0;
          if (slides[i]) {
            slides[i].scrollTop = 0;
            slides[i].classList.add("koina-sync-flash");
            setTimeout(function(){ slides[i].classList.remove("koina-sync-flash"); }, 700);
          }
        } catch (e) {}
      }
    } finally {
      setTimeout(function(){ window.__koinaApplying = false; }, 120);
    }
  }

  function applyPollTallies(activityKey, counts) {
    var poll = document.querySelector('.poll[data-poll="' + activityKey + '"]');
    if (!poll) return;
    var opts = poll.querySelectorAll(".opt");
    var max = 1;
    opts.forEach(function(o, i) {
      var n = counts[String(i)] || counts["opt:" + i] || 0;
      max = Math.max(max, n);
    });
    opts.forEach(function(o, i) {
      var n = counts[String(i)] || counts["opt:" + i] || 0;
      var ct = o.querySelector(".ct");
      var bar = o.querySelector(".bar");
      if (ct) ct.textContent = String(n);
      if (bar) {
        bar.style.width = (n / max * 100) + "%";
        bar.classList.toggle("zero", !n);
      }
      // Keep deck-local poll handlers dead
      o.onclick = null;
      o.oncontextmenu = null;
    });
  }

  function applyNetworksTallies(counts, meta) {
    var cloud = $("#cloud");
    var cats = $("#nwCats");
    meta = meta || {};
    window.__koinaApplyingNetworks = true;
    try {
      if (cats) {
        Array.prototype.forEach.call(cats.children, function(b, i) {
          var c = b.querySelector(".c");
          var n = counts["cat:" + i] || 0;
          if (c) c.textContent = n ? String(n) : "";
          // Keep deck-local onclick dead after every paint
          b.onclick = null;
          b.oncontextmenu = null;
        });
      }
      if (!cloud) return;
      var keys = Object.keys(counts).filter(function(k) { return counts[k] > 0; });
      cloud.innerHTML = "";
      if (!keys.length) {
        cloud.innerHTML = '<p class="empty"><span class="e">Words appear here as people answer.</span><span class="j">回答すると、ここに言葉が現れます。</span></p>';
        return;
      }
      var max = 1;
      keys.forEach(function(k) { max = Math.max(max, counts[k]); });
      var ranked = keys.slice().sort(function(a, b) { return counts[b] - counts[a]; });
      var mode = document.body.classList.contains("m-ja") ? "ja"
        : document.body.classList.contains("m-en") ? "en" : "both";
      keys.sort(function(a, b) {
        var ha = 0, hb = 0, i;
        for (i = 0; i < a.length; i++) ha = (ha * 31 + a.charCodeAt(i)) >>> 0;
        for (i = 0; i < b.length; i++) hb = (hb * 31 + b.charCodeAt(i)) >>> 0;
        return (ha % 97) - (hb % 97);
      });
      keys.forEach(function(k) {
        var n = counts[k];
        var m = meta[k] || {};
        var en = m.en || m.label || (k.indexOf("free:") === 0 ? k.slice(5) : k);
        var ja = m.ja || en;
        var b = document.createElement("button");
        b.className = "w";
        b.type = "button";
        b.title = "Remove one";
        b.setAttribute("data-koina-key", k);
        if (mode === "both" && ja && ja !== en) {
          var e1 = document.createElement("span");
          e1.textContent = en;
          var j1 = document.createElement("small");
          j1.textContent = ja;
          b.appendChild(e1);
          b.appendChild(j1);
        } else {
          b.textContent = mode === "ja" ? ja : en;
        }
        var r = max === 1 ? 0.35 : (n - 1) / (max - 1);
        b.style.fontSize = "calc(max(15px, var(--u) * " + (1.4 + r * 3.2).toFixed(2) + "))";
        var rank = ranked.indexOf(k);
        b.style.color = rank < 1 && max > 1 ? "var(--kaki)" : rank < 4 ? "var(--ai)" : "var(--ink)";
        b.style.opacity = String((0.55 + 0.45 * (r || 0.35)).toFixed(2));
        cloud.appendChild(b);
      });
    } finally {
      setTimeout(function() { window.__koinaApplyingNetworks = false; }, 0);
    }
  }

  function applySpacesTallies(counts, meta) {
    var spG = $("#spGrid");
    if (!spG) return;
    meta = meta || {};
    window.__koinaApplyingSpaces = true;
    try {
      // Update existing cards
      $$("#spGrid .sp").forEach(function(card) {
        var nameEl = card.querySelector(".sp-name .e") || card.querySelector(".sp-name span");
        var name = (nameEl && nameEl.textContent) || "";
        card.querySelectorAll("button[data-k]").forEach(function(btn) {
          var kind = btn.getAttribute("data-k");
          var n = counts[name + ":" + kind] || 0;
          var span = btn.querySelector(".n");
          if (span) span.textContent = String(n);
          btn.onclick = null;
          btn.oncontextmenu = null;
        });
      });
      // Append free-form spaces that aren't in the grid yet
      Object.keys(counts).forEach(function(key) {
        if (key.slice(-6) !== ":added" || !counts[key]) return;
        var name = (meta[key] && meta[key].name) || key.slice(0, -6);
        var exists = false;
        $$("#spGrid .sp").forEach(function(card) {
          var nameEl = card.querySelector(".sp-name .e") || card.querySelector(".sp-name span");
          if (nameEl && nameEl.textContent === name) exists = true;
        });
        if (exists) return;
        var c = document.createElement("div");
        c.className = "sp";
        c.innerHTML =
          '<div class="sp-name"><span><span class="e">' + name + '</span></span><span class="sp-kind">added</span></div>' +
          '<div class="sp-btns">' +
          '<button data-k="been" type="button"><span class="in"><span class="e">Been</span><span class="j">行った</span></span><span class="n">0</span></button>' +
          '<button data-k="heard" type="button"><span class="in"><span class="e">Heard</span><span class="j">知ってる</span></span><span class="n">0</span></button>' +
          '<button data-k="up" class="up" type="button">★<span class="n">' + counts[key] + '</span></button>' +
          '</div>';
        c.querySelectorAll("button[data-k]").forEach(function(btn) {
          btn.onclick = null;
          btn.oncontextmenu = null;
        });
        spG.appendChild(c);
      });
    } finally {
      setTimeout(function() { window.__koinaApplyingSpaces = false; }, 0);
    }
  }

  var lastTalliesData = null;

  function applyTallies(data) {
    if (!data) return;
    // Support { tallies, meta } and legacy bare tallies map
    var tallies = data.tallies && typeof data.tallies === "object" ? data.tallies : data;
    var meta = data.meta && typeof data.meta === "object" ? data.meta : {};
    if (!tallies || typeof tallies !== "object") return;
    lastTalliesData = { tallies: tallies, meta: meta };
    window.__koinaApplyingTallies = true;

    try {
      // Always drive these from the server snapshot (including empty = clear local deck state)
      applyNetworksTallies(tallies.networks || {}, meta.networks || {});
      applySpacesTallies(tallies.spaces || {}, meta.spaces || {});

      // Paint every known poll (zero missing keys so local deck counts cannot linger)
      $$(".poll[data-poll]").forEach(function(p) {
        var key = p.getAttribute("data-poll");
        if (!key) return;
        applyPollTallies(key, tallies[key] || {});
      });
      Object.keys(tallies).forEach(function(activityKey) {
        if (activityKey === "networks" || activityKey === "spaces") return;
        if (document.querySelector('.poll[data-poll="' + activityKey + '"]')) return;
        applyPollTallies(activityKey, tallies[activityKey] || {});
      });
    } finally {
      setTimeout(function() { window.__koinaApplyingTallies = false; }, 0);
    }
  }

  // Wait for slides in the DOM (deck go() is usually private in an IIFE)
  function waitForDeck(cb) {
    var n = 0;
    (function tick() {
      if ($$(".slide").length || n > 100) return cb();
      n++;
      setTimeout(tick, 40);
    })();
  }

  waitForDeck(function() {
    var slides = $$(".slide");
    // Kairos / Vision Japan decks use .slide.cur + opacity, not .on + display
    var usesCur = slides.some(function(s) { return s.classList.contains("cur"); });
    tagThumbs();

    function paintCurSlides(i) {
      for (var s = 0; s < slides.length; s++) {
        var on = s === i;
        slides[s].classList.toggle("cur", on);
        slides[s].classList.remove("push-in", "push-out");
        // Clear any prior display overrides from legacy sync
        slides[s].style.removeProperty("display");
        if (on) {
          slides[s].removeAttribute("aria-hidden");
          try { slides[s].inert = false; } catch (e) {}
        } else {
          slides[s].setAttribute("aria-hidden", "true");
          try { slides[s].inert = true; } catch (e) {}
        }
      }
      var count = $("#count");
      if (count) count.textContent = (i + 1) + " / " + slides.length;
      var ttl = $("#ttl");
      if (ttl) ttl.textContent = (slides[i] && slides[i].dataset.title) || "";
      var notesText = $("#notesText");
      if (notesText) notesText.textContent = (slides[i] && slides[i].dataset.notes) || "";
    }

    function localGo(i, fromRemote) {
      if (!slides.length) return;
      i = Math.max(0, Math.min(slides.length - 1, i | 0));

      if (usesCur) {
        // Never set location.hash on remote apply — hashchange resets private step to 0
        // and wipes build-step / artifact sync. Paint classes only.
        paintCurSlides(i);
        if (!fromRemote) {
          try { history.replaceState(null, "", "#s" + (i + 1)); } catch (e) {}
        }
      } else {
        // Classic decks: .on + display
        for (var s = 0; s < slides.length; s++) {
          var on = s === i;
          slides[s].classList.toggle("on", on);
          if (on) {
            slides[s].style.setProperty("display", "flex", "important");
          } else {
            slides[s].style.setProperty("display", "none", "important");
          }
        }
        if (!fromRemote) {
          try { history.replaceState(null, "", "#s" + (i + 1)); } catch (e) {}
        }
      }

      if (slides[i]) slides[i].scrollTop = 0;
      var pg = $("#pg");
      var pgTotal = $("#pgTotal");
      var prog = $("#prog");
      var secname = $("#secname");
      if (pg) pg.value = String(i + 1);
      if (pgTotal) pgTotal.textContent = String(slides.length);
      if (prog) prog.style.width = ((i + 1) / slides.length * 100) + "%";
      if (secname) secname.textContent = (slides[i] && slides[i].dataset.title) || "";
      if (!fromRemote && !window.__koinaApplying) scheduleEmit();
    }

    forceGo = localGo;
    window.__koinaForceGo = localGo;

    // Always expose go for remote apply; wrap existing if present
    if (typeof window.go === "function") {
      var originalGo = window.go;
      window.go = function(i) {
        if (MODE === "view" && !window.__koinaApplying) return;
        try { originalGo(i); } catch (e) { localGo(i, window.__koinaApplying); }
        if (!window.__koinaApplying) scheduleEmit();
      };
    } else {
      window.go = function(i) {
        if (MODE === "view" && !window.__koinaApplying) return;
        localGo(i, window.__koinaApplying);
      };
    }

    // Flash style when presenter prompts a jump
    var flashStyle = document.createElement("style");
    flashStyle.textContent = ".slide.koina-sync-flash{outline:3px solid #c95a24;outline-offset:-3px}";
    document.head.appendChild(flashStyle);

    $$("#bar .seg button").forEach(function(b) {
      b.addEventListener("click", function() {
        scheduleEmit();
      });
    });

    var lb = lightboxRoot();
    if (lb) {
      new MutationObserver(function() {
        if (!window.__koinaApplying && MODE === "present") scheduleEmit();
      }).observe(lb, { attributes: true, attributeFilter: ["hidden"] });
    }

    slides.forEach(function(s) {
      new MutationObserver(function() {
        if (!window.__koinaApplying && MODE === "present" && isActiveSlide(s)) {
          scheduleEmit();
        }
      }).observe(s, { attributes: true, attributeFilter: ["class"] });
    });

    // Presenter nav clicks (private go) — also emit after click
    ["#prev", "#next", "#grid"].forEach(function(sel) {
      var el = $(sel);
      if (!el) return;
      el.addEventListener("click", function() {
        scheduleEmit();
      }, true);
    });

    if (MODE === "view") {
      var style = document.createElement("style");
      style.textContent = "#prev, #next, #gridbtn, #pg, #grid, [data-go] { pointer-events: none !important; opacity: .55 }";
      document.head.appendChild(style);
      document.body.classList.add("koina-view");

      document.addEventListener("keydown", function(e) {
        if (e.target && e.target.closest && e.target.closest("input,textarea")) return;
        if (["ArrowRight","ArrowLeft","PageDown","PageUp"," ","Home","End","g","G","Enter","Backspace"].indexOf(e.key) >= 0) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      }, true);

      ["deck", "stage"].forEach(function(id) {
        var root = document.getElementById(id);
        if (!root) return;
        root.addEventListener("touchstart", function(e) { e.stopImmediatePropagation(); }, true);
        root.addEventListener("touchend", function(e) { e.stopImmediatePropagation(); }, true);
      });
      document.addEventListener("click", function(e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (window.__koinaApplying) return;
        if (t.closest("#prev, #next, #gridbtn, #pg, #grid, [data-go], .road button")) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        // Block stage tap-to-advance (Vision Japan / Kairos), keep thumbs usable for local peek
        if (t.closest("#stage") && !t.closest(".thumb, #lb, #lightbox, button.lbbtn")) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
    }

    function reassertTallies() {
      if (lastTalliesData) applyTallies(lastTalliesData);
    }

    // Deck private renderCloud()/poll render()/spRender() wipe server UI.
    // Keep __rc pointing at the server snapshot, never the deck renderer.
    window.__rc = reassertTallies;
    setInterval(function() {
      window.__rc = reassertTallies;
      disarmDeckPolls();
      disarmDeckSpaces();
      reassertTallies();
    }, 400);

    // If the deck wipes interactive UIs, paint server state back immediately
    var cloudEl = $("#cloud");
    var catsEl = $("#nwCats");
    var spGridEl = $("#spGrid");
    var moTimer = null;
    var mo = new MutationObserver(function() {
      if (
        !lastTalliesData ||
        window.__koinaApplyingTallies ||
        window.__koinaApplyingNetworks ||
        window.__koinaApplyingSpaces
      ) {
        return;
      }
      if (moTimer) clearTimeout(moTimer);
      moTimer = setTimeout(reassertTallies, 0);
    });
    if (cloudEl) mo.observe(cloudEl, { childList: true, subtree: true });
    if (catsEl) mo.observe(catsEl, { childList: true, subtree: true, characterData: true });
    if (spGridEl) mo.observe(spGridEl, { childList: true, subtree: true, characterData: true });
    $$(".poll").forEach(function(p) {
      mo.observe(p, { childList: true, subtree: true, characterData: true });
    });

    function submitNetworkWords(raw) {
      String(raw || "").split(/[,，、]/).map(function(t){ return t.trim(); }).filter(Boolean).slice(0, 10).forEach(function(t) {
        var t2 = t.slice(0, 40);
        postActivity({
          activityKey: "networks",
          optionKey: "free:" + t2.toLowerCase(),
          delta: 1,
          label: t2,
          payload: { en: t2, ja: t2 }
        });
      });
    }

    // Strip deck-local handlers that only update private in-memory counts.
    function disarmDeckNetworks() {
      var form = $("#nwForm");
      if (form && form.parentNode && !form.dataset.koinaWired) {
        var clone = form.cloneNode(true);
        clone.dataset.koinaWired = "1";
        form.parentNode.replaceChild(clone, form);
      }
      var clearBtn = $("#nwClear");
      if (clearBtn) {
        clearBtn.onclick = null;
        clearBtn.dataset.koinaWired = "1";
      }
      $$("#nwCats button").forEach(function(b) {
        b.onclick = null;
        b.oncontextmenu = null;
      });
    }
    function disarmDeckPolls() {
      $$(".poll .opt").forEach(function(o) {
        o.onclick = null;
        o.oncontextmenu = null;
      });
      $$(".poll-foot [data-reset], [data-reset]").forEach(function(r) {
        if (r.closest && r.closest(".poll-foot, .slide")) r.onclick = null;
      });
    }
    function disarmDeckSpaces() {
      var form = $("#spForm");
      if (form && form.parentNode && !form.dataset.koinaWired) {
        var clone = form.cloneNode(true);
        clone.dataset.koinaWired = "1";
        form.parentNode.replaceChild(clone, form);
      }
      var reset = $("#spReset");
      if (reset) reset.onclick = null;
      $$("#spGrid button[data-k]").forEach(function(b) {
        b.onclick = null;
        b.oncontextmenu = null;
      });
    }
    disarmDeckNetworks();
    disarmDeckPolls();
    disarmDeckSpaces();
    setTimeout(function() {
      disarmDeckNetworks();
      disarmDeckPolls();
      disarmDeckSpaces();
    }, 0);
    setTimeout(function() {
      disarmDeckNetworks();
      disarmDeckPolls();
      disarmDeckSpaces();
    }, 250);

    // Document-level capture so any remaining deck listeners cannot win
    document.addEventListener("submit", function(e) {
      var form = e.target;
      if (!form) return;
      if (form.id === "nwForm") {
        e.preventDefault();
        e.stopImmediatePropagation();
        var inp = $("#nwInput");
        var raw = (inp && inp.value || "").trim();
        if (!raw) return;
        submitNetworkWords(raw);
        if (inp) inp.value = "";
        return;
      }
      if (form.id === "spForm") {
        e.preventDefault();
        e.stopImmediatePropagation();
        var spin = $("#spInput");
        var v = (spin && spin.value || "").trim().slice(0, 40);
        if (!v) return;
        postActivity({
          activityKey: "spaces",
          optionKey: v + ":added",
          delta: 1,
          label: v,
          payload: { name: v, kind: "added" }
        });
        if (spin) spin.value = "";
      }
    }, true);

    function handlePollOpt(e, opt, deltaForce) {
      var poll = opt.closest(".poll[data-poll]");
      if (!poll) return false;
      e.preventDefault();
      e.stopImmediatePropagation();
      var key = poll.getAttribute("data-poll") || "poll";
      var opts = Array.prototype.slice.call(poll.querySelectorAll(".opt"));
      var i = opts.indexOf(opt);
      if (i < 0) return true;
      var lab = (opt.querySelector(".lab") && opt.querySelector(".lab").textContent) || ("Option " + (i + 1));
      var delta = deltaForce != null ? deltaForce : (e.shiftKey ? -1 : 1);
      postActivity({
        activityKey: key,
        optionKey: String(i),
        delta: delta,
        label: lab
      });
      return true;
    }

    document.addEventListener("click", function(e) {
      var t = e.target;
      if (!t || !t.closest) return;

      if (t.closest("#nwClear")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        postActivityReset("networks");
        return;
      }

      var catBtn = t.closest("#nwCats button");
      if (catBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var cats = $("#nwCats");
        var buttons = cats ? Array.prototype.slice.call(cats.querySelectorAll("button")) : [];
        var i = buttons.indexOf(catBtn);
        if (i < 0) return;
        var en = (catBtn.querySelector(".e") && catBtn.querySelector(".e").textContent) || ("cat " + i);
        var ja = (catBtn.querySelector(".j") && catBtn.querySelector(".j").textContent) || en;
        postActivity({
          activityKey: "networks",
          optionKey: "cat:" + i,
          delta: e.shiftKey ? -1 : 1,
          label: en,
          payload: { en: en, ja: ja }
        });
        return;
      }

      var wordBtn = t.closest("#cloud button.w");
      if (wordBtn) {
        var wkey = wordBtn.getAttribute("data-koina-key");
        if (!wkey) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        var metaN = (lastTalliesData && lastTalliesData.meta && lastTalliesData.meta.networks) || {};
        var m = metaN[wkey] || {};
        var wen = m.en || m.label || (wkey.indexOf("free:") === 0 ? wkey.slice(5) : wkey);
        var wja = m.ja || wen;
        postActivity({
          activityKey: "networks",
          optionKey: wkey,
          delta: -1,
          label: wen,
          payload: { en: wen, ja: wja }
        });
        return;
      }

      // Poll option click
      var opt = t.closest(".poll .opt");
      if (opt && handlePollOpt(e, opt, null)) return;

      // Poll reset (presenter/admin enforced server-side)
      var resetBtn = t.closest("[data-reset]");
      if (resetBtn) {
        var resetPoll = resetBtn.closest(".slide") && resetBtn.closest(".slide").querySelector(".poll[data-poll]");
        if (!resetPoll && resetBtn.parentElement) {
          resetPoll = resetBtn.parentElement.querySelector(".poll[data-poll]");
        }
        if (resetPoll) {
          e.preventDefault();
          e.stopImmediatePropagation();
          postActivityReset(resetPoll.getAttribute("data-poll") || "poll");
          return;
        }
      }

      // Third-spaces questionnaire
      if (t.closest("#spReset")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        postActivityReset("spaces");
        return;
      }
      var spBtn = t.closest("#spGrid button[data-k]");
      if (spBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var card = spBtn.closest(".sp");
        var nameEl = card && (card.querySelector(".sp-name .e") || card.querySelector(".sp-name span"));
        var name = (nameEl && nameEl.textContent) || "space";
        var kind = spBtn.getAttribute("data-k");
        postActivity({
          activityKey: "spaces",
          optionKey: name + ":" + kind,
          delta: e.shiftKey ? -1 : 1,
          label: name + " / " + kind,
          payload: { name: name, kind: kind }
        });
      }
    }, true);

    document.addEventListener("contextmenu", function(e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var opt = t.closest(".poll .opt");
      if (opt && handlePollOpt(e, opt, -1)) return;
      var spBtn = t.closest("#spGrid button[data-k]");
      if (spBtn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var card = spBtn.closest(".sp");
        var nameEl = card && (card.querySelector(".sp-name .e") || card.querySelector(".sp-name span"));
        var name = (nameEl && nameEl.textContent) || "space";
        var kind = spBtn.getAttribute("data-k");
        postActivity({
          activityKey: "spaces",
          optionKey: name + ":" + kind,
          delta: -1,
          label: name + " / " + kind,
          payload: { name: name, kind: kind }
        });
      }
    }, true);

    if (MODE === "present") {
      // Icon next to presenter clock (or end of #bar): bring all viewers to this slide
      if (!$("#koinaBring")) {
        var bringBtn = document.createElement("button");
        bringBtn.id = "koinaBring";
        bringBtn.className = "nb";
        bringBtn.type = "button";
        bringBtn.title = "Bring viewers to this slide";
        bringBtn.setAttribute("aria-label", "Bring viewers to this slide");
        bringBtn.innerHTML = '<span aria-hidden="true">◎</span>';
        bringBtn.style.cssText =
          "display:inline-flex!important;align-items:center;justify-content:center;color:var(--kaki, #c95a24);border-color:var(--kaki, #c95a24);min-width:32px";
        bringBtn.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          bringBtn.classList.add("koina-bring-pulse");
          setTimeout(function(){ bringBtn.classList.remove("koina-bring-pulse"); }, 600);
          post("bring-viewers", collectState());
        });
        var clock = $("#clock");
        var bar = $("#bar");
        if (clock && clock.parentNode) {
          clock.parentNode.insertBefore(bringBtn, clock.nextSibling);
        } else if (bar) {
          bar.appendChild(bringBtn);
        } else {
          bringBtn.style.cssText +=
            ";position:fixed;top:10px;right:10px;z-index:9999;background:var(--paper,#fff);border:1px solid var(--kaki,#c95a24);padding:6px 10px;cursor:pointer";
          document.body.appendChild(bringBtn);
        }
        var bringStyle = document.createElement("style");
        bringStyle.textContent =
          "#koinaBring{display:inline-flex!important;visibility:visible!important;opacity:1!important}" +
          "#koinaBring.koina-bring-pulse{background:var(--kaki,#c95a24)!important;color:var(--paper,#fff)!important}" +
          "@media (max-width:600px){#bar #koinaBring,#koinaBring{display:inline-flex!important}}";
        document.head.appendChild(bringStyle);
      }

      document.addEventListener("click", function(e) {
        if (window.__koinaApplying) return;
        var t = e.target;
        if (shouldSyncClick(t)) {
          var el = clickTarget(t);
          var thumb = thumbKeyFromEl(el || t);
          var path = el ? (el.getAttribute && el.getAttribute("data-koina-thumb")
            ? '[data-koina-thumb="' + el.getAttribute("data-koina-thumb") + '"]'
            : cssPath(el)) : "";
          if (path || thumb) {
            lastClickPayload = { path: path || undefined, thumb: thumb, at: Date.now() };
          }
        }
        scheduleEmit();
      }, true);
      document.addEventListener("keydown", function(e) {
        if (["ArrowRight","ArrowLeft","PageDown","PageUp"," ","Home","End"].indexOf(e.key) >= 0) {
          scheduleEmit();
        }
      }, true);

      // Safety net if an interaction misses scheduleEmit
      var lastIdx = currentSlideIndex();
      var lastLang = currentLang();
      var lastStep = currentStep();
      setInterval(function() {
        if (window.__koinaApplying) return;
        var idx = currentSlideIndex();
        var lang = currentLang();
        var step = currentStep();
        var lb = readLightbox();
        if (idx !== lastIdx || lang !== lastLang || step !== lastStep) {
          lastIdx = idx;
          lastLang = lang;
          lastStep = step;
          scheduleEmit();
        } else if (lb.open !== (window.__koinaLastLbOpen === true)) {
          window.__koinaLastLbOpen = lb.open;
          scheduleEmit();
        } else if (
          lb.open &&
          (
            (lb.group || "") !== (window.__koinaLastLbGroup || "") ||
            (lb.index != null ? lb.index : -1) !== (window.__koinaLastLbIndex != null ? window.__koinaLastLbIndex : -1)
          )
        ) {
          window.__koinaLastLbGroup = lb.group || "";
          window.__koinaLastLbIndex = lb.index;
          scheduleEmit();
        }
      }, 100);
    }

    if (pendingState) {
      applyState(pendingState);
      pendingState = null;
    }

    if (MODE === "present") emitState();
    post("ready", { mode: MODE, slides: slides.length, slideIndex: currentSlideIndex() });
  });

  window.addEventListener("message", function(ev) {
    var data = ev.data;
    if (!data || data.source !== "koina-forum-host") return;
    if (data.type === "apply-state" || data.type === "force-slide") applyState(data.payload);
    if (data.type === "apply-tallies") applyTallies(data.payload);
    // Heartbeat / initial sync — do not set prompt (that is bring-viewers only)
    if (data.type === "request-state" && MODE === "present") emitState();
    if (data.type === "request-bring" && MODE === "present") {
      post("bring-viewers", collectState());
    }
  });
})();
</script>`;
}

export function injectForumBridge(
  html: string,
  mode: "present" | "view" | "browse",
  sessionId: string,
) {
  const bridge = buildForumBridgeScript(mode, sessionId);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${bridge}</body>`);
  }
  return `${html}${bridge}`;
}
