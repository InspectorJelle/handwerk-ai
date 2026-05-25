import { MobileShell } from "@/components/layout/MobileShell";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { getAuthUserEmail } from "@/lib/auth";
import { getUserProfile, isQuotesDataAvailable } from "@/lib/quotes";

export default async function ProfilePage() {
  const profile = await getUserProfile();
  const email = await getAuthUserEmail();
  const supabaseReady = isQuotesDataAvailable();

  return (
    <MobileShell title="Profil" subtitle="Firmendaten & Logo">
      {profile ? (
        <ProfileSettings initialProfile={profile} email={email} />
      ) : (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Profil konnte nicht geladen werden.
        </p>
      )}

      {!supabaseReady && (
        <p className="mt-4 text-sm text-[var(--muted)]">
          Supabase nicht konfiguriert – Dev-Modus aktiv.
        </p>
      )}
    </MobileShell>
  );
}
