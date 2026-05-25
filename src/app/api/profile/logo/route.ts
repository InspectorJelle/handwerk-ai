import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { updateUserProfile } from "@/lib/quotes";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Logo fehlt" }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Max. 2 MB" }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: "Nur PNG, JPG oder WebP" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Storage nicht verfügbar" }, { status: 500 });
    }

    const ext = file.type.includes("png")
      ? "png"
      : file.type.includes("webp")
        ? "webp"
        : "jpg";
    const path = `${userId}/logo.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("logos").getPublicUrl(path);

    const profile = await updateUserProfile({ logo_url: publicUrl });
    if (!profile) {
      return NextResponse.json({ error: "Profil-Update fehlgeschlagen" }, { status: 500 });
    }

    return NextResponse.json({ logo_url: publicUrl, profile });
  } catch (e) {
    console.error("logo upload:", e);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
