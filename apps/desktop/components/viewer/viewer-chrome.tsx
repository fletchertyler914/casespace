import { cn } from "@/lib/utils";

/** Vertical rule between viewer header control groups. */
export function ViewerChromeDivider({ className }: { className?: string }) {
  return (
    <span
      className={cn("mx-1 h-5 w-px shrink-0 bg-border/50", className)}
      aria-hidden
    />
  );
}
