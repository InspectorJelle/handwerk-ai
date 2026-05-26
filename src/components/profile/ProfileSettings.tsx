"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CompanyForm,
  type CompanyFormValues,
} from "@/components/profile/CompanyForm";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

type ProfileSettingsProps = {
  initialProfile: UserProfile;
  email: string | null;
};

export function ProfileSettings({ initialProfile, email }: ProfileSettingsProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const save = async (values: CompanyFormValues) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: values.company_name,
        owner_name: values.owner_name,
        company_address: values.company_address || undefined,
        company_phone: values.company_phone || null,
        tax_id: values.tax_id || null,
      }),
    });
    if (!res.ok) throw new Error("Speichern fehlgeschlagen");
  };

  const logout = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {email && (
        <p className="text-sm text-[var(--muted)]">
          Angemeldet als <span className="font-medium">{email}</span>
        </p>
      )}

      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <CompanyForm
        initialProfile={initialProfile}
        showLogo
        submitLabel="Profil speichern"
        onSubmit={save}
        onSuccess={() => {
          setMessage("Gespeichert");
          router.refresh();
          setTimeout(() => setMessage(null), 2000);
        }}
        onLogoUploaded={() => router.refresh()}
      />

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
