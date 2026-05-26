"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Loader2, Save } from "lucide-react";
import { useCallback, useState } from "react";
import { EditableQuoteItems } from "@/components/quotes/EditableQuoteItems";
import { PdfViewerModal } from "@/components/quotes/PdfViewerModal";
import { QuoteTotals } from "@/components/quotes/QuoteTotals";
import { VoiceHoldButton } from "@/components/quotes/VoiceHoldButton";
import { calculateTotalCents, hasIncompleteItems } from "@/lib/quote-items";
import type { QuoteLineItem, QuoteWithCustomer } from "@/lib/types";

type QuoteEditorProps = {
  initialQuote: QuoteWithCustomer;
};

export function QuoteEditor({ initialQuote }: QuoteEditorProps) {
  const [items, setItems] = useState<QuoteLineItem[]>(initialQuote.items);
  const [totalCents, setTotalCents] = useState(initialQuote.total_cents);
  const [saving, setSaving] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  const saveItems = useCallback(
    async (nextItems: QuoteLineItem[]) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/quotes/${initialQuote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: nextItems }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(
            (err as { error?: string }).error ?? "Speichern fehlgeschlagen",
          );
        }
        const data = (await res.json()) as { totalCents: number };
        setTotalCents(data.totalCents);
        setMessage("Gespeichert");
        setTimeout(() => setMessage(null), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler");
      } finally {
        setSaving(false);
      }
    },
    [initialQuote.id],
  );

  const handleItemsChange = (next: QuoteLineItem[]) => {
    setItems(next);
    setTotalCents(calculateTotalCents(next));
  };

  const incomplete = hasIncompleteItems(items);

  const handleVoiceEdit = async (audio: Blob) => {
    setVoiceBusy(true);
    setError(null);
    setMessage("Sprache wird verarbeitet…");
    try {
      const form = new FormData();
      form.append("audio", audio, "edit.webm");
      form.append("items", JSON.stringify(items));

      const res = await fetch(`/api/quotes/${initialQuote.id}/voice-edit`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          (err as { error?: string }).error ?? "Sprachbearbeitung fehlgeschlagen",
        );
      }

      const data = (await res.json()) as {
        items: QuoteLineItem[];
        totalCents: number;
      };
      setItems(data.items);
      setTotalCents(data.totalCents);
      setMessage("Per Sprache aktualisiert");
      setTimeout(() => setMessage(null), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setVoiceBusy(false);
    }
  };

  return (
    <div className="pb-32">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--muted)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      <div className="card">
        <p className="text-sm text-[var(--muted)]">{initialQuote.quote_number}</p>
        <p className="font-semibold">{initialQuote.customer.name}</p>
        <p className="text-sm text-[var(--muted)]">{initialQuote.customer.address}</p>
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <QuoteTotals netCents={totalCents} />
        </div>
        {incomplete && (
          <p className="mt-1 text-xs text-amber-800">
            Summe nur aus vollständigen Positionen — gelb markierte Felder fehlen
            noch.
          </p>
        )}
      </div>

      {incomplete && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Einige Positionen haben keine Menge, Einheit oder Preis. Bitte ergänzen,
          bevor du das Angebot verschickst.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setShowPdf(true)}
          className="btn-secondary flex flex-1 items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          PDF anzeigen
        </button>
        <button
          type="button"
          onClick={() => void saveItems(items)}
          disabled={saving}
          className="btn-primary flex flex-1 items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Speichern
        </button>
      </div>

      {message && (
        <p className="mt-2 text-center text-sm text-emerald-700">{message}</p>
      )}
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
        Positionen
      </h2>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Felder direkt antippen und ändern, danach oben auf „Speichern“ tippen.
        Einzelpreise sind netto.
      </p>
      <EditableQuoteItems items={items} onChange={handleItemsChange} />

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Unten rechts: Mikrofon gedrückt halten · nach oben wischen zum Sperren
      </p>

      <VoiceHoldButton
        onAudioReady={(blob) => void handleVoiceEdit(blob)}
        disabled={voiceBusy || saving}
      />

      <PdfViewerModal
        quoteId={initialQuote.id}
        quoteNumber={initialQuote.quote_number}
        open={showPdf}
        onClose={() => setShowPdf(false)}
      />
    </div>
  );
}
