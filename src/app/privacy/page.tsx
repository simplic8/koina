import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — KOINA",
  description: "How KOINA handles account and usage information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-16">
      <p className="mb-3 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
        Legal
      </p>
      <h1 className="mb-3 text-[clamp(28px,4vw,40px)] leading-[1.1]">
        Privacy Policy
      </h1>
      <p className="mb-10 text-sm text-ink-40">Last updated: August 12, 2026</p>

      <div className="space-y-8 text-[15px] leading-7 text-ink-70">
        <section>
          <h2 className="mb-2 text-lg text-ink">1. Overview</h2>
          <p>
            This policy explains what information KOINA collects when you use
            the site, and how we use it. We aim to collect only what we need to
            run the commons.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">2. Information we collect</h2>
          <p>Depending on how you use KOINA, we may process:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-ink">Account data</strong> — email,
              username, display name, avatar, and sign-in provider details
              (e.g. Google) when you register or link an account.
            </li>
            <li>
              <strong className="text-ink">Profile data</strong> — information
              you choose to add to your profile.
            </li>
            <li>
              <strong className="text-ink">Usage data</strong> — basic technical
              logs needed to operate and secure the service (such as when you
              sign in).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">3. How we use it</h2>
          <p>We use this information to:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Create and manage your account</li>
            <li>Provide authentication, profile, and inbox features</li>
            <li>Keep the service secure and reliable</li>
            <li>Communicate about your account when needed (e.g. confirmation emails)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">4. Service providers</h2>
          <p>
            We use trusted providers to host and run KOINA, including{" "}
            <strong className="text-ink">Supabase</strong> (database and auth)
            and, when configured, email and OAuth providers such as{" "}
            <strong className="text-ink">Google</strong>. Those providers process
            data under their own terms and privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">5. Cookies & sessions</h2>
          <p>
            We use cookies or similar storage for sign-in sessions and site
            preferences (such as theme or language). These are needed for the
            site to work as expected.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">6. Sharing</h2>
          <p>
            We do not sell your personal information. We may share data with
            service providers who help operate KOINA, or when required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">7. Retention</h2>
          <p>
            We keep account data while your account is active. You may request
            deletion of your account by contacting us; we will remove or
            anonymize data where reasonably possible, except where we must
            retain it for legal or security reasons.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">8. Changes</h2>
          <p>
            We may update this policy from time to time. The date at the top
            reflects the latest revision.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg text-ink">9. Contact</h2>
          <p>
            For privacy questions or account deletion requests, contact us
            through the channels listed on the site or your community
            organizers.
          </p>
        </section>
      </div>

      <p className="mt-12 text-sm text-ink-40">
        See also our{" "}
        <Link href="/terms" className="text-accent-600 no-underline hover:underline">
          Terms of Use
        </Link>
        .
      </p>
    </div>
  );
}
