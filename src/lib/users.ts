import { getCurrentUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { UserProfile } from "@/lib/types";

const PROFILE_SELECT =
  "id, company_name, owner_name, company_address, company_phone, logo_url, tax_id";

const PROFILE_SELECT_LEGACY = "id, company_name, logo_url, tax_id";

function withLegacyProfileDefaults(
  row: {
    id: string;
    company_name: string;
    logo_url: string | null;
    tax_id: string | null;
  },
): UserProfile {
  return {
    ...row,
    owner_name: "",
    company_address: "",
    company_phone: null,
  };
}

/** Profil über Session-Client (gleiche Sicht wie Middleware / RLS). */
export async function getSessionUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (!error && data) return data;

  const { data: legacy, error: legacyError } = await supabase
    .from("users")
    .select(PROFILE_SELECT_LEGACY)
    .eq("id", user.id)
    .maybeSingle();

  if (legacyError || !legacy) return null;
  return withLegacyProfileDefaults(legacy);
}

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
