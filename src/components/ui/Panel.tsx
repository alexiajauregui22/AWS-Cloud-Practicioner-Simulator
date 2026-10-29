import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Superficie principal. `tone="inset"` para bloques anidados. */
export function Panel({
  className,
  tone = "surface",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: "surface" | "inset" }) {
  return (
    <div
      className={cn(
        tone === "surface" ? "surface rounded-[var(--radius-panel)]" : "inset rounded-[var(--radius-tile)]",
        className
      )}
      {...props}
    />
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-[26px] leading-none">{children}</h2>
      {aside}
    </div>
  );
}
