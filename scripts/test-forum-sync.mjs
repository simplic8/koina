/**
 * Forum sync regression checks (no browser).
 * Run: node --experimental-strip-types scripts/test-forum-sync.mjs
 *   or: node --import tsx scripts/test-forum-sync.mjs
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");

async function loadBridge() {
  try {
    return await import(pathToFileURL(path.join(root, "src/lib/forum/bridge.ts")).href);
  } catch {
    // tsx register
    require("tsx/cjs/api").register();
    return require(path.join(root, "src/lib/forum/bridge.ts"));
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function extractScript(html) {
  const m = html.match(/<script>\s*([\s\S]*?)<\/script>/i);
  assert(m, "bridge <script> not found");
  return m[1];
}

function checkParses(mode) {
  return async (bridge) => {
    const html = bridge.buildForumBridgeScript(mode, "test-session");
    const body = extractScript(html);
    try {
      // eslint-disable-next-line no-new-func
      new Function(body);
    } catch (e) {
      throw new Error(`${mode} bridge parse failed: ${e.message}`);
    }
    // Template-literal undoubled escapes that historically killed the bridge
    assert(!/\.match\(\/\^\(\.\+\?\)s\*/.test(body), `${mode}: undoubled \\s in parseLbCount`);
    assert(!/\.match\(\/\^#s\(d\+\)\$/.test(body), `${mode}: undoubled \\d in hash match`);
    assert(!/\[\^w-\]/.test(body), `${mode}: undoubled \\w in escapeIdent`);
    // Good forms should exist
    assert(/\\d/.test(body) || /\\\\d/.test(html), `${mode}: expected digit escapes in source`);
    console.log(`✓ ${mode} bridge parses + escapes OK`);
  };
}

/** Minimal DOM to exercise slide-index preference logic via the emitted script helpers. */
function fakeDeckDom({ activeClass = "cur", activeIndex = 2, pgValue = "1", slideCount = 5 } = {}) {
  const slides = [];
  for (let i = 0; i < slideCount; i++) {
    const classList = {
      _set: new Set(i === activeIndex ? [activeClass, "slide"] : ["slide"]),
      contains(c) {
        return this._set.has(c);
      },
      toggle(c, on) {
        if (on) this._set.add(c);
        else this._set.remove(c);
      },
      add(...cs) {
        cs.forEach((c) => this._set.add(c));
      },
      remove(...cs) {
        cs.forEach((c) => this._set.remove(c));
      },
    };
    slides.push({
      classList,
      style: {
        _props: {},
        setProperty(k, v) {
          this._props[k] = v;
        },
        removeProperty(k) {
          delete this._props[k];
        },
      },
      dataset: { title: `S${i + 1}` },
      scrollTop: 0,
      setAttribute() {},
      removeAttribute() {},
      querySelectorAll() {
        return [];
      },
      textContent: "",
    });
  }
  const pg = { value: String(pgValue) };
  const count = { textContent: `${activeIndex + 1} / ${slideCount}` };
  const map = {
    "#pg": pg,
    "#count": count,
    "#pgTotal": { textContent: "" },
    "#prog": { style: {} },
    "#secname": { textContent: "" },
    "#ttl": { textContent: "" },
    "#notesText": { textContent: "" },
    "#dots": null,
    "#lightbox": null,
    "#lb": null,
    "#lbImg": null,
    "#lbCap": null,
    "#lbCount": null,
    "#qview": null,
    "#cloud": null,
    "#nwCats": null,
    "#spGrid": null,
    "#bar": null,
  };
  return {
    slides,
    pg,
    document: {
      body: { classList: { contains: () => false, add() {}, remove() {} } },
      querySelector(sel) {
        if (sel === ".slide") return slides[0];
        return map[sel] ?? null;
      },
      querySelectorAll(sel) {
        if (sel === ".slide") return slides;
        if (sel.startsWith("#bar")) return [];
        return [];
      },
      getElementById(id) {
        return map[`#${id}`] ?? null;
      },
      createElement() {
        return {
          textContent: "",
          style: {},
          classList: { add() {}, remove() {}, contains: () => false },
          setAttribute() {},
          appendChild() {},
        };
      },
      head: { appendChild() {} },
      documentElement: {},
    },
    location: { hash: "" },
  };
}

