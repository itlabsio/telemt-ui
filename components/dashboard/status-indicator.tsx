import { cn } from "@/lib/cn";

interface StatusIndicatorProps {
  state: "ok" | "warning" | "error" | "unknown";
  label: string;
  detail?: string;
}

const dotClass: Record<string, string> = {
  ok: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  error: "bg-[var(--color-destructive)]",
  unknown: "bg-[var(--color-muted-foreground)]",
};

export function StatusIndicator({ state, label, detail }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          dotClass[state],
          state === "ok" && "shadow-[0_0_6px_var(--color-success)]"
        )}
      />
      <div>
        <p className="text-sm text-[var(--color-foreground)]">{label}</p>
        {detail && <p className="text-xs text-[var(--color-muted-foreground)]">{detail}</p>}
      </div>
    </div>
  );
}