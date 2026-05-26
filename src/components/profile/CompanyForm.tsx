"use client";

import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import type { UserProfile } from "@/lib/types";

export type CompanyFormValues = {
  company_name: string;
  owner_name: string;
  company_address: string;
  company_phone: string;
  tax_id: string;
};

type CompanyFormProps = {
  initialProfile?: UserProfile | null;
  showLogo?: boolean;
  submitLabel: string;
  onSubmit: (values: CompanyFormValues) => Promise<void>;
  onLogoUploaded?: (profile: UserProfile) => void;
  onSuccess?: () => void;
};

export function CompanyForm({
  initialProfile,
  showLogo = true,
  submitLabel,
  onSubmit,
  onLogoUploaded,
  onSuccess,
}: CompanyFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialProfile?.logo_url ?? null);
  const [companyName, setCompanyName] = useState(initialProfile?.company_name ?? "");
  const [ownerName, setOwnerName] = useState(initialProfile?.owner_name ?? "");
  const [companyAddress, setCompanyAddress] = useState(
    initialProfile?.company_address ?? "",
  );
  const [companyPhone, setCompanyPhone] = useState(
    initialProfile?.company_phone ?? "",
  );
  const [taxId, setTaxId] = useState(initialProfile?.tax_id ?? "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadLogo = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("logo", file);
      const res = await fetch("/api/profile/logo", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json();
        throw new Error((err as { error?: string }).error ?? "Upload fehlgeschlagen");
      }
      const data = (await res.json()) as { profile: UserProfile };
      setLogoUrl(data.profile.logo_url);
      onLogoUploaded?.(data.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() || !ownerName.trim()) {
      setError("Firmenname und Inhaber sind Pflichtfelder.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        company_name: companyName.trim(),
        owner_name: ownerName.trim(),
        company_address: companyAddress.trim(),
        company_phone: companyPhone.trim(),
        tax_id: taxId.trim(),
      });
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
      {showLogo && (
        <div className="card flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--border)] bg-zinc-50"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Firmenlogo"
                fill
                className="object-contain p-1"
                unoptimized
              />
            ) : uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
            ) : (
              <Upload className="h-6 w-6 text-[var(--muted)]" />
            )}
          </button>
          <div>
            <p className="font-medium">Firmenlogo</p>
            <p className="text-sm text-[var(--muted)]">Optional – erscheint auf dem PDF</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 text-sm font-medium text-[var(--primary)]"
            >
              Logo hochladen
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadLogo(f);
            }}
          />
        </div>
      )}

      <label className="field">
        <span>Firmenname *</span>
        <input
          required
          placeholder="Muster Handwerk GmbH"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Inhaber / Geschäftsführer *</span>
        <input
          required
          placeholder="Max Mustermann"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Firmenadresse</span>
        <textarea
          rows={2}
          placeholder="Musterstraße 1, 12345 Berlin"
          value={companyAddress}
          onChange={(e) => setCompanyAddress(e.target.value)}
        />
      </label>

      <label className="field">
        <span>Telefon</span>
        <input
          type="tel"
          placeholder="+49 170 1234567"
          value={companyPhone}
          onChange={(e) => setCompanyPhone(e.target.value)}
        />
      </label>

      <label className="field">
        <span>USt-IdNr.</span>
        <input
          placeholder="DE123456789"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Wird gespeichert…" : submitLabel}
      </button>
    </form>
  );
}
