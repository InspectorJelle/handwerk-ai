import { NextResponse } from "next/server";
import { z } from "zod";
import { extractQuoteItems } from "@/lib/ai/process-quote";
import { getCurrentUserId } from "@/lib/auth";
import { getCustomerById } from "@/lib/customers";
import { calculateTotalCents } from "@/lib/quotes";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  customer_id: z.string().uuid(),
  transcript: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { customer_id, transcript } = parsed.data;
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const customer = await getCustomerById(customer_id);
    if (!customer) {
      return NextResponse.json(
        { error: "Kunde nicht gefunden" },
        { status: 404 },
      );
    }

    const items = await extractQuoteItems(transcript);
    const totalCents = calculateTotalCents(items);

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({
        quoteId: "dev-mock-" + Date.now(),
        customerId: customer_id,
        items,
        totalCents,
        persisted: false,
      });
    }

    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const quoteNumber = `ANG-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;

    const { data: quoteRow, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        user_id: userId,
        customer_id: customer.id,
        quote_number: quoteNumber,
        status: "draft",
        total_cents: totalCents,
        items,
      })
      .select("id")
      .single();

    if (quoteError || !quoteRow) {
      return NextResponse.json(
        {
          error:
            quoteError?.message ?? "Angebot konnte nicht gespeichert werden",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      quoteId: quoteRow.id,
      customerId: customer.id,
      items,
      totalCents,
      persisted: true,
    });
  } catch (e) {
    console.error("process-quote:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verarbeitung fehlgeschlagen" },
      { status: 500 },
    );
  }
}
