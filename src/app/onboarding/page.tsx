import { redirect } from "next/navigation";
import { OnboardingContent } from "@/components/onboarding/OnboardingContent";
import { getCurrentProfile } from "@/lib/data";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const name = profile.username?.trim() || "player";

  return <OnboardingContent name={name} />;
}
