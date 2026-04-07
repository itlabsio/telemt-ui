"use client";

import { LogOut, RefreshCw } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

interface TopbarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-6">
      <div>
        <h1 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h1>
        {description && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

// Reusable refresh button for client pages that poll data.
export function RefreshButton({ onClick, loading }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      Refresh
    </button>
  );
}