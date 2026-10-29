import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gilt text-abyss hover:bg-gilt-pale shadow-[0_0_0_1px_rgba(240,208,96,0.5),0_10px_30px_-12px_rgba(201,162,39,0.7)]",
  ghost: "border border-hairline-strong text-ivory hover:bg-gilt/10 hover:border-gilt",
  quiet: "text-mist hover:text-ivory hover:bg-ivory/5",
  danger: "border border-wine-soft/40 text-wine-soft hover:bg-wine/40",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-[14px]",
  lg: "h-13 px-7 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold tracking-[0.01em] transition-[background,color,border,transform] duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      ref={ref}
      type={type}
      {...props}
    />
  )
);
Button.displayName = "Button";
