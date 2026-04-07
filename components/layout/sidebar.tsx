"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  BarChart3,
  ShieldCheck,
  Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/runtime", label: "Runtime", icon: Activity },
  { href: "/dashboard/stats", label: "Statistics", icon: BarChart3 },
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
];

interface SidebarProps {
  userName?: string | null;
  userEmail?: string | null;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-background)]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-[var(--color-border)] px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/15">
          <Shield className="h-4 w-4 text-[var(--color-primary)]" />
        </div>
        <span className="text-sm font-semibold text-[var(--color-foreground)]">Telemt</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                  {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] text-xs font-semibold text-[var(--color-secondary-foreground)]">
            {(userName ?? userEmail ?? "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            {userName && (
              <p className="truncate text-xs font-medium text-[var(--color-foreground)]">{userName}</p>
            )}
            {userEmail && (
              <p className="truncate text-xs text-[var(--color-muted-foreground)]">{userEmail}</p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}