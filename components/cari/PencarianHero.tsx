"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icon";
import { hrefCari } from "@/lib/cari-params";
import {
  bacaRiwayat,
  DaftarSaran,
  hapusRiwayat,
  hrefSaran,
  PLACEHOLDER_CARI,
  simpanRiwayat,
  useSaranCari,
  type AreaRingkas,
  type PilihanCari,
} from "./saran";

export type { AreaRingkas } from "./saran";

const PencarianSheet = dynamic(() => import("./PencarianSheet").then((m) => m.PencarianSheet));

// The one search box on the homepage. Plain GET form so it works without
// JavaScript; with JavaScript it adds typeahead (desktop dropdown, mobile
// full-screen sheet), recent searches and popular areas.
export function PencarianHero({ areaPopuler }: { areaPopuler: AreaRingkas[] }) {
  const router = useRouter();
  const idSaran = useId();
  const { q, ubahQ, saran, memuat, aktif, setAktif } = useSaranCari();
  const [bukaDesktop, setBukaDesktop] = useState(false);
  const [bukaSheet, setBukaSheet] = useState(false);
  const [pernahBukaSheet, setPernahBukaSheet] = useState(false);
  const [riwayat, setRiwayat] = useState<PilihanCari[]>([]);
  const wadah = useRef<HTMLDivElement>(null);
  // When the sheet closes, focus returns to the hero input; don't reopen.
  const abaikanFokus = useRef(false);

  const mobile = () => window.matchMedia("(max-width: 767px)").matches;
  const bukaSheetMobile = () => {
    setPernahBukaSheet(true);
    setBukaSheet(true);
  };
  const tutupSheet = () => {
    abaikanFokus.current = true;
    setBukaSheet(false);
  };
  const fokusHero = () => {
    if (abaikanFokus.current) {
      abaikanFokus.current = false;
      return;
    }
    setRiwayat(bacaRiwayat());
    if (mobile()) bukaSheetMobile();
    else setBukaDesktop(true);
  };

  const pilih = (item: PilihanCari) => {
    simpanRiwayat(item);
    setRiwayat(bacaRiwayat());
    setBukaDesktop(false);
    router.push(item.href);
  };

  const kirim = (e: FormEvent<HTMLFormElement>) => {
    const kata = q.trim();
    if (!kata) {
      e.preventDefault();
      return;
    }
    if (aktif >= 0 && saran[aktif]) {
      e.preventDefault();
      pilih({ label: saran[aktif].nama, href: hrefSaran(saran[aktif]) });
      return;
    }
    // Let the native GET submit proceed; just remember it first.
    simpanRiwayat({ label: kata, href: hrefCari({ q: kata }) });
  };

  const navigasiKeyboard = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && saran.length) {
      e.preventDefault();
      setAktif((i) => (i + 1) % saran.length);
      setBukaDesktop(true);
    } else if (e.key === "ArrowUp" && saran.length) {
      e.preventDefault();
      setAktif((i) => (i <= 0 ? saran.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setBukaDesktop(false);
      setAktif(-1);
    }
  };

  return (
    <>
      <div
        ref={wadah}
        className="relative"
        onBlur={(e) => {
          if (!wadah.current?.contains(e.relatedTarget as Node | null)) setBukaDesktop(false);
        }}
      >
        <form action="/cari" method="get" role="search" onSubmit={kirim} className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            {PLACEHOLDER_CARI}
          </label>
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-biru-500" />
            <input
              id="q"
              name="q"
              type="search"
              value={q}
              placeholder={PLACEHOLDER_CARI}
              autoComplete="off"
              enterKeyHint="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={bukaDesktop}
              aria-controls={idSaran}
              aria-activedescendant={aktif >= 0 ? `${idSaran}-${aktif}` : undefined}
              onChange={(e) => ubahQ(e.target.value)}
              onFocus={fokusHero}
              onClick={() => mobile() && bukaSheetMobile()}
              onKeyDown={navigasiKeyboard}
              className="h-13 w-full rounded-2xl border-2 border-putih bg-putih pr-3 pl-11 text-body text-arang-900 shadow-sm placeholder:text-arang-500 focus:border-biru-500 focus-visible:outline-none"
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="shrink-0 px-4 sm:px-6">
            Cari
          </Button>
        </form>

        {bukaDesktop && (
          <div className="absolute inset-x-0 top-full z-30 mt-2 hidden rounded-2xl border border-biru-100 bg-putih p-2 shadow-xl md:block">
            <DaftarSaran
              id={idSaran}
              q={q}
              saran={saran}
              memuat={memuat}
              aktif={aktif}
              riwayat={riwayat}
              areaPopuler={areaPopuler}
              onPilih={pilih}
              onHapusRiwayat={() => {
                hapusRiwayat();
                setRiwayat([]);
              }}
            />
          </div>
        )}
      </div>

      {pernahBukaSheet && <PencarianSheet open={bukaSheet} onClose={tutupSheet} areaPopuler={areaPopuler} />}
    </>
  );
}
