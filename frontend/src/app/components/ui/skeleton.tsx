import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-muted/60 rounded-md transition-colors",
        // Animación fluida con soporte para accesibilidad
        "animate-pulse motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };