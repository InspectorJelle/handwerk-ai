import { MobileShell } from "@/components/layout/MobileShell";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { getAuthUserEmail, getCurrentUserId } from "@/lib/auth";
import { getUserProfile, isQuotesDataAvailable } from "@/lib/quotes";
import { ensureUserProfile } from "@/lib/users";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  let profile = await getUserProfile();

  if (userId && !profile) {
    await ensureUserProfile(userId);
    profile = await getUserProfile();
  }

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
