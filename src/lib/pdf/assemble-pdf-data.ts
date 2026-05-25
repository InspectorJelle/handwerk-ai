import type { QuoteLineItem } from "@/lib/types";
import type { CustomerRecord } from "@/lib/customers";

export type QuotePdfInput = {
  companyName: string;
  taxId?: string | null;
  logoUrl?: string | null;
  quoteNumber: string;
  customerName: string;
  customerAddress: string;
  createdAt: string;
  items: QuoteLineItem[];
  totalCents: number;
};

export function assemblePdfData(params: {
  customer: CustomerRecord;
  items: QuoteLineItem[];
  companyName: string;
  taxId?: string | null;
  logoUrl?: string | null;
  quoteNumber: string;
  createdAt?: string;
}): QuotePdfInput {
  const totalCents = params.items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.unitPriceCents),
    0,
  );

  return {
    companyName: params.companyName,
    taxId: params.taxId,
    logoUrl: params.logoUrl,
    quoteNumber: params.quoteNumber,
    customerName: params.customer.name,
    customerAddress: params.customer.address,
    createdAt: params.createdAt ?? new Date().toISOString(),
    items: params.items,
    totalCents,
  };
}
