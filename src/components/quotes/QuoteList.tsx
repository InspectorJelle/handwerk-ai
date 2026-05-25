import Link from "next/link";
import { QuoteCard } from "@/components/quotes/QuoteCard";
import type { QuoteWithCustomer } from "@/lib/types";

type QuoteListProps = {
  quotes: QuoteWithCustomer[];
  companyName?: string;
};

export function QuoteList({ quotes, companyName }: QuoteListProps) {
  if (quotes.length === 0) {
    return (
      <div className="card mt-4 flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-[var(--muted)]">Noch keine Angebote vorhanden.</p>
        <Link href="/quotes/new" className="btn-primary">
          Erstes Angebot erstellen
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {quotes.map((quote) => (
        <QuoteCard key={quote.id} quote={quote} companyName={companyName} />
      ))}
    </ul>
  );
}
