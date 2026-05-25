"use client";

import { Loader2 } from "lucide-react";

type ProcessingStepProps = {
  message?: string;
  error?: string | null;
};

export function ProcessingStep({
  message = "KI berechnet Angebot…",
  error,
}: ProcessingStepProps) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-6 pt-8 text-center">
      {!error ? (
        <>
          <Loader2 className="h-14 w-14 animate-spin text-[var(--primary)]" />
          <div>
            <h2 className="text-lg font-semibold">Einen Moment</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
          </div>
          <ul className="text-left text-sm text-[var(--muted)]">
            <li>• Audio wird transkribiert</li>
            <li>• Positionen werden erkannt</li>
            <li>• Angebot wird gespeichert</li>
          </ul>
        </>
      ) : (
        <div className="card w-full border-red-200 bg-red-50">
          <p className="font-medium text-red-800">Fehler</p>
          <p className="mt-2 text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
