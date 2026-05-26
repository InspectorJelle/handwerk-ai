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

function parseEuroInput(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const num = Number(trimmed.replace(",", "."));
  if (Number.isNaN(num) || num < 0) return null;
  return Math.round(num * 100);
}

function euroInputValue(cents: number | null): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function EditableQuoteItems({ items, onChange }: EditableQuoteItemsProps) {
  const updateItem = (index: number, patch: Partial<QuoteLineItem>) => {
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Noch keine Positionen. Sprich unten eine Änderung ein.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
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
              <p className="mb-3 text-xs font-medium text-amber-800">
                Bitte ergänzen: {missing.join(", ")}
              </p>
            )}

            <label className="field">
              <span>Beschreibung</span>
              <input
                value={item.description}
                onChange={(e) =>
                  updateItem(index, { description: e.target.value })
                }
                placeholder="Leistung beschreiben"
              />
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="field">
                <span>Menge</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={item.quantity ?? ""}
                  placeholder="z. B. 12"
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    updateItem(index, {
                      quantity:
                        raw === "" ? null : Number(raw.replace(",", ".")),
                    });
                  }}
                />
              </label>

              <label className="field">
                <span>Einheit</span>
                <input
                  value={item.unit ?? ""}
                  placeholder="m², Stk, h …"
                  onChange={(e) =>
                    updateItem(index, {
                      unit: e.target.value.trim() === "" ? null : e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="field">
                <span>Einzelpreis netto (€)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={euroInputValue(item.unitPriceCents)}
                  placeholder="z. B. 45,00"
                  onChange={(e) =>
                    updateItem(index, {
                      unitPriceCents: parseEuroInput(e.target.value),
                    })
                  }
                />
              </label>

              <div className="field">
                <span>Summe netto</span>
                <p className="flex min-h-[46px] items-center rounded-xl bg-zinc-50 px-3 font-semibold tabular-nums text-[var(--primary)]">
                  {formatEuroOptional(total)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
