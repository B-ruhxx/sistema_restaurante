"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "./utils";

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </ScrollAreaPrimitive.Root>
  );
}

const ScrollAreaViewport = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Viewport
    ref={ref}
    data-slot="scroll-area-viewport"
    className={cn(
      "size-full rounded-[inherit] outline-none transition-shadow duration-200",
      "focus-visible:ring-2 focus-visible:ring-ring/20",
      className
    )}
    {...props}
  >
    {children}
  </ScrollAreaPrimitive.Viewport>
));
ScrollAreaViewport.displayName = ScrollAreaPrimitive.Viewport.displayName;

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none transition-colors duration-200 select-none p-0.5",
        orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border/80 transition-colors duration-200 hover:bg-muted-foreground/40 data-[state=visible]:animate-in"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollAreaViewport, ScrollBar };
