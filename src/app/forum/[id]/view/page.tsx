import { notFound } from "next/navigation";
import { ForumLive } from "@/components/forum/ForumLive";
import { isAdminProfile } from "@/lib/auth/is-admin";
import { getCurrentProfile } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import type { ForumSession } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export default async function ForumViewPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const service = createServiceClient();
  if (!service) notFound();

  const { data } = await service
    .from("forum_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <ForumLive
      session={data as ForumSession}
      mode="view"
      isAdmin={isAdminProfile(profile)}
    />
  );
}
