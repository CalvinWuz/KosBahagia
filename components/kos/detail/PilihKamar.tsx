"use client";

import { useRef, type KeyboardEvent } from "react";
import { formatRupiah } from "@/lib/format";
import { hitungBiaya, type TipeKamar } from "@/lib/biaya";
import { statusKamar } from "@/lib/kamar";
import { cn } from "@/lib/cn";

// Room-type picker. A radio group (one choice, arrow keys move between
// options) where each option already says its total and status, so picking
// never surprises. Used in the summary and in the cost block; both drive the
// same selection.
export function PilihKamar({
  tipeKamar,
  terpilihId,
  onPilih,
  dikonfirmasiPada,
  sekarang,
  label = "Tipe kamar",
  className,
}: {
  tipeKamar: Array<TipeKamar & { kamar_tersedia: number }>;
  terpilihId: string | null;
  onPilih: (id: string) => void;
  dikonfirmasiPada: string | null;
  sekarang: Date;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (tipeKamar.length < 2) return null;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const arah = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!arah) return;
    e.preventDefault();
    const i = tipeKamar.findIndex((t) => t.id === terpilihId);
    const berikut = tipeKamar[(i + arah + tipeKamar.length) % tipeKamar.length];
    onPilih(berikut.id);
    ref.current?.querySelector<HTMLButtonElement>(`[data-kamar="${berikut.id}"]`)?.focus();
  };

  return (
    <div ref={ref} role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {tipeKamar.map((t) => {
        const dipilih = t.id === terpilihId;
        const status = statusKamar(t, dikonfirmasiPada, sekarang);
        const biaya = hitungBiaya(t);
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={dipilih}
            tabIndex={dipilih || (!terpilihId && t === tipeKamar[0]) ? 0 : -1}
            data-kamar={t.id}
            onClick={() => onPilih(t.id)}
            className={cn(
              "flex min-h-11 flex-col items-start rounded-xl border-2 px-3 py-2 text-left transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500",
              // White in both states: the status colours keep 4.5:1 on white,
              // and the selection is carried by the border, ring and "Dipilih".
              dipilih ? "border-biru-500 bg-putih ring-2 ring-biru-500/30" : "border-biru-100 bg-putih hover:border-biru-500",
            )}
          >
            <span className="flex w-full items-start justify-between gap-2">
              <span className="text-small font-bold text-arang-900">{t.nama}</span>
              {dipilih && <span className="shrink-0 text-micro font-bold text-biru-600">Dipilih</span>}
            </span>
            <span className="text-small text-arang-900 tabular-nums">
              {formatRupiah(biaya.total)}/bln{biaya.estimasi ? " (estimasi)" : ""}
              {!biaya.lengkap ? " + biaya belum diketahui" : ""}
            </span>
            <span className={cn("text-micro font-bold", status.status === "tersedia" ? "text-daun-700" : status.status === "penuh" ? "text-merah-700" : "text-arang-500")}>
              {status.label}
              {status.status !== "penuh" ? `, ${status.rincian.charAt(0).toLowerCase()}${status.rincian.slice(1)}` : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
