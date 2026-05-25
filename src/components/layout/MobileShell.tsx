import { BottomNav } from "@/components/layout/BottomNav";

type MobileShellProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  hideNav?: boolean;
};

export function MobileShell({
  children,
  title,
  subtitle,
  hideNav = false,
}: MobileShellProps) {
  return (
    <div className="app-shell mx-auto flex min-h-dvh w-full max-w-md flex-col">
      {(title || subtitle) && (
        <header className="safe-top sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/95 px-4 py-4 backdrop-blur-md">
          {title && (
            <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm text-[var(--muted)]">{subtitle}</p>
          )}
        </header>
      )}
      <main
        className={`flex-1 px-4 ${hideNav ? "pb-6" : "pb-[calc(5rem+env(safe-area-inset-bottom))]"}`}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
