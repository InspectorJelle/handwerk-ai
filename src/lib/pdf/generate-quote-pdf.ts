import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { APP_NAME } from "@/lib/brand";
import type { QuoteLineItem } from "@/lib/types";
import { hasIncompleteItems, lineTotalCents } from "@/lib/quote-items";

export type PdfQuoteData = {
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

const MARGIN = 48;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const RIGHT = PAGE_WIDTH - MARGIN;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLOR = {
  text: rgb(0.12, 0.14, 0.18),
  muted: rgb(0.45, 0.48, 0.52),
  line: rgb(0.88, 0.9, 0.93),
  sectionBg: rgb(0.97, 0.98, 0.99),
  accent: rgb(0.05, 0.35, 0.75),
};

async function fetchLogoBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function drawRight(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color = COLOR.text,
  rightEdge = RIGHT,
) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightEdge - w, y, size, font, color });
}

function drawSectionLabel(
  page: PDFPage,
  label: string,
  y: number,
  fontBold: PDFFont,
) {
  page.drawText(label.toUpperCase(), {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: COLOR.muted,
  });
}

export async function generateQuotePdf(
  data: PdfQuoteData,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = PAGE_HEIGHT - MARGIN;

  const fmt = (cents: number) =>
    new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);

  const dateStr = new Intl.DateTimeFormat("de-DE").format(
    new Date(data.createdAt),
  );

  // --- Header: Logo links, Angebots-Meta rechts ---
  const LOGO_SIZE = 56;
  let headerTextX = MARGIN;

  if (data.logoUrl) {
    const bytes = await fetchLogoBytes(data.logoUrl);
    if (bytes) {
      try {
        const isPng =
          bytes[0] === 0x89 &&
          bytes[1] === 0x50 &&
          bytes[2] === 0x4e &&
          bytes[3] === 0x47;
        const image = isPng
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const dims = image.scaleToFit(LOGO_SIZE, LOGO_SIZE);
        page.drawImage(image, {
          x: MARGIN,
          y: y - dims.height + 8,
          width: dims.width,
          height: dims.height,
        });
        headerTextX = MARGIN + LOGO_SIZE + 14;
      } catch {
        // Logo überspringen bei Fehler
      }
    }
  }

  page.drawText(data.companyName || APP_NAME, {
    x: headerTextX,
    y: y - 4,
    size: 16,
    font: fontBold,
    color: COLOR.text,
  });

  if (data.taxId) {
    page.drawText(`USt-IdNr. ${data.taxId}`, {
      x: headerTextX,
      y: y - 22,
      size: 9,
      font,
      color: COLOR.muted,
    });
  }

  drawRight(page, "ANGEBOT", y, fontBold, 14, COLOR.accent);
  drawRight(page, data.quoteNumber, y - 18, fontBold, 11);
  drawRight(page, `Datum: ${dateStr}`, y - 32, font, 9, COLOR.muted);

  y -= 72;

  // Trennlinie Handwerker / Dokument
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: RIGHT, y },
    thickness: 0.75,
    color: COLOR.line,
  });
  y -= 20;

  // --- Kunde ---
  drawSectionLabel(page, "Kunde", y, fontBold);
  y -= 14;

  page.drawRectangle({
    x: MARGIN,
    y: y - 38,
    width: CONTENT_WIDTH,
    height: 44,
    color: COLOR.sectionBg,
    borderColor: COLOR.line,
    borderWidth: 0.5,
  });

  page.drawText(data.customerName, {
    x: MARGIN + 12,
    y: y - 4,
    size: 11,
    font: fontBold,
    color: COLOR.text,
  });

  const addressLines = data.customerAddress.split("\n").slice(0, 2);
  addressLines.forEach((line, i) => {
    page.drawText(line, {
      x: MARGIN + 12,
      y: y - 18 - i * 12,
      size: 10,
      font,
      color: COLOR.muted,
    });
  });

  y -= 58;

  // --- Positionen (Spalten mit festen rechten Kanten, damit EP/Summe nicht überlappen) ---
  drawSectionLabel(page, "Positionen", y, fontBold);
  y -= 14;

  const COL_SUM = RIGHT;
  const COL_EP = RIGHT - 82;
  const COL_QTY = RIGHT - 168;
  const DESC_MAX_CHARS = 42;

  page.drawText("Beschreibung", {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: COLOR.muted,
  });
  page.drawText("Menge", { x: COL_QTY, y, size: 8, font: fontBold, color: COLOR.muted });
  drawRight(page, "EP", y, fontBold, 8, COLOR.muted, COL_EP);
  drawRight(page, "Summe", y, fontBold, 8, COLOR.muted, COL_SUM);
  y -= 10;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: RIGHT, y },
    thickness: 0.5,
    color: COLOR.line,
  });
  y -= 14;

  for (const item of data.items) {
    const lineTotal = lineTotalCents(item);
    const desc =
      item.description.length > DESC_MAX_CHARS
        ? `${item.description.slice(0, DESC_MAX_CHARS - 1)}…`
        : item.description;

    const qtyLabel =
      item.quantity != null && item.unit
        ? `${item.quantity} ${item.unit}`
        : item.quantity != null
          ? String(item.quantity)
          : item.unit ?? "—";

    page.drawText(desc, { x: MARGIN, y, size: 10, font, color: COLOR.text });
    page.drawText(qtyLabel, {
      x: COL_QTY,
      y,
      size: 10,
      font,
      color: COLOR.text,
    });
    drawRight(
      page,
      item.unitPriceCents != null ? fmt(item.unitPriceCents) : "offen",
      y,
      font,
      10,
      item.unitPriceCents != null ? COLOR.text : COLOR.muted,
      COL_EP,
    );
    drawRight(
      page,
      lineTotal != null ? fmt(lineTotal) : "offen",
      y,
      fontBold,
      10,
      lineTotal != null ? COLOR.text : COLOR.muted,
      COL_SUM,
    );
    y -= 18;

    if (y < 120) break;
  }

  if (hasIncompleteItems(data.items)) {
    y -= 4;
    page.drawText(
      "Hinweis: Positionen mit „offen“ sind noch ohne vollständige Angaben.",
      { x: MARGIN, y, size: 8, font, color: COLOR.muted },
    );
    y -= 12;
  }

  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: RIGHT, y },
    thickness: 0.5,
    color: COLOR.line,
  });
  y -= 18;

  // --- Summen rechtsbündig ---
  const netto = data.totalCents;
  const mwst = Math.round(netto * 0.19);
  const brutto = netto + mwst;
  const labelX = RIGHT - 130;

  page.drawText("Netto", { x: labelX, y, size: 10, font, color: COLOR.muted });
  drawRight(page, fmt(netto), y, font, 10);
  y -= 16;

  page.drawText("MwSt. 19 %", { x: labelX, y, size: 10, font, color: COLOR.muted });
  drawRight(page, fmt(mwst), y, font, 10);
  y -= 18;

  page.drawText("Brutto", { x: labelX, y, size: 12, font: fontBold, color: COLOR.text });
  drawRight(page, fmt(brutto), y, fontBold, 12, COLOR.accent);

  y -= 36;
  page.drawText(
    `Erstellt mit ${APP_NAME} · Gültig 30 Tage ab Ausstellungsdatum.`,
    { x: MARGIN, y, size: 8, font, color: COLOR.muted },
  );

  return doc.save();
}
