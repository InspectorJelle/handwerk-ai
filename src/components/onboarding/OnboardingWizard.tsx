"use client";

import { useRouter } from "next/navigation";
import {
  CompanyForm,
  type CompanyFormValues,
} from "@/components/profile/CompanyForm";
import { APP_NAME } from "@/lib/brand";
import type { UserProfile } from "@/lib/types";

type OnboardingWizardProps = {
  initialProfile: UserProfile | null;
};

export function OnboardingWizard({ initialProfile }: OnboardingWizardProps) {
  const router = useRouter();

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

    if (!res.ok) {
      const err = await res.json();
      throw new Error(
        (err as { error?: string }).error ?? "Speichern fehlgeschlagen",
      );
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="pt-2">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-[var(--primary)]">
          Willkommen bei {APP_NAME}
        </p>
        <h2 className="mt-2 text-xl font-bold">Deinen Betrieb einrichten</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Pflicht sind Firmenname und Inhaber. Logo und weitere Angaben kannst du
          später ergänzen.
        </p>
      </div>

      <CompanyForm
        initialProfile={initialProfile}
        showLogo
        submitLabel="Betrieb anlegen & starten"
        onSubmit={save}
      />
    </div>
  );
}
