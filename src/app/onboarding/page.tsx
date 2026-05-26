import { redirect } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { getCurrentUserId } from "@/lib/auth";
import { getUserProfile } from "@/lib/quotes";
import { ensureUserProfile, isProfileComplete } from "@/lib/users";

export default async function OnboardingPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    redirect("/login");
  }

  await ensureUserProfile(userId);
  const profile = await getUserProfile();

  if (isProfileComplete(profile)) {
    redirect("/dashboard");
  }

  return (
    <MobileShell title="Einrichtung" subtitle="Schritt 1 von 1" hideNav>
      <OnboardingWizard initialProfile={profile} />
    </MobileShell>
  );
}
