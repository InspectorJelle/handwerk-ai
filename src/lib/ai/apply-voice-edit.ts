import type { QuoteLineItem } from "@/lib/types";

const SYSTEM_PROMPT = `Du bearbeitest eine Handwerker-Angebotsliste in Deutschland.
Du erhältst die aktuelle Positionen-JSON und eine Sprachanweisung (nur Leistungen/Preise/Mengen).
KEINE Kundennamen oder Adressen – ignoriere personenbezogene Daten im Transkript.

Wende die Anweisung an (hinzufügen, entfernen, Mengen/Preise ändern).
Antworte NUR mit validem JSON:
{
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unit": "Stk|m²|h|lfm|pauschal",
      "unitPriceCents": number,
      "laborHours": number (optional)
    }
  ]
}`;

export async function applyVoiceEditToItems(
  currentItems: QuoteLineItem[],
  instructionTranscript: string,
): Promise<QuoteLineItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return currentItems;
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
          content: `Aktuelle Positionen:\n${JSON.stringify({ items: currentItems })}\n\nSprachanweisung:\n${instructionTranscript}`,
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
  return parsed.items;
}
