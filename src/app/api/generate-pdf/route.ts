import { NextResponse } from "next/server";
import { z } from "zod";
import { APP_NAME } from "@/lib/brand";
import { extractQuoteItems } from "@/lib/ai/process-quote";
import { getCustomerById } from "@/lib/customers";
import { getCurrentUserId } from "@/lib/auth";
import { assemblePdfData } from "@/lib/pdf/assemble-pdf-data";
import { generateQuotePdf } from "@/lib/pdf/generate-quote-pdf";
import {
  calculateTotalCents,
  getQuoteById,
  getUserProfile,
  updateQuotePdfUrl,
} from "@/lib/quotes";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuoteLineItem } from "@/lib/types";

const bodySchema = z
  .object({
    quoteId: z.string().uuid().optional(),
    customer_id: z.string().uuid().optional(),
    transcript: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      data.quoteId != null ||
      (data.customer_id != null && data.transcript != null),
    {
      message: "quoteId oder (customer_id + transcript) erforderlich",
    },
  );

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ungültige Anfrage" },
        { status: 400 },
      );
    }

    const profile = await getUserProfile();
    const companyName = profile?.company_name ?? APP_NAME;
    const taxId = profile?.tax_id;
    const logoUrl = profile?.logo_url;

    let pdfInput: ReturnType<typeof assemblePdfData>;
    let quoteIdForStorage: string | undefined;

    if (parsed.data.quoteId) {
      // Angebot existiert: Kunde + Posten nur aus Supabase (kein LLM)
      const row = await getQuoteById(parsed.data.quoteId);
      if (!row) {
        return NextResponse.json(
          { error: "Angebot nicht gefunden" },
          { status: 404 },
        );
      }

      const customer = await getCustomerById(row.customer_id);
      if (!customer) {
        return NextResponse.json(
          { error: "Kundendaten nicht gefunden" },
          { status: 404 },
        );
      }

      const items = (row.items as QuoteLineItem[]) ?? [];

      pdfInput = assemblePdfData({
        customer,
        items,
        companyName,
        taxId,
        logoUrl,
        quoteNumber: row.quote_number,
        createdAt: row.created_at,
      });

      quoteIdForStorage = parsed.data.quoteId;
    } else {
      // Flow: 1) Kunde aus Supabase  2) nur Transkript → LLM  3) zusammenführen
      const { customer_id, transcript } = parsed.data;

      const customer = await getCustomerById(customer_id!);
      if (!customer) {
        return NextResponse.json(
          { error: "Kunde nicht gefunden" },
          { status: 404 },
        );
      }

      const items = await extractQuoteItems(transcript!);

      const supabase = createAdminClient();
      let quoteNumber = `ANG-${new Date().getFullYear()}-ENTWURF`;

      if (supabase) {
        const userId = await getCurrentUserId();
        if (!userId) {
          return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
        }
        const { count } = await supabase
          .from("quotes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        quoteNumber = `ANG-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, "0")}`;

        const totalCents = calculateTotalCents(items);
        const { data: quoteRow } = await supabase
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

        quoteIdForStorage = quoteRow?.id;
      }

      pdfInput = assemblePdfData({
        customer,
        items,
        companyName,
        taxId,
        logoUrl,
        quoteNumber,
      });
    }

    const pdfBytes = await generateQuotePdf(pdfInput);

    const supabase = createAdminClient();
    if (supabase && quoteIdForStorage) {
      const path = `quotes/${quoteIdForStorage}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("quote-pdfs")
        .upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("quote-pdfs").getPublicUrl(path);
        await updateQuotePdfUrl(quoteIdForStorage, publicUrl);
      }
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfInput.quoteNumber}.pdf"`,
      },
    });
  } catch (e) {
    console.error("generate-pdf:", e);
    return NextResponse.json(
      { error: "PDF-Erstellung fehlgeschlagen" },
      { status: 500 },
    );
  }
}
