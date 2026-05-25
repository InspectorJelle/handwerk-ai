"use client";

import { Loader2, LogOut, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

type ProfileSettingsProps = {
  initialProfile: UserProfile;
  email: string | null;
};

export function ProfileSettings({ initialProfile, email }: ProfileSettingsProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState(initialProfile);
  const [companyName, setCompanyName] = useState(profile.company_name);
  const [taxId, setTaxId] = useState(profile.tax_id ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName,
          tax_id: taxId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      const data = (await res.json()) as { profile: UserProfile };
      setProfile(data.profile);
      setMessage("Gespeichert");
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSaving(false);
    }
  };

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
      setProfile(data.profile);
      setMessage("Logo hochgeladen");
      setTimeout(() => setMessage(null), 2000);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="card flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--border)] bg-zinc-50"
        >
          {profile.logo_url ? (
            <Image
              src={profile.logo_url}
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
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{companyName || "Firma"}</p>
          {email && <p className="truncate text-sm text-[var(--muted)]">{email}</p>}
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

      <label className="field">
        <span>Firmenname</span>
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </label>

      <label className="field">
        <span>USt-IdNr.</span>
        <input
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          placeholder="DE123456789"
        />
      </label>

      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        className="btn-primary"
        disabled={saving}
        onClick={() => void saveProfile()}
      >
        {saving ? "Speichern…" : "Profil speichern"}
      </button>

      <button
        type="button"
        onClick={() => void logout()}
        className="btn-secondary flex items-center justify-center gap-2 text-red-600"
      >
        <LogOut className="h-4 w-4" />
        Abmelden
      </button>
    </div>
  );
}
