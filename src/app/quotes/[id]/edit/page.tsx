import { notFound } from "next/navigation";
import { MobileShell } from "@/components/layout/MobileShell";
import { QuoteEditor } from "@/components/quotes/QuoteEditor";
import { getQuoteWithCustomer } from "@/lib/quotes";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuoteEditPage({ params }: PageProps) {
  const { id } = await params;
  const quote = await getQuoteWithCustomer(id);

  if (!id || !quote) {
    notFound();
  }

  return (
    <MobileShell title="Angebot bearbeiten" subtitle={quote.quote_number} hideNav>
      <QuoteEditor initialQuote={quote} />
    </MobileShell>
  );
}
