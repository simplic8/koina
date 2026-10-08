import type { Metadata } from "next";
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

  const { data: sessions } = service
    ? await service
        .from("forum_sessions")
        .select(
          "id, slug, title, description, is_live, created_at, updated_at",
        )
        .order("created_at", { ascending: false })
    : { data: [] as Array<{
        id: string;
        slug: string;
        title: string;
        description: string | null;
        is_live: boolean;
        created_at: string;
        updated_at: string;
      }> };

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[900px] px-6">
        <p className="mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
          Live rooms
        </p>
        <h1 className="mb-2 text-3xl">Forum</h1>
        <p className="mb-10 max-w-2xl text-ink-70">
          Join a live HTML deck. The presenter drives slides and lightboxes;
          everyone can take part in polls and activities — responses are saved
          to KOINA.
        </p>

        {isAdmin ? (
          <div className="mb-12">
            <ForumUploadForm />
          </div>
        ) : null}

        <h2 className="mb-4 text-xl font-semibold">Sessions</h2>
        <ForumSessionList sessions={sessions ?? []} isAdmin={isAdmin} />
      </div>
    </section>
  );
}
