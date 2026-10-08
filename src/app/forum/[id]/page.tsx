import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ForumLiveStatus } from "@/components/forum/ForumLiveStatus";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { getCurrentProfile } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = createServiceClient();
  const { data } = service
    ? await service
        .from("forum_sessions")
        .select("title")
        .eq("id", id)
        .maybeSingle()
    : { data: null };
  return {
    title: data?.title ? `${data.title} | Forum | KOINA` : "Forum | KOINA",
  };
}

export default async function ForumSessionPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const isAdmin = isAdminProfile(profile);
  const service = createServiceClient();
  if (!service) notFound();

  const { data: session } = await service
    .from("forum_sessions")
    .select(
      "id, slug, title, description, is_live, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!session) notFound();

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[720px] px-6">
        <p className="mb-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-semibold tracking-[0.14em] text-accent-600 uppercase">
          Forum session
        </p>
        <h1 className="mb-2 text-3xl">{session.title}</h1>
        {session.description ? (
          <p className="mb-6 text-ink-70">{session.description}</p>
        ) : (
          <p className="mb-6 text-ink-70">
            Join as a viewer to follow the presenter and take part in
            activities.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button href={`/forum/${session.id}/view`}>Join as viewer</Button>
          {isAdmin ? (
            <Button href={`/forum/${session.id}/present`} variant="dark">
              Present
            </Button>
          ) : null}
          <Button href="/forum" variant="outline">
            All sessions
          </Button>
        </div>

        <ul className="mt-10 space-y-2 text-sm text-ink-70">
          <li>
            <strong className="text-ink">Presenter</strong> controls slides,
            language, and image lightboxes for everyone.
          </li>
          <li>
            <strong className="text-ink">Viewers</strong> stay on the presenter’s
            slide and can answer polls / activities — saved to Supabase.
          </li>
          <li>
            Status:{" "}
            <ForumLiveStatus
              sessionId={session.id}
              initialLive={Boolean(session.is_live)}
            />
          </li>
        </ul>

        {isAdmin ? (
          <p className="mt-8 text-sm">
            Share viewer link:{" "}
            <Link
              href={`/forum/${session.id}/view`}
              className="font-semibold text-accent-600"
            >
              /forum/{session.id}/view
            </Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
