"use client";

import * as React from "react";

import { cn } from "./utils";

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex min-h-10 w-full min-w-0 rounded-md border border-input bg-input-background px-3 py-2 text-sm text-foreground transition-colors outline-none",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "hover:border-[var(--border-strong)]",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20",
        "file:mr-2 file:inline-flex file:min-h-8 file:cursor-pointer file:items-center file:rounded-sm file:border-0 file:bg-muted file:px-2.5 file:text-xs file:font-medium file:text-foreground file:transition-colors hover:file:bg-muted/80",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-[var(--status-warning)] aria-invalid:ring-[var(--status-warning)]/20",
        "focus-visible:aria-invalid:border-[var(--status-warning)] focus-visible:aria-invalid:ring-[var(--status-warning)]/20",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
