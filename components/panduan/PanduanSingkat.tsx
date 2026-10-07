"use client";

import { useState, type MouseEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lepasLapisAktif } from "@/lib/navigasi";
import { Button, buttonClasses } from "@/components/ui/Button";
import { IconClose, IconInfo } from "@/components/ui/Icon";
import { fokusSetelahPanduan, tandaiPanduanDibaca } from "@/lib/panduan";
import { LangkahPanduan } from "./LangkahPanduan";

const Sheet = dynamic(() => import("@/components/ui/Sheet").then((m) => m.Sheet));

// Homepage: the three steps inline, for a first visit. Never an overlay:
// the search box above keeps working, and "Mengerti" hides it for good on
// this device ([data-panduan-baru] + lib/panduan). Reopen from the menu,
// "Cara menggunakan".
export function PanduanSingkat({ fokusKe }: { fokusKe: string }) {
  const tutup = () => {
    tandaiPanduanDibaca();
    fokusSetelahPanduan(fokusKe);
  };
  return (
    <section data-panduan-baru aria-labelledby="panduan-judul" className="mx-auto w-full max-w-6xl px-4">
      <div className="rounded-2xl border border-biru-100 bg-kertas-50 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-micro font-bold text-biru-600">Baru di Kos Bahagia?</p>
            <h2 id="panduan-judul" className="mt-1 text-h2 text-arang-900">Tiga langkah singkat</h2>
          </div>
          <button
            type="button"
            onClick={tutup}
            aria-label="Tutup panduan singkat"
            className="grid size-11 shrink-0 place-items-center rounded-full text-arang-500 hover:bg-biru-100 hover:text-biru-600"
          >
            <IconClose />
          </button>
        </div>
        <LangkahPanduan ringkas className="mt-3" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={tutup}>Mengerti</Button>
          <Link href="/cara-menggunakan" className="text-small font-bold text-biru-600 hover:underline">Baca panduan lengkap</Link>
        </div>
      </div>
    </section>
  );
}

// /cari: one quiet line for a first visit (the results stay first). It opens
// the same three steps in a sheet, so the search and its filters stay put.
export function PetunjukPanduan({ fokusKe }: { fokusKe: string }) {
  const [buka, setBuka] = useState(false);
  const [pernahBuka, setPernahBuka] = useState(false);
  const router = useRouter();
  // After the sheet's own focus return (it would aim at the hidden opener).
  const selesai = () => {
    setBuka(false);
    tandaiPanduanDibaca();
    fokusSetelahPanduan(fokusKe, 400);
  };
  const sembunyikan = () => {
    tandaiPanduanDibaca();
    fokusSetelahPanduan(fokusKe);
  };
  // A link inside an open sheet: the sheet's history entry becomes the page.
  const keHalamanPanduan = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setBuka(false);
    lepasLapisAktif();
    router.replace("/cara-menggunakan");
  };
  return (
    <div data-panduan-baru className="mb-3 flex items-center gap-2 rounded-xl border border-biru-100 bg-kertas-50 py-1 pr-1 pl-3 text-small text-arang-900">
      <IconInfo className="size-4 shrink-0 text-biru-600" />
      <p className="min-w-0 flex-1">
        Baru di sini?{" "}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => {
            setPernahBuka(true);
            setBuka(true);
          }}
          className="sentuh relative rounded-sm font-bold text-biru-600 underline-offset-2 hover:underline"
        >
          Lihat cara pakai
        </button>
      </p>
      <button
        type="button"
        onClick={sembunyikan}
        aria-label="Sembunyikan petunjuk cara pakai"
        className="grid size-11 shrink-0 place-items-center rounded-full text-arang-500 hover:bg-biru-100 hover:text-biru-600"
      >
        <IconClose className="size-4" />
      </button>
      {pernahBuka && (
        <Sheet
          open={buka}
          onClose={() => setBuka(false)}
          title="Cara pakai Kos Bahagia"
          footer={
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={selesai}>Mengerti</Button>
              <Link href="/cara-menggunakan" onClick={keHalamanPanduan} className={buttonClasses({ variant: "ghost" })}>Panduan lengkap</Link>
            </div>
          }
        >
          <LangkahPanduan ringkas={false} />
        </Sheet>
      )}
    </div>
  );
}
