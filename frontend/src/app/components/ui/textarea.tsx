"use client";

import * as React from "react";
import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground shadow-xs transition-colors",
        "placeholder:text-muted-foreground hover:border-[var(--border-strong)]",
        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--status-warning)] aria-invalid:ring-[var(--status-warning)]/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
