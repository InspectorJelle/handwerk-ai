import { NextResponse } from "next/server";
import { z } from "zod";
import {
  calculateTotalCents,
  deleteQuote,
  getQuoteWithCustomer,
  updateQuoteItems,
  updateQuoteStatus,
} from "@/lib/quotes";
import { quoteLineItemSchema } from "@/lib/quote-items";

const patchSchema = z
  .object({
    items: z.array(quoteLineItemSchema).optional(),
    status: z.enum(["draft", "sent"]).optional(),
  })
  .refine((data) => data.items != null || data.status != null, {
    message: "items oder status erforderlich",
  });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const quote = await getQuoteWithCustomer(id);

  if (!quote) {
    return NextResponse.json({ error: "Angebot nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ quote });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const json = await request.json();
    const parsed = patchSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ungültige Anfrage" },
        { status: 400 },
      );
    }

    if (parsed.data.status) {
      const ok = await updateQuoteStatus(id, parsed.data.status);
      if (!ok) {
        return NextResponse.json(
          { error: "Status konnte nicht gespeichert werden" },
          { status: 500 },
        );
      }
    }

    if (parsed.data.items) {
      const ok = await updateQuoteItems(id, parsed.data.items);
      if (!ok) {
        return NextResponse.json(
          { error: "Speichern fehlgeschlagen" },
          { status: 500 },
        );
      }
      return NextResponse.json({
        items: parsed.data.items,
        totalCents: calculateTotalCents(parsed.data.items),
        status: parsed.data.status,
      });
    }

    return NextResponse.json({ status: parsed.data.status });
  } catch (e) {
    console.error("quotes PATCH:", e);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const ok = await deleteQuote(id);

  if (!ok) {
    return NextResponse.json(
      { error: "Angebot konnte nicht gelöscht werden" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
