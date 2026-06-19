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
        "file:text-foreground",
        "placeholder:text-muted-foreground",
        "selection:bg-primary selection:text-primary-foreground",

        "dark:bg-input/30 bg-input-background",

        "border-input",

        "flex h-11 w-full min-w-0 rounded-xl border",

        "px-4 py-2",

        "text-sm",

        "shadow-sm",

        "transition-all duration-200",

        "outline-none",

        "hover:border-primary/40",

        "focus-visible:border-primary",
        "focus-visible:ring-primary/15",
        "focus-visible:ring-4",

        "file:inline-flex",
        "file:h-7",
        "file:border-0",
        "file:bg-transparent",
        "file:text-sm",
        "file:font-medium",

        "disabled:pointer-events-none",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",

        "aria-invalid:border-destructive",
        "aria-invalid:ring-destructive/20",
        "dark:aria-invalid:ring-destructive/40",

        className,
      )}
      {...props}
    />
  );
}

export { Input };