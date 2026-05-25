import type { QuoteStatus } from "@/lib/types";

export function formatPhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = `49${digits.slice(1)}`;
  }
  return digits;
}

export function buildQuoteShareMessage(params: {
  quoteNumber: string;
  customerName: string;
  totalFormatted: string;
  companyName?: string;
  pdfUrl?: string | null;
}): string {
  const lines = [
    `Guten Tag${params.customerName ? ` ${params.customerName}` : ""},`,
    "",
    `anbei unser Angebot ${params.quoteNumber} über ${params.totalFormatted}.`,
  ];

  if (params.pdfUrl) {
    lines.push("", `PDF: ${params.pdfUrl}`);
  } else {
    lines.push("", "Das Angebot senden wir Ihnen als PDF zu.");
  }

  lines.push("", "Mit freundlichen Grüßen", params.companyName ?? "Ihr Handwerksbetrieb");
  return lines.join("\n");
}

export function whatsAppShareUrl(phone: string, text: string): string {
  return `https://wa.me/${formatPhoneForWhatsApp(phone)}?text=${encodeURIComponent(text)}`;
}

export function emailShareUrl(
  email: string,
  subject: string,
  body: string,
): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export type QuoteStatusLabel = QuoteStatus;
