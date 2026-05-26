import { normalizeQuoteItems } from "@/lib/quote-items";
import { MOCK_QUOTE_ITEMS } from "@/lib/mock-data";
import type { QuoteLineItem } from "@/lib/types";

const SYSTEM_PROMPT = `Du bist ein Assistent für Handwerker-Angebote in Deutschland.
Du erhältst ausschließlich eine Beschreibung erbrachter Leistungen (Transkript).
Es enthält KEINE Kundennamen, Adressen oder Kontaktdaten – extrahiere diese nicht und erfinde sie nicht.

Extrahiere nur Leistungen, Materialien und Arbeitszeiten als Angebotspositionen.
Antworte NUR mit validem JSON ohne Markdown, in diesem Format:
{
  "items": [
    {
      "description": "string",
      "quantity": number | null,
      "unit": "Stk|m²|h|lfm|pauschal" | null,
      "unitPriceCents": number | null,
      "laborHours": number | null (optional)
    }
  ]
}

WICHTIG – nichts erfinden:
- Wenn Menge, Einheit oder Preis NICHT klar im Transkript genannt sind: setze quantity, unit oder unitPriceCents auf null.
- Erfunde NIEMALS Preise, Mengen oder Einheiten.
- Übernimm Preise nur, wenn sie explizit genannt sind (z. B. "45 Euro pro Quadratmeter", "65 Euro die Stunde").
- unitPriceCents immer in Cent (4500 = 45,00 EUR), nur wenn Preis genannt wurde.
Alle Texte auf Deutsch.`;

/**
 * DSGVO: Nur Leistungstext – niemals Kundennamen/Adressen übergeben.
 */
export async function extractQuoteItems(
  servicesTranscript: string,
): Promise<QuoteLineItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return MOCK_QUOTE_ITEMS;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Leistungsbeschreibung (Transkript):\n${servicesTranscript}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const text = data.content.find((c) => c.type === "text")?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Kein JSON in Claude-Antwort");
  }

  const parsed = JSON.parse(jsonMatch[0]) as { items: QuoteLineItem[] };
  return normalizeQuoteItems(parsed.items);
}
