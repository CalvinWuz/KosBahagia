"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconBanding, IconHati, IconInfo, IconMenu, IconSearch } from "@/components/ui/Icon";
import { lepasLapisAktif, useHrefCariTerakhir } from "@/lib/navigasi";
import { MAKS_BANDING, useBanding, useSimpanan } from "@/lib/simpan";
import { cn } from "@/lib/cn";

const Sheet = dynamic(() => import("@/components/ui/Sheet").then((m) => m.Sheet));

// The renter's main menu: Cari kos, Simpanan, Bandingkan, Cara menggunakan.
// Desktop shows it inline in the global header; phones get one labelled
// "Menu" button (in the global header and in the /cari and /kos top bars,
// which replace the global header on phones) that opens the same links in a
// sheet. Links navigate, buttons open; nothing here touches saved items or
// filters. Owner pages are reached only through the footer, as before.

type Item = { id: "cari" | "simpanan" | "banding" | "panduan"; href: string; label: string; ikon: ReactNode };

function useItem(): Array<Item & { jumlah: number; aktif: boolean; keterangan: string }> {
  const pathname = usePathname();
  const hrefCari = useHrefCariTerakhir();
  const simpan = useSimpanan().length;
  const banding = useBanding().length;
  return [
    {
      id: "cari",
      href: hrefCari,
      label: "Cari kos",
      ikon: <IconSearch className="size-5" />,
      jumlah: 0,
      aktif: pathname.startsWith("/cari"),
      keterangan: hrefCari !== "/cari" ? "Lanjutkan pencarian terakhir di tab ini" : "Cari berdasarkan area atau kampus",
    },
    {
      id: "simpanan",
      href: "/disimpan",
      label: "Simpanan",
      ikon: <IconHati className="size-5" />,
      jumlah: simpan,
      aktif: pathname.startsWith("/disimpan"),
      keterangan: simpan > 0 ? `${simpan} kos tersimpan di perangkat ini` : "Belum ada. Tekan Simpan di kartu kos.",
    },
    {
      id: "banding",
      href: "/banding",
      label: "Bandingkan",
      ikon: <IconBanding className="size-5" />,
      jumlah: banding,
      aktif: pathname.startsWith("/banding"),
      keterangan: banding > 0 ? `${banding} dari ${MAKS_BANDING} kos dipilih` : "Belum ada. Tekan Bandingkan di kartu kos.",
    },
    {
      id: "panduan",
      href: "/cara-menggunakan",
      label: "Cara menggunakan",
      ikon: <IconInfo className="size-5" />,
      jumlah: 0,
      aktif: pathname.startsWith("/cara-menggunakan"),
      keterangan: "Tiga langkah singkat",
    },
  ];
}

function Angka({ n, className }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span aria-hidden="true" className={cn("grid min-w-4.5 place-items-center rounded-full bg-biru-500 px-1 text-[0.625rem] leading-4 font-bold text-putih tabular-nums", className)}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

/** Desktop: the four links inline, current page marked. */
export function NavUtama({ className }: { className?: string }) {
  const item = useItem();
  return (
    <nav aria-label="Menu utama" className={className}>
      <ul className="flex items-center gap-1">
        {item.map((i) => (
          <li key={i.id}>
            <Link
              href={i.href}
              aria-current={i.aktif ? "page" : undefined}
              aria-label={i.jumlah > 0 ? `${i.label}, ${i.jumlah}` : undefined}
              className={cn(
                "relative inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-small font-bold transition-colors duration-150 ease-out hover:bg-biru-100 hover:text-biru-600",
                i.aktif ? "bg-biru-100 text-biru-600" : "text-arang-900",
              )}
            >
              <span className="relative text-biru-600">
                {i.ikon}
                <Angka n={i.jumlah} className="absolute -top-1.5 -right-2" />
              </span>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Phones: a labelled "Menu" button opening the same links in a sheet. `tumpuk` puts the label under the icon (tight top bars). */
export function TombolMenu({ className, tumpuk = false }: { className?: string; tumpuk?: boolean }) {
  const [buka, setBuka] = useState(false);
  const [pernahBuka, setPernahBuka] = useState(false);
  const item = useItem();
  const router = useRouter();
  const total = item.find((i) => i.id === "simpanan")!.jumlah + item.find((i) => i.id === "banding")!.jumlah;

  const pergi = (e: MouseEvent<HTMLAnchorElement>, href: string, aktif = false) => {
    // Let the browser handle new-tab clicks.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setBuka(false);
    if (aktif) return;
    // The sheet's history entry becomes the destination: back returns here.
    lepasLapisAktif();
    router.replace(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPernahBuka(true);
          setBuka(true);
        }}
        aria-haspopup="dialog"
        className={cn(
          "relative inline-flex shrink-0 items-center font-bold text-arang-900 transition-colors duration-150 ease-out hover:bg-biru-100 hover:text-biru-600",
          tumpuk ? "h-12 min-w-14 flex-col justify-center gap-0.5 rounded-xl px-1.5 text-micro" : "h-11 gap-1.5 rounded-full px-3 text-small",
          className,
        )}
      >
        <span className="relative">
          <IconMenu className="size-5" />
          <Angka n={total} className="absolute -top-1.5 -right-2" />
        </span>
        Menu
      </button>
      {pernahBuka && (
        <Sheet open={buka} onClose={() => setBuka(false)} title="Menu">
          <nav aria-label="Menu utama">
            <ul className="flex flex-col gap-2">
              {item.map((i) => (
                <li key={i.id}>
                  <Link
                    href={i.href}
                    onClick={(e) => pergi(e, i.href, i.aktif)}
                    aria-current={i.aktif ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 items-center gap-3 rounded-xl border px-4 py-2 transition-colors duration-150 ease-out hover:border-biru-500 hover:bg-biru-100/50",
                      i.aktif ? "border-biru-500 bg-biru-100/60" : "border-biru-100 bg-putih",
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-biru-100 text-biru-600">{i.ikon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-bold text-arang-900">
                        {i.label}
                        {i.aktif && <span className="ml-2 text-micro font-bold text-biru-600">Halaman ini</span>}
                      </span>
                      <span className="block text-small text-arang-500">{i.keterangan}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-small text-arang-500">
              Simpanan dan perbandingan tersimpan di perangkat ini, tanpa akun.{" "}
              <Link href="/cara-kami-menilai" onClick={(e) => pergi(e, "/cara-kami-menilai")} className="font-bold text-biru-600 hover:underline">
                Cara kami menilai
              </Link>
            </p>
          </nav>
        </Sheet>
      )}
    </>
  );
}
