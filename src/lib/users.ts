import { getCurrentUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

import type { UserProfile } from "@/lib/types";

export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.company_name.trim().length > 0 &&
    profile.owner_name.trim().length > 0
  );
}

/** Legt Handwerker-Profil an, falls Auth-User existiert aber public.users fehlt (häufig ohne Migration 002). */
export async function ensureUserProfile(
  userId: string,
  companyName = "",
): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return true;

  const { error } = await supabase.from("users").insert({
    id: userId,
    company_name: companyName,
  });

  if (error) {
    console.error("ensureUserProfile:", error.message);
    return false;
  }
  return true;
}

export async function ensureCurrentUserProfile(
  companyName = "",
): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const ok = await ensureUserProfile(userId, companyName);
  return ok ? userId : null;
}
