import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex min-w-0 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-ui-low hover:bg-primary/90",
        destructive:
          "border border-[var(--status-danger)]/20 bg-[var(--status-danger-surface)] text-[var(--status-danger)] shadow-ui-low hover:border-[var(--status-danger)]/30 hover:bg-[var(--status-danger-surface)]",
        outline:
          "border border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "min-h-9 px-3 py-1.5 gap-1.5 has-[>svg]:px-2.5",
        lg: "min-h-11 px-6 py-2.5 has-[>svg]:px-5",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
