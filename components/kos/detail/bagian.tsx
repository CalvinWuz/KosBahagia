import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

// Section wrapper shared by every block on the detail page.
export function Blok({ id, judul, keterangan, children, className }: { id: string; judul: string; keterangan?: string; children: ReactNode; className?: string }) {
  return (
    // scroll-mt clears the mobile detail header plus the section chips.
    <section id={id} aria-labelledby={`${id}-judul`} className={cn("scroll-mt-28 lg:scroll-mt-20", className)}>
      <h2 id={`${id}-judul`} className="text-h2 text-arang-900">{judul}</h2>
      {keterangan && <p className="mt-0.5 text-small text-arang-500">{keterangan}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Missing rubric data renders as this, never as an empty box or a guess. */
export function BelumDicatat({ className }: { className?: string }) {
  return <span className={cn("text-small text-arang-500 italic", className)}>Belum kami catat</span>;
}

/** Definition row: label left, value right. */
export function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-small text-arang-500">{label}</dt>
      <dd className="text-right text-small text-arang-900">{children ?? <BelumDicatat />}</dd>
    </div>
  );
}

/** 1–5 rubric score as five dots plus the number, and a word when the scale has one. */
export function Skala({ nilai, label, kata }: { nilai: number | null | undefined; label: string; kata?: string | null }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <span className="text-small text-arang-900">{label}</span>
      {nilai == null ? (
        <BelumDicatat />
      ) : (
        <span className="flex items-center gap-2" aria-label={`${label} ${nilai} dari 5${kata ? `, ${kata}` : ""}`}>
          {kata && <span className="text-micro font-bold text-arang-500">{kata}</span>}
          <span className="flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={cn("size-2.5 rounded-full", i <= nilai ? "bg-biru-500" : "bg-biru-100")} />
            ))}
          </span>
          <span className="w-8 text-right text-small font-bold text-arang-900 tabular-nums">{nilai}/5</span>
        </span>
      )}
    </div>
  );
}
