import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

export interface SegOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  hint?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
  className?: string;
  label: string;
}) {
  const id = useId();
  return (
    <div aria-label={label} className={cn("inline-flex flex-wrap gap-1 rounded-full border border-hairline bg-abyss/50 p-1", className)} role="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            aria-checked={on}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
              on ? "text-abyss" : "text-mist hover:text-ivory",
              o.disabled && "cursor-not-allowed opacity-40 hover:text-mist"
            )}
            disabled={o.disabled}
            key={o.value}
            onClick={() => onChange(o.value)}
            role="radio"
            title={o.hint}
            type="button"
          >
            {on ? (
              <motion.span
                className="absolute inset-0 rounded-full bg-gilt"
                layoutId={`seg-${id}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
