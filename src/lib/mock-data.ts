import type { QuoteLineItem } from "@/lib/types";

/** Nur Leistungen – keine personenbezogenen Kundendaten (DSGVO-Mock). */
export const MOCK_TRANSCRIPT =
  "Ungefähr 25 Quadratmeter Laminat verlegen inklusive Trittschalldämmung, " +
  "dann zwei Türen neu abschleifen und lackieren, und etwa vier Stunden für die Demontage der alten Küche.";

export const MOCK_QUOTE_ITEMS: QuoteLineItem[] = [
  {
    description: "Laminat verlegen inkl. Trittschalldämmung",
    quantity: 25,
    unit: "m²",
    unitPriceCents: 4500,
  },
  {
    description: "Türen abschleifen und lackieren",
    quantity: 2,
    unit: "Stk",
    unitPriceCents: 12000,
  },
  {
    description: "Demontage alte Küche",
    quantity: 4,
    unit: "h",
    unitPriceCents: 6500,
    laborHours: 4,
  },
];
