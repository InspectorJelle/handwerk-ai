"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    await fetch("/api/profile/setup", { method: "POST" });

    router.push("/onboarding");
    router.refresh();
  };

  return (
    <div className="app-shell mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 safe-top safe-bottom">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Konto erstellen – Firmendaten folgen im nächsten Schritt
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <label className="field">
          <span>E-Mail</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Passwort</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Wird erstellt…" : "Weiter zur Firmeneinrichtung"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Bereits registriert?{" "}
        <Link href="/login" className="font-medium text-[var(--primary)]">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
