import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageIntro } from "@/components/i18n/T";
import { InboxClient } from "@/components/inbox/InboxClient";
import { getCurrentProfile } from "@/lib/data";

export const metadata: Metadata = {
  title: "Inbox | KOINA",
  description: "Friend requests and messages.",
};

export default async function InboxPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?next=/inbox");
  }

  return (
    <div className="py-10">
      <div className="mx-auto max-w-[980px] px-6">
        <PageIntro titleKey="inbox.pageTitle" leadKey="inbox.pageLead" />
        <Suspense fallback={<p className="text-sm text-ink-70">Loading…</p>}>
          <InboxClient viewerId={profile.id} />
        </Suspense>
      </div>
    </div>
  );
}
