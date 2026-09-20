"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/cn";

// Put inside a <Link>. While that link's page is loading it draws a thin
// progress bar at the top of the viewport and, optionally, a veil over the
// nearest positioned ancestor (the card that was tapped). On a fast
// connection it never appears; on 3G it answers "did my tap register?".
export function StatusTaut({ selubung = false }: { selubung?: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <>
      <span role="progressbar" aria-label="Memuat halaman" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-biru-100">
        <span className="block h-full w-1/4 rounded-full bg-biru-500 motion-safe:animate-progres motion-reduce:w-full" />
      </span>
      {selubung && <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 z-10 rounded-2xl bg-putih/50")} />}
    </>
  );
}
