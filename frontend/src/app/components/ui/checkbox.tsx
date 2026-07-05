"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "./utils";

type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input bg-background shadow-xs transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current data-[state=checked]:animate-in data-[state=checked]:fade-in-0 data-[state=checked]:zoom-in-75 duration-100"
      >
        <CheckIcon className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
