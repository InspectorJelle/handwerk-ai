"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <div className="app-shell mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 safe-top safe-bottom">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Anmelden als Handwerker
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[var(--primary)]"
          >
            Passwort vergessen?
          </Link>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Wird angemeldet…" : "Anmelden"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        Noch kein Konto?{" "}
        <Link href="/register" className="font-medium text-[var(--primary)]">
          Registrieren
        </Link>
      </p>
    </div>
  );
}
