"use client";

import Link from "next/link";
import { useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      setLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/auth/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="app-shell mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 safe-top safe-bottom">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Passwort zurücksetzen</p>
      </div>

      {sent ? (
        <div className="card text-center">
          <p className="text-sm text-[var(--foreground)]">
            Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link
            geschickt.
          </p>
          <Link href="/login" className="btn-primary mt-4 inline-flex">
            Zur Anmeldung
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <label className="field">
            <span>E-Mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Wird gesendet…" : "Link senden"}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/login" className="font-medium text-[var(--primary)]">
          Zurück zur Anmeldung
        </Link>
      </p>
    </div>
  );
}
