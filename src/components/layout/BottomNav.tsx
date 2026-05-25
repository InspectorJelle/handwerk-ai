"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Mic, User } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Angebote", icon: FileText },
  { href: "/quotes/new", label: "Neu", icon: Mic, highlight: true },
  { href: "/profile", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav safe-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            pathname === tab.href ||
            (tab.href === "/quotes/new" && pathname.startsWith("/quotes"));
          const isHighlight = "highlight" in tab && tab.highlight;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex min-h-12 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
                active
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isHighlight
                    ? active
                      ? "bg-[var(--primary)] text-white shadow-lg"
                      : "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : ""
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
