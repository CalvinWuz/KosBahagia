import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// Shimmer placeholder. Always give it the same box as the content it stands
// in for (h-*, w-*, aspect-*) so nothing shifts when the real thing loads.
// Hidden from assistive tech; put aria-busy on the region that is loading.
export function Skeleton({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-lg bg-biru-100 bg-[linear-gradient(90deg,var(--color-biru-100)_25%,var(--color-putih)_50%,var(--color-biru-100)_75%)] bg-[length:200%_100%] motion-reduce:animate-none",
        className,
      )}
      {...rest}
    />
  );
}

/** A few text lines; the last one is shorter, like a real paragraph. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}
