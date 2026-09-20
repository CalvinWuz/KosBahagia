import { cn } from "@/lib/cn";

// Brand mark: a house with a smile. Inherits `currentColor`, so the parent
// decides the colour (biru on the user surface, arang on mitra).
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      {/* Roof apex and eaves are rounded so the mark reads soft at 24px. */}
      <path
        d="M4.6 13.6 15.1 4.7a1.4 1.4 0 0 1 1.8 0l10.5 8.9V26.4A1.6 1.6 0 0 1 25.8 28H6.2a1.6 1.6 0 0 1-1.6-1.6z"
        className="fill-current"
      />
      <path
        d="M11.2 19.2c1.4 2.1 3 3.1 4.8 3.1s3.4-1 4.8-3.1"
        className="stroke-putih"
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
