import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "outline" | "secondary";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/25",
  success: "bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/25",
  warning: "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/25",
  destructive: "bg-[var(--color-destructive)]/15 text-[var(--color-destructive)] border-[var(--color-destructive)]/25",
  outline: "border-[var(--color-border)] text-[var(--color-muted-foreground)]",
  secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] border-transparent",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}