import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getUserProfile } from "@/lib/quotes";
import { ensureUserProfile } from "@/lib/users";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const existing = await getUserProfile();
  if (existing) {
    return NextResponse.json({ profile: existing, created: false });
  }

  const ok = await ensureUserProfile(userId);
  if (!ok) {
    return NextResponse.json(
      { error: "Profil konnte nicht angelegt werden" },
      { status: 500 },
    );
  }

  const profile = await getUserProfile();
  return NextResponse.json({ profile, created: true });
}
