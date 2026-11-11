import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { T } from "@/components/i18n/T";
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
          <T k="forum.sessionEyebrow" />
        </p>
        <h1 className="mb-2 text-3xl">{session.title}</h1>
        {session.description ? (
          <p className="mb-6 text-ink-70">{session.description}</p>
        ) : (
          <p className="mb-6 text-ink-70">
            <T k="forum.sessionLead" />
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button href={`/forum/${session.id}/view`}>
            <T k="forum.joinViewer" />
          </Button>
          <Button href={`/forum/${session.id}/browse`} variant="outline">
            <T k="forum.browseOnly" />
          </Button>
          {isAdmin ? (
            <Button href={`/forum/${session.id}/present`} variant="dark">
              <T k="forum.present" />
            </Button>
          ) : null}
          <Button href="/forum" variant="outline">
            <T k="forum.allSessions" />
          </Button>
        </div>

        <ul className="mt-10 space-y-2 text-sm text-ink-70">
          <li>
            <strong className="text-ink">
              <T k="forum.presenterLabel" />
            </strong>{" "}
            <T k="forum.presenterHelp" />
          </li>
          <li>
            <strong className="text-ink">
              <T k="forum.viewersLabel" />
            </strong>{" "}
            <T k="forum.viewersHelp" />
          </li>
          <li>
            <strong className="text-ink">
              <T k="forum.browseLabel" />
            </strong>{" "}
            <T k="forum.browseHelp" />
          </li>
          <li>
            <T k="forum.status" />{" "}
            <ForumLiveStatus
              sessionId={session.id}
              initialLive={Boolean(session.is_live)}
            />
          </li>
        </ul>

        {isAdmin ? (
          <p className="mt-8 text-sm">
            <T k="forum.shareViewer" />{" "}
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
