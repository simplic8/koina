import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use — KOINA",
  description: "Simple terms for using the KOINA commons.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-16">
      <p className="mb-3 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
        Legal
      </p>
      <h1 className="mb-3 text-[clamp(28px,4vw,40px)] leading-[1.1]">
        Terms of Use
      </h1>
      <p className="mb-10 text-sm text-ink-40">Last updated: August 12, 2026</p>

      <div className="space-y-8 text-[15px] leading-7 text-ink-70">
        <section>
          <h2 className="mb-2 text-lg text-ink">1. Welcome</h2>
          <p>
            KOINA (“we”, “us”) provides a shared digital commons and links to
            related spaces in the ecosystem (such as JustVibing and Oshikatsu).
            By using this site, you agree to these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">2. The commons</h2>
          <p>
            KOINA is meant for belonging, exploration, and growth together.
            Use the site and linked spaces respectfully. Do not harass others,
            post illegal content, attempt to break security, or misuse accounts
            or systems.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">3. Accounts</h2>
          <p>
            If you create an account, you are responsible for keeping your
            credentials safe and for activity under your account. You may sign
            in with email or supported providers (such as Google). We may
            suspend accounts that violate these terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">4. Ecosystem sites</h2>
          <p>
            Linked projects in the KOINA ecosystem may have their own terms and
            policies. When you leave KOINA for another site, those rules apply.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">5. No warranty</h2>
          <p>
            The service is provided “as is.” We do not guarantee uninterrupted
            access or that content will always be available. To the fullest
            extent permitted by law, we are not liable for damages arising from
            your use of the site.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">6. Changes</h2>
          <p>
            We may update these terms from time to time. Continued use after
            changes means you accept the updated terms. The date above shows
            the latest revision.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">7. Contact</h2>
          <p>
            Questions about these terms? Reach out through the channels listed
            on the site or your community organizers.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-ink-40">
        See also our{" "}
        <Link href="/privacy" className="text-accent-600 no-underline hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
