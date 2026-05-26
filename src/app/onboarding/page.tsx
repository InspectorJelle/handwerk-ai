import Link from "next/link";
import { MobileShell } from "@/components/layout/MobileShell";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile, getSessionUserProfile } from "@/lib/users";

export default async function OnboardingPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <MobileShell title="Einrichtung" subtitle="Schritt 1 von 1" hideNav>
        <OnboardingWizard initialProfile={null} />
      </MobileShell>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <MobileShell title="Einrichtung" hideNav>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Bitte melde dich an, um deinen Betrieb einzurichten.
        </p>
        <Link href="/login" className="btn-primary mt-4 block text-center">
          Zur Anmeldung
        </Link>
      </MobileShell>
    );
  }

  await ensureUserProfile(user.id);
  const profile = await getSessionUserProfile();

  return (
    <MobileShell title="Einrichtung" subtitle="Schritt 1 von 1" hideNav>
      <OnboardingWizard initialProfile={profile} />
    </MobileShell>
  );
}
