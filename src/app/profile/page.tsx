import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageIntro } from "@/components/i18n/T";
import { ProfilePageContent } from "@/components/profile/ProfilePageContent";
import { getCurrentProfile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile | KOINA",
  description: "Manage your KOINA username, photo, and account settings.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const params = await searchParams;
  const sectionParam = Array.isArray(params.section)
    ? params.section[0]
    : params.section;

  const supabase = await createClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  const identities = user?.identities ?? [];
  const hasEmailIdentity = identities.some(
    (identity) => identity.provider === "email",
  );
  const hasGoogleIdentity = identities.some(
    (identity) => identity.provider === "google",
  );
  const hasDiscordIdentity = identities.some(
    (identity) => identity.provider === "discord",
  );

  return (
    <div className="py-10">
      <div className="mx-auto max-w-[900px] px-6">
        <PageIntro titleKey="profile.pageTitle" leadKey="profile.pageLead" />
        <ProfilePageContent
          profile={profile}
          email={user?.email ?? null}
          hasEmailIdentity={hasEmailIdentity}
          hasGoogleIdentity={hasGoogleIdentity}
          hasDiscordIdentity={hasDiscordIdentity}
          identityCount={identities.length || 1}
          initialSection={sectionParam}
        />
      </div>
    </div>
  );
}
