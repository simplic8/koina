import type { Metadata } from "next";
import { T } from "@/components/i18n/T";
import { ForumUploadForm } from "@/components/forum/ForumUploadForm";
import { ForumSessionList } from "@/components/forum/ForumSessionList";
import { getCurrentProfile } from "@/lib/data";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Forum | KOINA",
  description: "Live workshop decks with presenter sync and shared activities.",
};

export default async function ForumPage() {
  const profile = await getCurrentProfile();
  const isAdmin = isAdminProfile(profile);
  const service = createServiceClient();

  type SessionListRow = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    is_live: boolean;
    is_hidden: boolean;
    created_at: string;
    updated_at: string;
  };

  let sessions: SessionListRow[] = [];
  if (service) {
    let query = service
      .from("forum_sessions")
      .select(
        "id, slug, title, description, is_live, is_hidden, created_at, updated_at",
      )
      .order("created_at", { ascending: false });
    if (!isAdmin) {
      query = query.eq("is_hidden", false);
    }
    const { data } = await query;
    sessions = (data ?? []) as SessionListRow[];
  }

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[900px] px-6">
        <p className="mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
          <T k="forum.eyebrow" />
        </p>
        <h1 className="mb-2 text-3xl">
          <T k="nav.forum" />
        </h1>
        <p className="mb-10 max-w-2xl text-ink-70">
          <T k="forum.lead" />
        </p>

        {isAdmin ? (
          <div className="mb-12">
            <ForumUploadForm />
          </div>
        ) : null}

        <h2 className="mb-4 text-xl font-semibold">
          <T k="sessions.pageTitle" />
        </h2>
        <ForumSessionList sessions={sessions} isAdmin={isAdmin} />
      </div>
    </section>
  );
}
