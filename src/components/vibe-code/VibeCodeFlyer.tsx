import { VibeCodeRegisterModal } from "@/components/vibe-code/VibeCodeRegisterModal";

export function VibeCodeFlyer() {
  return (
    <article className="vibe-poster mx-auto w-full max-w-[820px]">
      <div className="vibe-eyebrow">
        From the devs of Arise Asia Digital Platform <span>/</span> Online
        workshop <span>/</span> 4 nights
      </div>

      <h1 className="vibe-title">
        VIBE<em>CODE</em>
      </h1>

      <p className="vibe-tagline">
        Dream it. Build it. Ship it. No coding experience needed.
      </p>

      <div className="vibe-when">
        <div>
          <b>Wednesdays</b> · 4 weeks
        </div>
        <div>
          <b>10–11PM</b> SGT
        </div>
        <div>Zoom</div>
        <div>
          <b>Free</b>
        </div>
      </div>

      <div className="vibe-story">
        <p>
          <strong>
            It started with three developers and a team of people on a mission.
          </strong>
        </p>
        <p>
          The Arise Asia digital platform features modern digital capabilities
          built on a lean budget. Birthed from the ideas of missional leaders
          and the ingenuity of its dev team, the platform was delivered within
          three months. This was viable through the use of AI tools and vibe
          coding.
        </p>
        <p>
          The leaders brought the calling. The developers brought the tools.
          Neither could have built it alone.{" "}
          <strong>
            Now it is your turn to discover it.
          </strong>
        </p>
      </div>

      <p className="vibe-label">Four nights · Four Outcomes</p>
      <ul className="vibe-log">
        <li>
          <span className="vibe-wk">WEEK 1</span>
          <span className="vibe-log-title">
            Dream it, Build it
            <span className="vibe-note">
              Your first idea to code in hour one.
            </span>
          </span>
          <span className="vibe-ship">dream 01</span>
        </li>
        <li>
          <span className="vibe-wk">WEEK 2</span>
          <span className="vibe-log-title">
            Take it to the world
            <span className="vibe-note">
              Your code to the world - beyond localhost.
            </span>
          </span>
          <span className="vibe-ship">world 02</span>
        </li>
        <li>
          <span className="vibe-wk">WEEK 3</span>
          <span className="vibe-log-title">
            Expand your horizons
            <span className="vibe-note">
              Do more with your app - more features and connecting to APIs.
            </span>
          </span>
          <span className="vibe-ship">horizons 03</span>
        </li>
        <li>
          <span className="vibe-wk">WEEK 4</span>
          <span className="vibe-log-title">
            Summing it up
            <span className="vibe-note">
              Connections, opportunities, and showcases.
            </span>
          </span>
          <span className="vibe-ship">all in 04</span>
        </li>
      </ul>

      <div className="vibe-cols">
        <div>
          <p className="vibe-label vibe-label-tight">What you&apos;ll walk away with</p>
          <ul className="vibe-take">
            <li>Your idea, turned into working code</li>
            <li>
              An app with logins, forms, a database and a live email connection
            </li>
            <li>The know-how to put your own work on the internet</li>
            <li>
                A door into a global team building technology for missions
            </li>
          </ul>
        </div>
        <div>
          <p className="vibe-label vibe-label-tight">What you&apos;ll need</p>
          <div className="vibe-need">
            <p>
              A <b>Windows or Mac laptop</b>.
            </p>
            <p>
              <b>20 minutes of setup</b> before week 1. We send a step-by-step
              guide and run a live clinic if you get stuck.
            </p>
            <p>
              <b>One idea</b>
              {" "}
              you haven&apos;t been able to shake.
            </p>
            <p>
              You&apos;ll build with Cursor, Next.js, Supabase, GitHub and Vercel —
              the same stack behind arise.asia. Every tool is free.
            </p>
          </div>
        </div>
      </div>

      <div className="vibe-cta">
        <p className="vibe-cta-line">
          You don&apos;t need to be a developer to start coding. You just need the{" "}
          <span>heart, mind and tools.</span>
        </p>
        <VibeCodeRegisterModal />
      </div>
    </article>
  );
}
