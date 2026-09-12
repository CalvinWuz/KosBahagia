import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconCheck } from "./Icon";

export type ChipProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "aria-pressed"
> & {
  selected?: boolean;
  children: ReactNode;
};

// Toggleable filter pill. Selection is announced via aria-pressed and shown
// with a check mark, so it never relies on colour alone.
export function Chip({
  selected = false,
  className,
  children,
  ...rest
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-small font-medium whitespace-nowrap select-none transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500 disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-biru-500 bg-biru-100 font-bold text-biru-600"
          : "border-arang-500/30 bg-putih text-arang-900 hover:border-biru-500 hover:bg-biru-100/50",
        className,
      )}
      {...rest}
    >
      {selected && <IconCheck className="size-4" />}
      {children}
    </button>
  );
}
