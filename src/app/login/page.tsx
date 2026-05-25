import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <p className="text-[var(--muted)]">Laden…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
