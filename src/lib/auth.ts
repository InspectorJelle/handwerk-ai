import { getDevUserId } from "@/lib/dev-user";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return getDevUserId();
  }

  const supabase = await createClient();
  if (!supabase) return getDevUserId();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) {
    throw new Error("Nicht angemeldet");
  }
  return id;
}

export async function getAuthUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}
