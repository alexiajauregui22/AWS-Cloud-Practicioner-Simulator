import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  marker,
  className,
  tone = "gilt",
  label,
}: {
  value: number; // 0..1
  marker?: number; // 0..1, línea de referencia (ej. 700)
  className?: string;
  tone?: "gilt" | "wine";
  label?: string;
}) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(v * 100)}
      className={cn("relative h-1.5 w-full overflow-visible rounded-full bg-ivory/10", className)}
      role="progressbar"
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-soft)]",
          tone === "gilt" ? "bg-gradient-to-r from-gilt to-gilt-pale" : "bg-gradient-to-r from-wine to-wine-soft"
        )}
        style={{ width: `${v * 100}%` }}
      />
      {marker !== undefined ? (
        <span className="absolute -top-1 h-3.5 w-px bg-ivory/70" style={{ left: `${marker * 100}%` }} />
      ) : null}
    </div>
  );
}
