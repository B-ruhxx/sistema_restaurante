"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "./utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-px items-center justify-center bg-border outline-none transition-all duration-200",
        // Zona de interacción extendida (Hitbox invisible para el mouse)
        "after:absolute after:inset-y-0 after:left-1/2 after:w-2 after:-translate-x-1/2 after:cursor-col-resize",
        // Estados de enfoque por teclado
        "focus-visible:z-50 focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:ring-offset-0",
        // Ajustes para orientación Vertical
        "data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:h-2 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:cursor-row-resize",
        "data-[panel-group-direction=vertical]:hover:bg-primary/50 data-[panel-group-direction=vertical]:data-[resize-handle-state=drag]:bg-primary",
        // Estado activo o en arrastre (Hover & Dragging)
        "hover:bg-primary/50 data-[resize-handle-state=drag]:bg-primary",
        "&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      {...props}
    />
  );
}

interface ResizableHandleGripProps extends React.ComponentProps<"div"> { }

function ResizableHandleGrip({ className, ...props }: ResizableHandleGripProps) {
  return (
    <div
      className={cn(
        "z-50 flex h-5 w-3.5 items-center justify-center rounded-sm border border-border bg-background shadow-xs pointer-events-none transition-colors",
        className
      )}
      {...props}
    >
      <GripVerticalIcon className="size-2.5 text-muted-foreground/80" />
    </div>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle, ResizableHandleGrip };