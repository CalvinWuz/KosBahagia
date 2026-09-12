import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconSpinner } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold select-none transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500 disabled:cursor-not-allowed disabled:opacity-50";

// Primary is the one orange element allowed per screen. Text is arang-900
// rather than white because white on jingga-500 is only 2.6:1.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-jingga-500 text-arang-900 hover:bg-jingga-500/90 active:bg-jingga-500/80",
  secondary:
    "border-2 border-biru-500 bg-putih text-biru-600 hover:bg-biru-100 active:bg-biru-100/70",
  ghost: "bg-transparent text-biru-600 hover:bg-biru-100 active:bg-biru-100/70",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-small font-bold",
  md: "h-11 px-4 text-body font-bold",
  lg: "h-13 px-6 text-body font-bold",
};

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

/** Class string only — use on <Link> when a link should look like a button. */
export function buttonClasses({
  variant = "secondary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleOptions & {
    /** Shows a spinner, keeps the width, and blocks further clicks. */
    loading?: boolean;
    children: ReactNode;
  };

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <IconSpinner className="size-5 animate-spin motion-reduce:animate-none" />
          <span className="sr-only">Memuat</span>
        </span>
      )}
      <span
        className={cn("inline-flex items-center gap-2", loading && "invisible")}
      >
        {children}
      </span>
    </button>
  );
}
