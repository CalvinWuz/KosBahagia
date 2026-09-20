"use client";

import { buttonClasses } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/format";
import { catatKlikWa, linkWa, pesanWa, type SumberKlik } from "@/lib/wa";
import type { TipeKamar } from "@/lib/kos/detail";
import { cn } from "@/lib/cn";

// The one orange button on this page. A plain link so it works signed out
// and without JavaScript; the klik_wa row is fired, not awaited.
export function TombolChat({
  kosId,
  namaKos,
  whatsapp,
  kamar,
  className,
  variant = "primary",
  size = "lg",
  sumber = "detail" as SumberKlik,
}: {
  kosId: string;
  namaKos: string;
  whatsapp: string;
  kamar: TipeKamar | null;
  className?: string;
  /** "secondary" where several kos share a screen (compare table): orange stays singular. */
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  sumber?: SumberKlik;
}) {
  const href = linkWa(whatsapp, pesanWa({ namaKos, tipeKamar: kamar?.nama, totalBulanan: kamar?.total_bulanan ?? 0 }));
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => catatKlikWa(kosId, sumber)}
      className={buttonClasses({ variant, size, className })}
    >
      Chat pemilik
    </a>
  );
}

export function BarAksi({ kosId, namaKos, whatsapp, kamar, desktop = false }: { kosId: string; namaKos: string; whatsapp: string; kamar: TipeKamar | null; desktop?: boolean }) {
  const total = kamar?.total_bulanan ?? 0;
  return (
    <div
      className={cn(
        desktop
          ? "rounded-2xl border border-biru-100 bg-putih p-4"
          : "fixed inset-x-0 bottom-0 z-40 border-t border-biru-100 bg-putih px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
      )}
    >
      <div className={cn("flex items-center gap-3", desktop && "flex-col items-stretch")}>
        <div className="min-w-0 flex-1">
          <p className="text-h2 text-arang-900 tabular-nums">
            {formatRupiah(total)}
            <span className="ml-1 text-small font-normal text-arang-500">/bln</span>
          </p>
          <p className="text-micro text-arang-500">total sudah semua{kamar ? `, kamar ${kamar.nama}` : ""}</p>
        </div>
        <TombolChat kosId={kosId} namaKos={namaKos} whatsapp={whatsapp} kamar={kamar} className="shrink-0" />
      </div>
    </div>
  );
}
