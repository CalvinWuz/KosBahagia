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
      <path
        d="M4 14 16 4l12 10v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
        className="fill-current"
      />
      <path
        d="M11 19c1.5 2 3.2 3 5 3s3.5-1 5-3"
        className="stroke-putih"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
