"use client";

import { formatEuro } from "@/lib/format";
import type { QuoteLineItem } from "@/lib/types";

type EditableQuoteItemsProps = {
  items: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
};

type EditField = "description" | "quantity" | "unitPriceCents";

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
    current: string | number,
  ) => {
    const label =
      field === "description"
        ? "Beschreibung"
        : field === "quantity"
          ? "Menge"
          : "Einzelpreis (Cent)";
    const raw = window.prompt(label, String(current));
    if (raw == null || raw.trim() === "") return;

    if (field === "description") {
      updateItem(index, { description: raw.trim() });
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
        const lineTotal = Math.round(item.quantity * item.unitPriceCents);
        return (
          <li key={index} className="card text-sm">
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
                className="rounded-lg bg-zinc-100 px-2 py-1 font-mono tabular-nums"
                onClick={() => startEdit(index, "quantity", item.quantity)}
              >
                {item.quantity} {item.unit}
              </button>
              <span>×</span>
              <button
                type="button"
                className="rounded-lg bg-zinc-100 px-2 py-1 font-mono tabular-nums"
                onClick={() =>
                  startEdit(index, "unitPriceCents", item.unitPriceCents)
                }
              >
                {formatEuro(item.unitPriceCents)}
              </button>
              <span className="ml-auto font-semibold text-[var(--primary)]">
                {formatEuro(lineTotal)}
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
