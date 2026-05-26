"use client";

import { formatEuro, formatEuroOptional } from "@/lib/format";
import {
  isItemComplete,
  lineTotalCents,
  missingItemFields,
} from "@/lib/quote-items";
import type { QuoteLineItem } from "@/lib/types";

type EditableQuoteItemsProps = {
  items: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
};

type EditField = "description" | "quantity" | "unit" | "unitPriceCents";

export function EditableQuoteItems({ items, onChange }: EditableQuoteItemsProps) {
  const updateItem = (index: number, patch: Partial<QuoteLineItem>) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    onChange(next);
  };

  const startEdit = (
    index: number,
    field: EditField,
    current: string | number | null,
  ) => {
    const label =
      field === "description"
        ? "Beschreibung"
        : field === "quantity"
          ? "Menge (leer lassen = fehlt)"
          : field === "unit"
            ? "Einheit (z. B. m², Stk, h — leer = fehlt)"
            : "Einzelpreis in Cent (leer = fehlt)";

    const raw = window.prompt(label, current == null ? "" : String(current));
    if (raw == null) return;

    if (field === "description") {
      if (raw.trim() === "") return;
      updateItem(index, { description: raw.trim() });
      return;
    }

    if (field === "unit") {
      updateItem(index, { unit: raw.trim() === "" ? null : raw.trim() });
      return;
    }

    if (raw.trim() === "") {
      if (field === "quantity") updateItem(index, { quantity: null });
      else updateItem(index, { unitPriceCents: null });
      return;
    }

    const num = Number(raw.replace(",", "."));
    if (Number.isNaN(num) || num < 0) return;

    if (field === "quantity") {
      updateItem(index, { quantity: num });
    } else {
      updateItem(index, { unitPriceCents: Math.round(num) });
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Noch keine Positionen. Sprich unten eine Änderung ein.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => {
        const complete = isItemComplete(item);
        const total = lineTotalCents(item);
        const missing = missingItemFields(item);

        return (
          <li
            key={index}
            className={`card text-sm ${
              complete
                ? ""
                : "border-amber-300 bg-amber-50/60 ring-1 ring-amber-200"
            }`}
          >
            {!complete && (
              <p className="mb-2 text-xs font-medium text-amber-800">
                Bitte ergänzen: {missing.join(", ")}
              </p>
            )}

            <button
              type="button"
              className="w-full text-left font-medium text-[var(--foreground)]"
              onClick={() => startEdit(index, "description", item.description)}
            >
              {item.description}
            </button>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[var(--muted)]">
              <button
                type="button"
                className={`rounded-lg px-2 py-1 font-mono tabular-nums ${
                  item.quantity == null || !item.unit
                    ? "bg-amber-100 text-amber-900"
                    : "bg-zinc-100"
                }`}
                onClick={() => startEdit(index, "quantity", item.quantity)}
              >
                {item.quantity != null ? item.quantity : "Menge?"}
              </button>
              <button
                type="button"
                className={`rounded-lg px-2 py-1 ${
                  item.unit ? "bg-zinc-100" : "bg-amber-100 text-amber-900"
                }`}
                onClick={() => startEdit(index, "unit", item.unit)}
              >
                {item.unit ?? "Einheit?"}
              </button>
              <span>×</span>
              <button
                type="button"
                className={`rounded-lg px-2 py-1 font-mono tabular-nums ${
                  item.unitPriceCents == null
                    ? "bg-amber-100 font-semibold text-amber-900"
                    : "bg-zinc-100"
                }`}
                onClick={() =>
                  startEdit(index, "unitPriceCents", item.unitPriceCents)
                }
              >
                {item.unitPriceCents == null
                  ? "Preis fehlt"
                  : formatEuro(item.unitPriceCents)}
              </button>
              <span className="ml-auto font-semibold text-[var(--primary)]">
                {formatEuroOptional(total)}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--muted)]">
              Tippen zum Bearbeiten
            </p>
          </li>
        );
      })}
    </ul>
  );
}
