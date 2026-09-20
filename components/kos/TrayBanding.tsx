"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { IconBanding, IconClose } from "@/components/ui/Icon";
import { hapusBanding, useBanding, MAKS_BANDING } from "@/lib/simpan";
import { cn } from "@/lib/cn";

// Floating "2 kos dibandingkan · Bandingkan" bar. Appears as soon as the
// tray has something in it, on every renter page except /banding itself.
// Sits above the sticky chat bar on the detail page.
export function TrayBanding() {
  const tray = useBanding();
  const pathname = usePathname();
  const [ditutup, setDitutup] = useState<string | null>(null);
  const kunci = tray.map((b) => b.id).join(",");

  if (tray.length === 0 || pathname.startsWith("/banding") || ditutup === kunci) return null;
  const diDetail = pathname.startsWith("/kos/");
  const href = `/banding?kos=${tray.map((b) => b.slug || b.id).join(",")}`;

  return (
    <div
      role="region"
      aria-label="Perbandingan"
      className={cn(
        "fixed inset-x-0 z-30 flex justify-center px-4 motion-safe:animate-muncul",
        diDetail ? "bottom-[6.5rem] lg:bottom-4" : "bottom-4",
      )}
    >
      <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-biru-100 bg-putih p-2 pl-3 shadow-xl">
        <IconBanding className="size-5 shrink-0 text-biru-600" />
        <div className="min-w-0 flex-1">
          <p className="text-small font-bold text-arang-900 tabular-nums">
            {tray.length} dari {MAKS_BANDING} kos dibandingkan
          </p>
          <ul className="flex gap-1 overflow-x-auto text-micro text-arang-500 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tray.map((b) => (
              <li key={b.id} className="flex shrink-0 items-center gap-0.5">
                <span className="max-w-28 truncate">{b.nama || "Kos"}</span>
                <button type="button" onClick={() => hapusBanding(b.id)} aria-label={`Keluarkan ${b.nama || "kos"} dari perbandingan`} className="grid size-5 place-items-center rounded-full hover:bg-biru-100 hover:text-biru-600">
                  <IconClose className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        {tray.length >= 2 ? (
          <Link href={href} className={buttonClasses({ variant: "secondary", size: "sm", className: "shrink-0" })}>
            Bandingkan
          </Link>
        ) : (
          <span className="shrink-0 text-micro text-arang-500">Pilih 1 lagi</span>
        )}
        <button type="button" onClick={() => setDitutup(kunci)} aria-label="Sembunyikan" className="grid size-9 shrink-0 place-items-center rounded-full text-arang-500 hover:bg-biru-100 hover:text-biru-600">
          <IconClose className="size-4" />
        </button>
      </div>
    </div>
  );
}
