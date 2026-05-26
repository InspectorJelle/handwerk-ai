"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { CustomerStep } from "@/components/quotes/CustomerStep";
import { ProcessingStep } from "@/components/quotes/ProcessingStep";
import { RecordStep } from "@/components/quotes/RecordStep";
import type { CustomerInput } from "@/lib/types";
import { hasIncompleteItems } from "@/lib/quote-items";
import type { QuoteLineItem } from "@/lib/types";

type WizardStep = 1 | 2 | 3;

const emptyCustomer: CustomerInput = {
  name: "",
  address: "",
  email: "",
  phone: "",
};

export default function NewQuotePage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [customer, setCustomer] = useState<CustomerInput>(emptyCustomer);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const saveCustomerAndContinue = useCallback(async () => {
    setSavingCustomer(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          typeof err.error === "string"
            ? err.error
            : "Kunde konnte nicht gespeichert werden",
        );
      }
      const { customerId: id } = (await res.json()) as { customerId: string };
      setCustomerId(id);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Speichern");
    } finally {
      setSavingCustomer(false);
    }
  }, [customer]);

  const processAudio = useCallback(
    async (audio: Blob) => {
      if (!customerId) {
        setError("Bitte zuerst Kundendaten speichern.");
        return;
      }

      setStep(3);
      setError(null);

      try {
        const transcribeForm = new FormData();
        transcribeForm.append("audio", audio, "recording.webm");

        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          body: transcribeForm,
        });

        if (!transcribeRes.ok) {
          const err = await transcribeRes.json();
          throw new Error(err.error ?? "Transkription fehlgeschlagen");
        }

        const { transcript } = (await transcribeRes.json()) as {
          transcript: string;
        };

        const processRes = await fetch("/api/process-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            transcript,
          }),
        });

        if (!processRes.ok) {
          const err = await processRes.json();
          throw new Error(
            typeof err.error === "string"
              ? err.error
              : "Angebot konnte nicht erstellt werden",
          );
        }

        const { quoteId, items } = (await processRes.json()) as {
          quoteId: string;
          items: QuoteLineItem[];
        };

        if (quoteId && !quoteId.startsWith("dev-mock")) {
          await fetch("/api/generate-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quoteId }),
          });
        }

        if (quoteId && hasIncompleteItems(items)) {
          router.push(`/quotes/${quoteId}/edit`);
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unbekannter Fehler");
      }
    },
    [customerId, router],
  );

  return (
    <MobileShell
      title="Neues Angebot"
      subtitle={step === 1 ? "Kunde" : step === 2 ? "Aufnahme" : "Verarbeitung"}
      hideNav={step === 2 || step === 3}
    >
      {step === 1 && (
        <>
          <CustomerStep
            value={customer}
            onChange={setCustomer}
            onNext={() => void saveCustomerAndContinue()}
          />
          {savingCustomer && (
            <p className="mt-2 text-center text-sm text-[var(--muted)]">
              Kunde wird gespeichert…
            </p>
          )}
          {error && step === 1 && (
            <p className="mt-2 text-center text-sm text-red-600">{error}</p>
          )}
        </>
      )}
      {step === 2 && (
        <RecordStep
          onBack={() => setStep(1)}
          onSubmit={(audio) => void processAudio(audio)}
        />
      )}
      {step === 3 && (
        <ProcessingStep
          error={error}
          message={error ? undefined : "KI berechnet Angebot…"}
        />
      )}
    </MobileShell>
  );
}
