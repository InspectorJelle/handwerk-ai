import { formatEuro } from "@/lib/format";

const VAT_RATE = 0.19;

export function quoteNetCents(totalCents: number): number {
  return totalCents;
}

export function quoteVatCents(netCents: number): number {
  return Math.round(netCents * VAT_RATE);
}

export function quoteGrossCents(netCents: number): number {
  return netCents + quoteVatCents(netCents);
}

type QuoteTotalsProps = {
  netCents: number;
  compact?: boolean;
};

export function QuoteTotals({ netCents, compact = false }: QuoteTotalsProps) {
  const vat = quoteVatCents(netCents);
  const gross = quoteGrossCents(netCents);

  if (compact) {
    return (
      <div className="min-w-0 text-left">
        <p className="text-xl font-bold tabular-nums text-[var(--primary)]">
          {formatEuro(gross)}
        </p>
        <p className="text-xs text-[var(--muted)]">
          netto {formatEuro(netCents)} · inkl. 19&nbsp;% MwSt.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm">
      <div className="flex justify-between text-[var(--muted)]">
        <span>Netto</span>
        <span className="tabular-nums">{formatEuro(netCents)}</span>
      </div>
      <div className="flex justify-between text-[var(--muted)]">
        <span>MwSt. 19&nbsp;%</span>
        <span className="tabular-nums">{formatEuro(vat)}</span>
      </div>
      <div className="flex justify-between text-base font-bold text-[var(--primary)]">
        <span>Brutto</span>
        <span className="tabular-nums">{formatEuro(gross)}</span>
      </div>
    </div>
  );
}
