import { NextResponse } from "next/server";
import { z } from "zod";
import { applyVoiceEditToItems } from "@/lib/ai/apply-voice-edit";
import { transcribeAudioBlob } from "@/lib/transcribe-audio";
import {
  calculateTotalCents,
  getQuoteWithCustomer,
  updateQuoteItems,
} from "@/lib/quotes";

type RouteContext = { params: Promise<{ id: string }> };

const jsonSchema = z.object({
  transcript: z.string().min(1),
  items: z.array(
    z.object({
      description: z.string(),
      quantity: z.number(),
      unit: z.string(),
      unitPriceCents: z.number(),
      laborHours: z.number().optional(),
    }),
  ),
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const quote = await getQuoteWithCustomer(id);

    if (!quote) {
      return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    let instruction: string;
    let currentItems = quote.items;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audio = formData.get("audio");
      const itemsJson = formData.get("items");

      if (itemsJson && typeof itemsJson === "string") {
        currentItems = JSON.parse(itemsJson) as typeof currentItems;
      }

      if (!audio || !(audio instanceof Blob)) {
        return NextResponse.json({ error: "Audio fehlt" }, { status: 400 });
      }

      instruction = await transcribeAudioBlob(audio);
    } else {
      const json = await request.json();
      const parsed = jsonSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
      }
      instruction = parsed.data.transcript;
      currentItems = parsed.data.items;
    }

    const items = await applyVoiceEditToItems(currentItems, instruction);
    const saved = await updateQuoteItems(id, items);

    if (!saved) {
      return NextResponse.json({
        items,
        totalCents: calculateTotalCents(items),
        persisted: false,
      });
    }

    return NextResponse.json({
      items,
      totalCents: calculateTotalCents(items),
      transcript: instruction,
      persisted: true,
    });
  } catch (e) {
    console.error("voice-edit:", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Sprachbearbeitung fehlgeschlagen",
      },
      { status: 500 },
    );
  }
}
