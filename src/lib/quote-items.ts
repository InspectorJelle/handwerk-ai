import { z } from "zod";
import type { QuoteLineItem } from "@/lib/types";

export const quoteLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().nullable(),
  unit: z.string().min(1).nullable(),
  unitPriceCents: z.number().int().nonnegative().nullable(),
  laborHours: z.number().optional(),
});

type RawQuoteItem = {
  description?: string;
  quantity?: number | null;
  unit?: string | null;
  unitPriceCents?: number | null;
  laborHours?: number;
};

export function isItemComplete(item: QuoteLineItem): boolean {
  return (
    item.quantity != null &&
    item.quantity > 0 &&
    item.unit != null &&
    item.unit.trim() !== "" &&
    item.unitPriceCents != null
  );
}

export function lineTotalCents(item: QuoteLineItem): number | null {
  if (item.quantity == null || item.unitPriceCents == null || item.quantity <= 0) {
    return null;
  }
  return Math.round(item.quantity * item.unitPriceCents);
}

export function calculateTotalCents(items: QuoteLineItem[]): number {
  return items.reduce((sum, item) => sum + (lineTotalCents(item) ?? 0), 0);
}

export function hasIncompleteItems(items: QuoteLineItem[]): boolean {
  return items.some((item) => !isItemComplete(item));
}

export function normalizeQuoteItems(items: RawQuoteItem[]): QuoteLineItem[] {
  return items.map((item) => ({
    description: item.description?.trim() || "Leistung",
    quantity:
      item.quantity == null || Number.isNaN(Number(item.quantity))
        ? null
        : Number(item.quantity),
    unit:
      item.unit == null || String(item.unit).trim() === ""
        ? null
        : String(item.unit).trim(),
    unitPriceCents:
      item.unitPriceCents == null || Number.isNaN(Number(item.unitPriceCents))
        ? null
        : Math.round(Number(item.unitPriceCents)),
    ...(item.laborHours != null ? { laborHours: item.laborHours } : {}),
  }));
}

export function missingItemFields(item: QuoteLineItem): string[] {
  const missing: string[] = [];
  if (item.quantity == null || item.quantity <= 0) missing.push("Menge");
  if (item.unit == null || item.unit.trim() === "") missing.push("Einheit");
  if (item.unitPriceCents == null) missing.push("Preis");
  return missing;
}
