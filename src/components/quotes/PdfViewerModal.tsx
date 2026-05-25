"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

type PdfViewerModalProps = {
  quoteId: string;
  quoteNumber: string;
  open: boolean;
  onClose: () => void;
};

export function PdfViewerModal({
  quoteId,
  quoteNumber,
  open,
  onClose,
}: PdfViewerModalProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      if (url) URL.revokeObjectURL(url);
      setUrl(null);
      setError(null);
      return;
    }

    let revoked: string | null = null;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quoteId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            (err as { error?: string }).error ?? "PDF konnte nicht geladen werden",
          );
        }
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setUrl(objectUrl);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler");
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, quoteId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black/60 p-4 safe-top safe-bottom">
      <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">{quoteNumber}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative flex-1 bg-zinc-100">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-[var(--primary)]" />
            </div>
          )}
          {error && (
            <p className="p-4 text-center text-sm text-red-600">{error}</p>
          )}
          {url && !loading && (
            <iframe
              title={`PDF ${quoteNumber}`}
              src={url}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
}
