import { NextResponse } from "next/server";
import { transcribeAudioBlob } from "@/lib/transcribe-audio";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json(
        { error: "Audiodatei fehlt (Feld: audio)" },
        { status: 400 },
      );
    }

    const transcript = await transcribeAudioBlob(audio);
    return NextResponse.json({ transcript });
  } catch (e) {
    console.error("transcribe:", e);
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Transkription fehlgeschlagen",
      },
      { status: 500 },
    );
  }
}
