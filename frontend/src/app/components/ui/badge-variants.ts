import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex max-w-full shrink-0 items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-3 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-[var(--status-danger-surface)] text-[var(--status-danger)] hover:bg-[var(--status-danger-surface)]",
        outline: "text-foreground border-input hover:bg-accent hover:text-accent-foreground",
        success:
          "border-transparent bg-[var(--status-success-surface)] text-[var(--status-success)]",
        warning:
          "border-transparent bg-[var(--status-warning-surface)] text-[var(--status-warning)]",
        danger:
          "border-transparent bg-[var(--status-danger-surface)] text-[var(--status-danger)]",
        info:
          "border-transparent bg-[var(--status-info-surface)] text-[var(--status-info)]",
        type:
          "border-border bg-card text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
