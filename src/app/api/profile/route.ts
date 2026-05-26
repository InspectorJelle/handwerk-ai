import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserEmail, getCurrentUserId } from "@/lib/auth";
import { getUserProfile, updateUserProfile } from "@/lib/quotes";
import { isProfileComplete, syncProfileCompleteMetadata } from "@/lib/users";

const patchSchema = z.object({
  company_name: z.string().min(1).optional(),
  owner_name: z.string().min(1).optional(),
  company_address: z.string().optional(),
  company_phone: z.string().optional().nullable(),
  tax_id: z.string().optional().nullable(),
});

export async function GET() {
  const profile = await getUserProfile();
  const email = await getAuthUserEmail();

  if (!profile) {
    return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ profile, email });
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
    }

    const profile = await updateUserProfile(parsed.data);
    if (!profile) {
      return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
    }

    if (isProfileComplete(profile)) {
      const userId = await getCurrentUserId();
      if (userId) {
        await syncProfileCompleteMetadata(userId, true);
      }
    }

    return NextResponse.json({ profile });
  } catch (e) {
    console.error("profile PATCH:", e);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}
