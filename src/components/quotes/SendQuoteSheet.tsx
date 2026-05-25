"use client";

import { Mail, MessageCircle, X } from "lucide-react";
import { formatEuro } from "@/lib/format";
import {
  buildQuoteShareMessage,
  emailShareUrl,
  whatsAppShareUrl,
} from "@/lib/share";
import type { QuoteWithCustomer } from "@/lib/types";

type SendQuoteSheetProps = {
  quote: QuoteWithCustomer;
  companyName?: string;
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
};

export function SendQuoteSheet({
  quote,
  companyName,
  open,
  onClose,
  onSent,
}: SendQuoteSheetProps) {
  if (!open) return null;

  const message = buildQuoteShareMessage({
    quoteNumber: quote.quote_number,
    customerName: quote.customer.name,
    totalFormatted: formatEuro(quote.total_cents),
    companyName,
    pdfUrl: quote.pdf_url,
  });

  const subject = `Angebot ${quote.quote_number}`;

  const markSent = async () => {
    await fetch(`/api/quotes/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });
    onSent?.();
  };

  const handleWhatsApp = () => {
    if (!quote.customer.phone) return;
    void markSent();
    window.open(whatsAppShareUrl(quote.customer.phone, message), "_blank");
    onClose();
  };

  const handleEmail = () => {
    if (!quote.customer.email) return;
    void markSent();
    window.location.href = emailShareUrl(
      quote.customer.email,
      subject,
      message,
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Schließen"
        onClick={onClose}
      />
      <div className="safe-bottom absolute bottom-0 left-0 right-0 mx-auto max-w-md rounded-t-2xl bg-[var(--surface)] px-4 pb-6 pt-3 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Angebot versenden</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[var(--muted)]">
          {quote.quote_number} · {quote.customer.name}
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleWhatsApp}
            disabled={!quote.customer.phone}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border)] px-4 text-left disabled:opacity-40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">Per WhatsApp</span>
              <span className="text-xs text-[var(--muted)]">
                {quote.customer.phone ?? "Keine Telefonnummer hinterlegt"}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={handleEmail}
            disabled={!quote.customer.email}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-[var(--border)] px-4 text-left disabled:opacity-40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-semibold">Per E-Mail</span>
              <span className="text-xs text-[var(--muted)]">
                {quote.customer.email ?? "Keine E-Mail hinterlegt"}
              </span>
            </span>
          </button>
        </div>

        {!quote.customer.phone && !quote.customer.email && (
          <p className="mt-3 text-xs text-amber-800">
            Beim Anlegen des Angebots E-Mail oder Telefon angeben, um zu
            versenden.
          </p>
        )}
      </div>
    </div>
  );
}
