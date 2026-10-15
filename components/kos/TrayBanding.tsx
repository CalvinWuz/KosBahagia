"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { IconBanding, IconClose } from "@/components/ui/Icon";
import { hapusBanding, useBanding, MAKS_BANDING } from "@/lib/simpan";
import { hrefBanding } from "@/lib/kos/kunci-banding";
import { useTinggiBawah } from "@/lib/ruang-bawah";

// Floating "2 dari 3 dibandingkan · Bandingkan" bar. Appears as soon as the
// tray has something in it, on every renter page except /banding itself.
// It sits above the detail page's chat bar and publishes its own height, so
// the toast stacks above it and the phone map ends above it
// (lib/ruang-bawah.ts). A spacer of the same height is added to the page
// flow so it never covers the last content.
export function TrayBanding() {
  const tray = useBanding();
  const pathname = usePathname();
  const [ditutup, setDitutup] = useState<string | null>(null);
  const kunci = tray.map((b) => `${b.id}:${b.kamarId ?? ""}`).join(",");
  const tampil = !(tray.length === 0 || pathname.startsWith("/banding") || ditutup === kunci);

  if (!tampil) return null;
  const href = hrefBanding(tray.map((b) => ({ kos: b.slug || b.id, kamar: b.kamarId })));

  return (
    <>
      <div aria-hidden="true" style={{ height: "calc(var(--tinggi-tray, 0px) + 1rem)" }} />
      <BingkaiTray>
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-biru-100 bg-putih p-2 pl-3 shadow-xl">
          <IconBanding className="size-5 shrink-0 text-biru-600" />
          <div className="min-w-0 flex-1">
            <p className="text-small font-bold text-arang-900 tabular-nums">
              {tray.length} dari {MAKS_BANDING} dibandingkan
            </p>
            <ul className="flex gap-2 overflow-x-auto text-micro text-arang-500 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tray.map((b) => {
                const nama = `${b.nama || "Kos"}${b.kamarNama ? `, ${b.kamarNama}` : ""}`;
                return (
                  <li key={`${b.id}:${b.kamarId ?? ""}`} className="flex shrink-0 items-center gap-0.5">
                    <span className="max-w-32 truncate" title={nama}>{nama}</span>
                    <button
                      type="button"
                      onClick={() => hapusBanding(b)}
                      aria-label={`Keluarkan ${nama} dari perbandingan`}
                      className="sentuh relative grid size-6 place-items-center rounded-full hover:bg-biru-100 hover:text-biru-600"
                    >
                      <IconClose className="size-3" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          {tray.length >= 2 ? (
            <Link href={href} className={buttonClasses({ variant: "secondary", size: "sm", className: "shrink-0" })}>
              Bandingkan
            </Link>
          ) : (
            <span className="shrink-0 text-micro text-arang-500">Tambah 1 kos lagi</span>
          )}
          <button type="button" onClick={() => setDitutup(kunci)} aria-label="Sembunyikan panel perbandingan" className="sentuh relative grid size-9 shrink-0 place-items-center rounded-full text-arang-500 hover:bg-biru-100 hover:text-biru-600">
            <IconClose className="size-4" />
          </button>
        </div>
      </BingkaiTray>
    </>
  );
}

// The fixed frame. Its top padding (the same 0.75rem as the gap below it) is
// the space to the toast above and to the end of the phone map, so the
// measured height already includes it; only the tray itself takes taps.
function BingkaiTray({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useTinggiBawah(ref, "--tinggi-tray");
  return (
    <div ref={ref} role="region" aria-label="Perbandingan" className="di-atas-bar-aksi pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4 pt-3 motion-safe:animate-muncul">
      {children}
    </div>
  );
}
