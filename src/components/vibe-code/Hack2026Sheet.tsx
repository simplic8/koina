"use client";

import {
  Bricolage_Grotesque,
  JetBrains_Mono,
  Public_Sans,
} from "next/font/google";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import "./hack2026-sheet.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/** AI paste prompts — intentionally NOT translated. */
const PROMPT_BUILD = `Make me a webapp in this folder and start it up so I can see it in my browser. Use Next.js with the App Router and TypeScript and the backend with Supabase.

Here is what the webapp is:
Prayer wall for users to view or post prayer requests. Include function to upvote when they prayed and other social elements such as commenting and community reporting. Users have to login via email and password via Supabase to post/edit/delete their posts. Admin will be able to see community reports and archive/hide/delete a post.

Connect the webapp to my Supabase database:
- Install whatever Supabase needs
- Generate all the sql tables and queries for my webapp in a single .sql file for me to paste into Supabase
- Generate all the keys in a file called .env.local, named NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY — read them from there and never put them in the code

If something goes wrong saving, put a clear message on the screen so I can see it. Do not let it fail quietly. When it is running, tell me the address to open.`;

const PROMPT_SHIP =
  "Get this project onto GitHub so I can deploy it. After pushing to Github, connect it to Vercel and deploy it.";

const TAG_RE = /<(b|i|em|code)>([\s\S]*?)<\/\1>/g;

