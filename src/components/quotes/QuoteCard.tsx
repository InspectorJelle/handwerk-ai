"use client";

import Link from "next/link";
import { Eye, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DownloadPdfButton } from "@/components/quotes/DownloadPdfButton";
import { PdfViewerModal } from "@/components/quotes/PdfViewerModal";
import { SendQuoteSheet } from "@/components/quotes/SendQuoteSheet";
import { formatDateDE, formatEuro } from "@/lib/format";
import type { QuoteWithCustomer } from "@/lib/types";

type QuoteCardProps = {
  quote: QuoteWithCustomer;
  companyName?: string;
};

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  sent: "Verschickt",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        status === "sent"
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function QuoteCard({ quote, companyName }: QuoteCardProps) {
  const router = useRouter();
  const [showPdf, setShowPdf] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm(
      `Angebot ${quote.quote_number} wirklich löschen?`,
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          (err as { error?: string }).error ?? "Löschen fehlgeschlagen",
        );
      }
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <li className="card">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[var(--foreground)]">
                {quote.customer.name}
              </p>
              <StatusBadge status={quote.status} />
            </div>
            <p className="truncate text-sm text-[var(--muted)]">
              {quote.quote_number}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setShowPdf(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-zinc-100 hover:text-[var(--foreground)]"
              aria-label="PDF anzeigen"
            >
              <Eye className="h-4 w-4" />
            </button>
            <Link
              href={`/quotes/${quote.id}/edit`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-amber-50 hover:text-amber-800"
              aria-label="Angebot bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              aria-label="Angebot löschen"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <span className="text-lg font-bold text-[var(--primary)]">
            {formatEuro(quote.total_cents)}
          </span>
          <span className="text-xs text-[var(--muted)]">
            {formatDateDE(quote.created_at)}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
          <button
            type="button"
            onClick={() => setShowSend(true)}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-semibold text-white"
          >
            <Send className="h-4 w-4" />
            Versenden
          </button>
          <DownloadPdfButton quoteId={quote.id} quoteNumber={quote.quote_number} />
        </div>
      </li>

      <PdfViewerModal
        quoteId={quote.id}
        quoteNumber={quote.quote_number}
        open={showPdf}
        onClose={() => setShowPdf(false)}
      />

      <SendQuoteSheet
        quote={quote}
        companyName={companyName}
        open={showSend}
        onClose={() => setShowSend(false)}
        onSent={() => router.refresh()}
      />
    </>
  );
}
