"use client";

import type { CustomerInput } from "@/lib/types";

type CustomerStepProps = {
  value: CustomerInput;
  onChange: (value: CustomerInput) => void;
  onNext: () => void;
};

export function CustomerStep({ value, onChange, onNext }: CustomerStepProps) {
  const canContinue = value.name.trim().length > 0 && value.address.trim().length > 0;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <h2 className="text-lg font-semibold">Kundendaten</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Schritt 1 von 3 – Wer erhält das Angebot?
        </p>
      </div>

      <label className="field">
        <span>Name *</span>
        <input
          type="text"
          autoComplete="name"
          placeholder="Max Mustermann"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Adresse *</span>
        <textarea
          rows={3}
          placeholder="Musterstraße 1, 12345 Berlin"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />
      </label>

      <label className="field">
        <span>E-Mail</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="kunde@beispiel.de"
          value={value.email ?? ""}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
      </label>

      <label className="field">
        <span>Telefon</span>
        <input
          type="tel"
          autoComplete="tel"
          placeholder="+49 170 1234567"
          value={value.phone ?? ""}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </label>

      <button
        type="button"
        className="btn-primary mt-2"
        disabled={!canContinue}
        onClick={onNext}
      >
        Weiter zur Aufnahme
      </button>
    </div>
  );
}
