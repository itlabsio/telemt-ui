import { cn } from "@/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  // Visual accent for the value.
  accent?: "default" | "success" | "warning" | "destructive";
  className?: string;
}

const accentClass: Record<string, string> = {
  default: "text-[var(--color-primary)]",
  success: "text-[var(--color-success)]",
  warning: "text-[var(--color-warning)]",
  destructive: "text-[var(--color-destructive)]",
};

export function StatCard({ label, value, sub, icon, accent = "default", className }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="flex items-center gap-4 py-4">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-secondary)]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
          <p className={cn("truncate text-xl font-bold tabular-nums", accentClass[accent])}>
            {value}
          </p>
          {sub && <p className="truncate text-xs text-[var(--color-muted-foreground)]">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}