/** Renders `<b>`, `<i>`, `<em>` and `<code>` markers inside translated strings. */
function Rich({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(TAG_RE)) {
    const index = m.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const Tag = m[1] as "b" | "i" | "em" | "code";
    nodes.push(<Tag key={n++}>{m[2]}</Tag>);
    last = index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

const STEPS = [1, 2, 3, 4, 5, 6, 7] as const;
const PRE_ITEMS = [1, 2, 3, 4, 5, 6] as const;
const KEY_ITEMS = [1, 2, 3] as const;
const VERCEL_ITEMS = [1, 2, 3, 4, 5, 6] as const;

const CONCEPTS = [
  { id: "nextjs", n: "01", name: "Next.js" },
  { id: "supabase", n: "02", name: "Supabase" },
  { id: "github", n: "03", name: "GitHub" },
  { id: "vercel", n: "04", name: "Vercel" },
] as const;

const SKILLS = [
  {
    key: "hack.skill.emil",
    name: "Emil Kowalski's Design Eng",
    host: "emilkowal.ski/skill",
    install: "npx skills add emilkowalski/skill",
    run: "/emil-design-eng · /animate",
  },
  {
    key: "hack.skill.impeccable",
    name: "Impeccable",
    host: "impeccable.style",
    install: "npx impeccable install",
    run: "/impeccable init · /impeccable polish",
  },
  {
    key: "hack.skill.taste",
    name: "Taste Skill",
    host: "tasteskill.dev/docs",
    install: "npx skills add Leonxlnx/taste-skill",
    run: "/taste",
  },
] as const satisfies readonly {
  key: MessageKey;
  name: string;
  host: string;
  install: string;
  run: string;
}[];

type CopyState = "ok" | "fail";

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy path
    }
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-1000px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function Lnk({
  what,
  href,
  linkLabel,
  hint,
  solid,
}: {
  what: ReactNode;
  href?: string;
  linkLabel?: string;
  hint: ReactNode;
  solid?: boolean;
}) {
  return (
    <span className="lnk" style={solid ? { borderTopStyle: "solid" } : undefined}>
      <span className="what">{what}</span>
      {href ? <ExtLink href={href}>{linkLabel ?? href}</ExtLink> : null}
      <span className="hint">{hint}</span>
    </span>
  );
}

export function Hack2026Sheet() {
  const { t, locale } = useLocale();
  const r = (key: MessageKey, params?: Record<string, string | number>) => (
    <Rich text={t(key, params)} />
  );

  const [copyState, setCopyState] = useState<Record<string, CopyState>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleCopy = useCallback(async (id: string, text: string) => {
    const ok = await copyText(text);
    setCopyState((s) => ({ ...s, [id]: ok ? "ok" : "fail" }));
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => {
      setCopyState((s) => {
        const next = { ...s };
        delete next[id];
        return next;
      });
    }, 1800);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const copyLabel = (id: string) => {
    const s = copyState[id];
    if (s === "ok") return t("hack.copied");
    if (s === "fail") return t("hack.copyFail");
    return t("hack.copy");
  };

  // ---- lightbox ----
  const [shot, setShot] = useState<"before" | "after" | null>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const openShot = (which: "before" | "after", el: HTMLElement) => {
    lastFocus.current = el;
    setShot(which);
  };

  const closeShot = useCallback(() => {
    setShot(null);
    lastFocus.current?.focus();
    lastFocus.current = null;
  }, []);

  useEffect(() => {
    if (!shot) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeShot();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [shot, closeShot]);

  const shotSrc =
    shot === "before"
      ? "/vibe-code/hack2026-before.jpg"
      : "/vibe-code/hack2026-after.jpg";
  const shotAlt = shot === "before" ? t("hack.ba.beforeAlt") : t("hack.ba.afterAlt");
  const shotLabel =
    shot === "before" ? t("hack.ba.beforeLabel") : t("hack.ba.afterLabel");

  return (
    <div
      className={`hack-sheet flex-1 ${bricolage.variable} ${publicSans.variable} ${jetbrainsMono.variable}`}
      data-locale={locale}
    >
      <div className="sheet">
        <div className="presents">
          <span className="mark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/vibe-code/indigitous-mark.png" alt="Indigitous" />
          </span>
          <p className="for">
            <span>{t("hack.builtFor")}</span>Indigitous Singapore #HACK 2026
          </p>
        </div>

        <header className="masthead">
          <div>
            <p className="eyebrow">{t("hack.eyebrow")}</p>
            <h1>
              {t("hack.title1")}
              <br />
              {r("hack.title2")}
            </h1>
          </div>
          <p className="standfirst">{r("hack.standfirst")}</p>
          <a className="jump" href="#pre-work">
            {t("hack.jump")} <span className="arr">&darr;</span>
          </a>
        </header>

        <div className="timeline" aria-hidden="true">
          <svg viewBox="0 0 1200 86" preserveAspectRatio="none" role="presentation">
            <defs>
              <linearGradient id="hack-tl" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#7C6BF5" />
                <stop offset="100%" stopColor="#4FD3C4" />
              </linearGradient>
            </defs>
            <rect x="20" y="40" width="1160" height="7" rx="3.5" fill="url(#hack-tl)" opacity=".30" />
            <rect x="20" y="40" width="1160" height="7" rx="3.5" fill="none" stroke="url(#hack-tl)" strokeWidth="1" />
            <g
              style={{ fontFamily: "var(--font-mono)" }}
              fontSize="13"
              fontWeight="700"
              fill="#E9ECF7"
              textAnchor="middle"
            >
              {[60, 245, 430, 615, 800, 985, 1140].map((x, i) => (
                <text key={x} x={x} y="30">
                  {String(i + 1).padStart(2, "0")}
                </text>
              ))}
            </g>
            <g fill="#4FD3C4">
              {[60, 245, 430, 615, 800, 985, 1140].map((x) => (
                <circle key={x} cx={x} cy="43.5" r="5" />
              ))}
            </g>
            <g
              style={{ fontFamily: "var(--font-mono)" }}
              fontSize="11"
              fill="#96A0C0"
              textAnchor="middle"
            >
              <text x="60" y="70">{t("hack.tl.brief")}</text>
              <text x="245" y="70">{t("hack.tl.build")}</text>
              <text x="430" y="70">{t("hack.tl.run")}</text>
              <text x="615" y="70">supabase</text>
              <text x="800" y="70">github</text>
              <text x="985" y="70">vercel</text>
              <text x="1140" y="70">{t("hack.tl.share")}</text>
            </g>
          </svg>
        </div>

        {/* ============ TODAY'S BUILD ============ */}
        <section>
          <div className="band"><h2>{t("hack.build.band")}</h2></div>

          <div className="grid-2" style={{ marginBottom: 20, alignItems: "start" }}>
            <div className="card">
              <h3>{t("hack.build.whatTitle")}</h3>
              <p className="note" style={{ margin: "0 0 10px" }}>{r("hack.build.what1")}</p>
              <p className="note">{r("hack.build.what2")}</p>
              <p className="note" style={{ marginTop: 9 }}>{r("hack.build.what3")}</p>
            </div>
            <div className="card">
              <h3>{t("hack.build.howTitle")}</h3>
              <p className="note" style={{ margin: "0 0 9px" }}>{r("hack.build.how1")}</p>
              <p className="note" style={{ margin: "0 0 9px" }}>{r("hack.build.how2")}</p>
              <p className="note" style={{ margin: 0 }}>{r("hack.build.how3")}</p>
            </div>
          </div>

          <p className="note" style={{ margin: "0 0 12px" }}>{t("hack.promptsEnglish")}</p>

          <div className="prompt-box">
            <div className="prompt-head">
              <span>{t("hack.p1.label")}</span>
              <button
                type="button"
                className={`copy-btn${copyState.p1 === "ok" ? " ok" : ""}`}
                onClick={() => handleCopy("p1", PROMPT_BUILD)}
              >
                {copyLabel("p1")}
              </button>
            </div>
            <pre className="prompt" id="p1" lang="en">{PROMPT_BUILD}</pre>
          </div>
          <p className="note" style={{ margin: "-4px 0 14px" }}>{r("hack.p1.note")}</p>

          <div className="prompt-box">
            <div className="prompt-head">
              <span>{t("hack.p2.label")}</span>
              <button
                type="button"
                className={`copy-btn${copyState["p4-ship"] === "ok" ? " ok" : ""}`}
                onClick={() => handleCopy("p4-ship", PROMPT_SHIP)}
              >
                {copyLabel("p4-ship")}
              </button>
            </div>
            <p className="note" style={{ margin: 0, padding: "11px 13px 0", borderTop: 0 }}>
              {r("hack.p2.note")}
            </p>
            <pre className="prompt" id="p4-ship" lang="en">{PROMPT_SHIP}</pre>
          </div>
        </section>

        {/* ============ RUN SHEET ============ */}
        <section>
          <div className="band"><h2>{t("hack.run.band")}</h2></div>
          <div className="wrap">
            <table className="run">
              <colgroup>
                <col className="t" />
                <col className="s" />
                <col />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">{t("hack.run.colStep")}</th>
                  <th scope="col">{t("hack.run.colDo")}</th>
                  <th scope="col">{t("hack.run.colWatch")}</th>
                </tr>
              </thead>
              <tbody>
                {STEPS.map((n) => (
                  <tr key={n}>
                    <td>
                      <span className="clock">
                        {t("hack.run.step", { n: String(n).padStart(2, "0") })}
                      </span>
                    </td>
                    <td>
                      <span className="seg">{t(`hack.run.s${n}.title`)}</span>
                    </td>
                    <td>
                      <span className="note">
                        {r(`hack.run.s${n}.body`)}
                        <span className="check">▸ {r(`hack.run.s${n}.check`)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ============ KEY CONCEPTS ============ */}
        <section>
          <div className="band"><h2>{t("hack.concepts.band")}</h2></div>
          <p className="note" style={{ margin: "-6px 0 20px" }}>{r("hack.concepts.intro")}</p>

          <div className="concepts">
            {CONCEPTS.map((c) => (
              <div className="concept" data-n={c.n} key={c.id}>
                <h3>{c.name}</h3>
                <p className="role">{t(`hack.concepts.${c.id}.role`)}</p>
                <p>{t(`hack.concepts.${c.id}.body`)}</p>
                <span className="yours">
                  <b>{t("hack.concepts.yourPart")}</b>
                  {r(`hack.concepts.${c.id}.yours`)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ============ PARTICIPANT SHEET ============ */}
        <section className="participant">
          <div className="band"><h2>{t("hack.cheat.band")}</h2></div>

          <div className="card" style={{ marginBottom: 22 }}>
            <h3>{t("hack.pre.title")}</h3>
            <p className="note" style={{ margin: "0 0 10px" }}>{t("hack.pre.lead")}</p>
            <ul className="checklist">
              {PRE_ITEMS.map((n) => (
                <li key={n}>{r(`hack.pre.${n}`)}</li>
              ))}
            </ul>
          </div>

          <div className="grid-2">
            <div className="card">
              <h3>{t("hack.keys.title")}</h3>
              <ul>
                {KEY_ITEMS.map((n) => (
                  <li key={n}>{r(`hack.keys.${n}`)}</li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>{t("hack.vercel.title")}</h3>
              <p className="note" style={{ margin: "0 0 9px" }}>{t("hack.vercel.lead")}</p>
              <ul>
                {VERCEL_ITEMS.map((n) => (
                  <li key={n}>{r(`hack.vercel.${n}`)}</li>
                ))}
              </ul>
              <div className="url-slot">
                <p>{t("hack.vercel.liveUrl")}</p>
                <div className="url-line" />
              </div>
            </div>
          </div>

          <div className="bonus">
            <div className="bonus-head">
              <h3>{t("hack.bonus.title")}</h3>
              <span>{t("hack.bonus.lead")}</span>
            </div>
            <div className="grid-3">
              {SKILLS.map((s) => (
                <div className="skill-card" key={s.name}>
                  <h4>{s.name}</h4>
                  <p className="host">{s.host}</p>
                  <p>{r(s.key)}</p>
                  <span className="skill-label">{t("hack.skill.install")}</span>
                  <span className="skill-cmd">{s.install}</span>
                  <span className="skill-label">{t("hack.skill.run")}</span>
                  <span className="skill-cmd">{s.run}</span>
                </div>
              ))}
            </div>
            <p className="note" style={{ marginTop: 12 }}>{r("hack.bonus.oneAtATime")}</p>

            <p className="note" style={{ marginTop: 14 }}>
              <b>{t("hack.bonus.seeLive")}</b>{" "}
              <ExtLink href="https://hack2026-prayerwall.vercel.app/">
                hack2026-prayerwall.vercel.app
              </ExtLink>{" "}
              {t("hack.bonus.seeLiveTail")}
            </p>

            <div className="ba">
              <figure>
                <figcaption className="cap">
                  <span className="tag">{t("hack.ba.before")}</span>
                  <span className="sub">{t("hack.ba.beforeSub")}</span>
                </figcaption>
                <button
                  type="button"
                  className="shot-btn"
                  onClick={(e) => openShot("before", e.currentTarget)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/vibe-code/hack2026-before.jpg" alt={t("hack.ba.beforeAlt")} />
                </button>
              </figure>
              <figure>
                <figcaption className="cap">
                  <span className="tag on">{t("hack.ba.after")}</span>
                  <span className="sub">{t("hack.ba.afterSub")}</span>
                </figcaption>
                <button
                  type="button"
                  className="shot-btn"
                  onClick={(e) => openShot("after", e.currentTarget)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/vibe-code/hack2026-after.jpg" alt={t("hack.ba.afterAlt")} />
                </button>
              </figure>
            </div>
            <p className="note" style={{ marginTop: 11 }}>{t("hack.ba.clickHint")}</p>
          </div>

          <div className="warn" style={{ marginTop: 22 }}>
            <h3>{t("hack.warn.title")}</h3>
            <p>{r("hack.warn.p1")}</p>
            <p>{r("hack.warn.p2")}</p>
            <p>{r("hack.warn.p3")}</p>
          </div>
        </section>

        <section className="appendix" id="pre-work">
          <div className="band"><h2>{t("hack.app.band")}</h2></div>
          <p className="note" style={{ margin: "-6px 0 20px" }}>{r("hack.app.intro")}</p>

          <div className="links">
            <div className="link-card">
              <h3>{t("hack.app.install.title")}</h3>
              <p className="role">{t("hack.app.install.role")}</p>
              <Lnk
                what={t("hack.app.node.what")}
                href="https://nodejs.org/en/download"
                linkLabel="nodejs.org/en/download"
                hint={r("hack.app.node.hint")}
              />
              <Lnk
                what={t("hack.app.claude.what")}
                href="https://claude.com/download"
                linkLabel="claude.com/download"
                hint={r("hack.app.claude.hint")}
              />
              <Lnk
                what={t("hack.app.cursor.what")}
                href="https://cursor.com"
                linkLabel="cursor.com"
                hint={r("hack.app.cursor.hint")}
              />
              <Lnk
                solid
                what={t("hack.app.either.what")}
                hint={t("hack.app.either.hint")}
              />
            </div>

            <div className="link-card">
              <h3>GitHub</h3>
              <p className="role">{t("hack.app.github.role")}</p>
              <Lnk
                what={t("hack.app.github.create.what")}
                href="https://github.com/signup"
                linkLabel="github.com/signup"
                hint={r("hack.app.github.create.hint")}
              />
              <Lnk
                what={t("hack.app.github.login.what")}
                href="https://github.com/login"
                linkLabel="github.com/login"
                hint={t("hack.app.github.login.hint")}
              />
            </div>

            <div className="link-card">
              <h3>Vercel</h3>
              <p className="role">{t("hack.app.vercel.role")}</p>
              <Lnk
                what={t("hack.app.vercel.signup.what")}
                href="https://vercel.com/signup"
                linkLabel="vercel.com/signup"
                hint={r("hack.app.vercel.signup.hint")}
              />
            </div>

            <div className="link-card">
              <h3>Supabase</h3>
              <p className="role">{t("hack.app.supabase.role")}</p>
              <Lnk
                what={t("hack.app.supabase.signup.what")}
                href="https://supabase.com/dashboard/sign-up"
                linkLabel="supabase.com/dashboard/sign-up"
                hint={t("hack.app.supabase.signup.hint")}
              />
              <Lnk
                what={t("hack.app.supabase.project.what")}
                href="https://supabase.com/dashboard/new"
                linkLabel="supabase.com/dashboard/new"
                hint={r("hack.app.supabase.project.hint")}
              />
              <Lnk
                what={t("hack.app.supabase.keys.what")}
                href="https://supabase.com/dashboard/project/_/settings/api"
                linkLabel="Project Settings → API"
                hint={r("hack.app.supabase.keys.hint")}
              />
              <Lnk
                what={t("hack.app.supabase.email.what")}
                href="https://supabase.com/dashboard/project/_/auth/providers"
                linkLabel="Authentication → Sign In / Providers → Email"
                hint={r("hack.app.supabase.email.hint")}
              />
            </div>
          </div>
        </section>

        <footer>
          <span>Indigitous Singapore #HACK 2026 · {t("hack.footer.handout")}</span>
          <span className="brand">koina.space</span>
        </footer>
      </div>

      {shot ? (
        <div
          className="lightbox open"
          role="dialog"
          aria-modal="true"
          aria-label={t("hack.lb.label")}
          onClick={closeShot}
        >
          <button
            type="button"
            className="close"
            ref={closeRef}
            aria-label={t("hack.lb.close")}
            onClick={closeShot}
          >
            &times;
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shotSrc} alt={shotAlt} />
          <figcaption>{shotLabel}</figcaption>
        </div>
      ) : null}
    </div>
  );
}
