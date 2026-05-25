import Link from "next/link";
import { Plus } from "lucide-react";
import { MobileShell } from "@/components/layout/MobileShell";
import { QuoteList } from "@/components/quotes/QuoteList";
import { APP_NAME } from "@/lib/brand";
import { isQuotesDataAvailable, listRecentQuotes, getUserProfile } from "@/lib/quotes";

export default async function DashboardPage() {
  const [quotes, profile] = await Promise.all([
    listRecentQuotes(10),
    getUserProfile(),
  ]);
  const supabaseReady = isQuotesDataAvailable();

  return (
    <MobileShell title="Angebote" subtitle={APP_NAME}>
      {!supabaseReady && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Dev-Modus: Supabase nicht konfiguriert. Angebote werden lokal
          verarbeitet, aber nicht gespeichert.
        </p>
      )}

      <Link
        href="/quotes/new"
        className="btn-primary mt-4 flex items-center justify-center gap-2"
      >
        <Plus className="h-5 w-5" />
        Neues Angebot
      </Link>

      <QuoteList
        quotes={quotes}
        companyName={profile?.company_name}
      />
    </MobileShell>
  );
}
