"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";

import { cn } from "./utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "aspect-square size-4 shrink-0 rounded-full border border-input bg-background text-primary shadow-xs outline-none cursor-pointer transition-all duration-200",
        // Estados Interactivos (Hover y Foco)
        "hover:border-accent-foreground/30",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/20",
        // Estado Deshabilitado
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Estados de Error de Validación (Aria Invalid)
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        "focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  );
}

function RadioGroupIndicator({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Indicator>) {
  return (
    <RadioGroupPrimitive.Indicator
      data-slot="radio-group-indicator"
      className={cn("flex items-center justify-center size-full", className)}
      {...props}
    >
      <CircleIcon className="size-2 fill-current text-current" />
    </RadioGroupPrimitive.Indicator>
  );
}

export { RadioGroup, RadioGroupItem, RadioGroupIndicator };