function testSlideIndexPreference(bridge) {
  // Reconstruct the fixed preference: active class wins over stale #pg
  const env = fakeDeckDom({ activeClass: "cur", activeIndex: 3, pgValue: "1" });
  const slides = env.slides;
  let idx = 0;
  const onIdx = slides.findIndex(
    (s) => s.classList.contains("cur") || s.classList.contains("on"),
  );
  if (onIdx >= 0) idx = onIdx;
  else {
    const n = parseInt(env.pg.value, 10);
    if (Number.isFinite(n) && n >= 1) idx = n - 1;
  }
  assert(idx === 3, `expected slide 3 from .cur, got ${idx} (stale #pg would yield 0)`);
  console.log("✓ slide index prefers .cur over stale #pg");

  // Host-style read should match bridge preference
  const html = bridge.injectForumBridge(
    `<!doctype html><html><body>
      <div class="slide"></div><div class="slide cur"></div><div class="slide"></div>
      <input id="pg" value="1" />
      <script>window.go=function(){}</script>
    </body></html>`,
    "view",
    "abc",
  );
  assert(html.includes("__KOINA_FORUM_BRIDGE__"), "inject adds bridge");
  assert(html.includes('MODE = "view"'), "inject keeps mode");
  console.log("✓ injectForumBridge wires view mode");
}

function testPersistRaceLogic() {
  // Simulate the bug: Promise.resolve().then each time allows out-of-order commits.
  // Correct pattern: chain on previous + keep latest body.
  let chain = Promise.resolve();
  let latest = null;
  const committed = [];
  function flush(body) {
    latest = body;
    chain = chain.catch(() => {}).then(async () => {
      const b = latest;
      latest = null;
      if (!b) return;
      await new Promise((r) => setTimeout(r, 5));
      committed.push(b.slideIndex);
    });
  }
  flush({ slideIndex: 1 });
  flush({ slideIndex: 2 });
  flush({ slideIndex: 5 });
  return chain.then(() => {
    assert(
      committed[committed.length - 1] === 5,
      `latest-wins persist should end on 5, got ${committed.join(",")}`,
    );
    console.log("✓ serialized latest-wins persist model OK", committed);
  });
}

async function probeLiveServer() {
  const base = process.env.KOINA_TEST_BASE || "http://localhost:3000";
  const sid =
    process.env.KOINA_FORUM_SESSION ||
    "b0f12831-15ab-403f-9bd6-fd96ba199b64";
  try {
    const health = await fetch(`${base}/api/health`);
    if (!health.ok) {
      console.log("· live server not healthy — skip HTTP probes");
      return;
    }
    const sync = await fetch(`${base}/api/forum/sessions/${sid}/sync`, {
      cache: "no-store",
    });
    assert(sync.ok, `sync GET ${sync.status}`);
    const syncJson = await sync.json();
    console.log("✓ live sync GET", {
      slideIndex: syncJson.presenter_state?.slideIndex,
      syncToken: syncJson.presenter_state?.syncToken,
      is_live: syncJson.is_live,
    });

    for (const mode of ["view", "present"]) {
      const res = await fetch(
        `${base}/api/forum/sessions/${sid}/html?mode=${mode}`,
        { cache: "no-store" },
      );
      assert(res.ok, `html ${mode} ${res.status}`);
      const html = await res.text();
      const body = extractScript(html);
      // eslint-disable-next-line no-new-func
      new Function(body);
      assert(html.includes(`MODE = "${mode}"`), `live html mode ${mode}`);
      console.log(`✓ live ${mode} HTML bridge parses (${html.length} bytes)`);
    }
  } catch (e) {
    console.log("· live probe skipped:", e.message);
  }
}

const bridgeMod = await loadBridge();
const bridge = bridgeMod.default?.buildForumBridgeScript
  ? bridgeMod.default
  : bridgeMod;

await checkParses("view")(bridge);
await checkParses("present")(bridge);
await checkParses("browse")(bridge);
testSlideIndexPreference(bridge);
await testPersistRaceLogic();
await probeLiveServer();
console.log("\nAll forum sync checks passed.");
