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
        // Base y Dimensiones
        "flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-xs transition-all duration-200 outline-none",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",

        // Estados Interactivos (Hover & Focus)
        "hover:border-accent-foreground/30",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20",

        // Estilos para Input de Archivos (type="file")
        "file:mr-2 file:inline-flex file:h-7 file:cursor-pointer file:items-center file:rounded-sm file:border-0 file:bg-muted file:px-2.5 file:text-xs file:font-medium file:text-foreground file:transition-colors hover:file:bg-muted/80",

        // Estado Deshabilitado
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

        // Estados de Error de Validación (Aria Invalid)
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:ring-destructive/20",

        className,
      )}
      {...props}
    />
  );
}

export { Input };