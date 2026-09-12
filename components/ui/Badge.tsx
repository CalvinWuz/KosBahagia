import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "netral" | "baik" | "peringatan" | "bahaya";

const tones: Record<BadgeTone, string> = {
  netral: "bg-biru-100 text-biru-600",
  baik: "bg-daun-100 text-daun-700",
  peringatan: "bg-arang-500/10 text-arang-900",
  bahaya: "bg-merah-100 text-merah-700",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  /** Optional leading icon, e.g. a check for "Terverifikasi". */
  icon?: ReactNode;
  children: ReactNode;
};

// Small status label: "Tersedia", "Perlu dikonfirmasi", "Penuh".
export function Badge({
  tone = "netral",
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-bold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
