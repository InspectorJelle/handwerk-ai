import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getUserProfile } from "@/lib/quotes";
import { isProfileComplete, syncProfileCompleteMetadata } from "@/lib/users";

/** Setzt profile_complete in Auth-Metadaten, wenn DB-Profil schon vollständig ist. */
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const profile = await getUserProfile();
  const complete = isProfileComplete(profile);

  if (complete) {
    await syncProfileCompleteMetadata(userId, true);
  }

  return NextResponse.json({ complete, profile });
}
