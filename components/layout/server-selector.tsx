"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, Server, Check } from "lucide-react";
import { useServerIndex } from "@/lib/use-server-index";
import { cn } from "@/lib/cn";
import type { BackendInfo } from "@/lib/backends";

export function ServerSelector() {
  const [backends, setBackends] = useState<BackendInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [serverIndex, setServerIndex] = useServerIndex();
  const ref = useRef<HTMLDivElement>(null);

  // Fetch backend list from the server once on mount.
  useEffect(() => {
    fetch("/api/backends")
      .then((r) => r.json())
      .then((body) => {
        if (body.ok) setBackends(body.data as BackendInfo[]);
      })
      .catch(() => undefined);
  }, []);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Hide selector when only one backend is configured.
  if (backends.length <= 1) return null;

  const current = backends[serverIndex] ?? backends[0];

  return (
    <div ref={ref} className="relative px-2 pb-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-secondary)]/40 px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
      >
        <Server className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
        <span className="flex-1 truncate text-left">{current?.label ?? "Server"}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-2 right-2 mb-1 z-50 rounded-md border border-[var(--color-border)] bg-[var(--color-popover)] shadow-lg">
          {backends.map((b) => (
            <button
              key={b.index}
              onClick={() => {
                setServerIndex(b.index);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors first:rounded-t-md last:rounded-b-md"
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  b.index === serverIndex
                    ? "text-[var(--color-primary)]"
                    : "text-transparent"
                )}
              />
              <span className="truncate">{b.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}