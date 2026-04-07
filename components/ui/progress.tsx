import { cn } from "@/lib/cn";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  // Color variant based on coverage thresholds.
  variant?: "default" | "success" | "warning" | "destructive";
}

const variantTrack: Record<string, string> = {
  default: "bg-[var(--color-primary)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  destructive: "bg-[var(--color-destructive)]",
};

export function Progress({ value, max = 100, variant = "default", className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-secondary)]", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-300", variantTrack[variant])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}