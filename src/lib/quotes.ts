import { getCurrentUserId } from "@/lib/auth";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { QuoteLineItem, QuoteStatus, QuoteWithCustomer, UserProfile } from "@/lib/types";

export function isQuotesDataAvailable(): boolean {
  return isSupabaseAdminConfigured();
}

export async function listRecentQuotes(limit = 10): Promise<QuoteWithCustomer[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      quote_number,
      status,
      total_cents,
      items,
      pdf_url,
      created_at,
      customers ( name, address, email, phone )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("listRecentQuotes:", error?.message);
    return [];
  }

  return data.map((row) => {
    const customer = Array.isArray(row.customers)
      ? row.customers[0]
      : row.customers;
    return {
      id: row.id,
      quote_number: row.quote_number,
      status: row.status,
      total_cents: row.total_cents,
      items: (row.items as QuoteLineItem[]) ?? [],
      pdf_url: row.pdf_url,
      created_at: row.created_at,
      customer: {
        name: customer?.name ?? "Unbekannt",
        address: customer?.address ?? "",
        email: customer?.email ?? null,
        phone: customer?.phone ?? null,
      },
    };
  });
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, company_name, owner_name, company_address, company_phone, logo_url, tax_id")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function updateUserProfile(input: {
  company_name?: string;
  owner_name?: string;
  company_address?: string;
  company_phone?: string | null;
  tax_id?: string | null;
  logo_url?: string | null;
}): Promise<UserProfile | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("users")
    .update(input)
    .eq("id", userId)
    .select("id, company_name, owner_name, company_address, company_phone, logo_url, tax_id")
    .single();

  if (error || !data) return null;
  return data;
}

export async function getQuoteById(quoteId: string) {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      customer_id,
      quote_number,
      status,
      total_cents,
      items,
      pdf_url,
      created_at,
      user_id,
      customers ( name, address, email, phone ),
      users ( company_name, tax_id, logo_url )
    `,
    )
    .eq("id", quoteId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getQuoteWithCustomer(
  quoteId: string,
): Promise<QuoteWithCustomer | null> {
  const row = await getQuoteById(quoteId);
  if (!row) return null;

  const customer = Array.isArray(row.customers)
    ? row.customers[0]
    : row.customers;

  return {
    id: row.id,
    quote_number: row.quote_number,
    status: row.status,
    total_cents: row.total_cents,
    items: (row.items as QuoteLineItem[]) ?? [],
    pdf_url: row.pdf_url,
    created_at: row.created_at,
    customer: {
      name: customer?.name ?? "Unbekannt",
      address: customer?.address ?? "",
      email: customer?.email ?? null,
      phone: customer?.phone ?? null,
    },
  };
}

export async function updateQuoteItems(
  quoteId: string,
  items: QuoteLineItem[],
): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const userId = await getCurrentUserId();
  if (!userId) return false;

  const total_cents = calculateTotalCents(items);

  const { error } = await supabase
    .from("quotes")
    .update({
      items,
      total_cents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("user_id", userId);

  if (error) {
    console.error("updateQuoteItems:", error.message);
    return false;
  }
  return true;
}

export async function updateQuotePdfUrl(
  quoteId: string,
  pdfUrl: string,
): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  await supabase
    .from("quotes")
    .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("user_id", userId);
}

export async function deleteQuote(quoteId: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId)
    .eq("user_id", userId);

  if (error) {
    console.error("deleteQuote:", error.message);
    return false;
  }
  return true;
}

export async function updateQuoteStatus(
  quoteId: string,
  status: QuoteStatus,
): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("user_id", userId);

  if (error) {
    console.error("updateQuoteStatus:", error.message);
    return false;
  }
  return true;
}

export function calculateTotalCents(items: QuoteLineItem[]): number {
  return items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
    0,
  );
}
