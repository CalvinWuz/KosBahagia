"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { IconSearch } from "@/components/ui/Icon";
import { restSelect } from "@/lib/supabase/rest";
import { hrefCari } from "@/lib/cari-params";
import { lepasLapisAktif } from "@/lib/navigasi";
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

let cacheArea: AreaRingkas[] | null = null;

/** Popular areas for the sheet; fetched once per session when a caller has none. */
export function useAreaPopuler(awal?: AreaRingkas[]): AreaRingkas[] {
  const [area, setArea] = useState<AreaRingkas[]>(awal ?? cacheArea ?? []);
  useEffect(() => {
    if (awal?.length || cacheArea) return;
    let batal = false;
    restSelect("area_publik", { select: "slug,nama,tipe", order: "tipe,nama" }).then(({ data }) => {
      if (batal) return;
      cacheArea = (data ?? [])
        .filter((a) => a.slug && a.nama)
        .map((a) => ({ slug: a.slug as string, nama: a.nama as string, tipe: a.tipe ?? "" }));
      setArea(cacheArea);
    });
    return () => {
      batal = true;
    };
  }, [awal]);
  return area;
}

type Props = {
  open: boolean;
  onClose: () => void;
  areaPopuler?: AreaRingkas[];
  /** Override the default "go to the href" (e.g. /cari keeps its filters). */
  onPilih?: (item: PilihanCari) => void;
  title?: string;
};

// Full-screen search: input, live suggestions, recent searches, popular
// areas. Opened from the header, the /cari title and the homepage hero.
export function PencarianSheet({ open, onClose, areaPopuler, onPilih, title = "Cari kos" }: Props) {
  const router = useRouter();
  const idSaran = useId();
  const area = useAreaPopuler(areaPopuler);
  const { q, ubahQ, saran, memuat, aktif } = useSaranCari();
  const [riwayat, setRiwayat] = useState<PilihanCari[]>([]);
  // Re-read recent searches each time the sheet opens.
  const [bukaSebelumnya, setBukaSebelumnya] = useState(false);
  if (open !== bukaSebelumnya) {
    setBukaSebelumnya(open);
    if (open) setRiwayat(bacaRiwayat());
  }

  const pilih = (item: PilihanCari) => {
    simpanRiwayat(item);
    onClose();
    if (onPilih) return onPilih(item);
    // The sheet's history entry becomes the destination: back returns here.
    lepasLapisAktif();
    router.replace(item.href);
  };

  const kirim = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const kata = q.trim();
    if (!kata) return;
    if (aktif >= 0 && saran[aktif]) return pilih({ label: saran[aktif].nama, href: hrefSaran(saran[aktif]) });
    if (saran[0]?.jenis === "area") return pilih({ label: saran[0].nama, href: hrefSaran(saran[0]) });
    pilih({ label: kata, href: hrefCari({ q: kata }) });
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} penuh>
      <form role="search" onSubmit={kirim} className="flex gap-2">
        <label htmlFor={`${idSaran}-q`} className="sr-only">
          {PLACEHOLDER_CARI}
        </label>
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-biru-500" />
          <input
            id={`${idSaran}-q`}
            name="q"
            type="search"
            value={q}
            placeholder={PLACEHOLDER_CARI}
            autoComplete="off"
            autoFocus
            enterKeyHint="search"
            onChange={(e) => ubahQ(e.target.value)}
            className="h-12 w-full rounded-xl border-2 border-arang-500/30 bg-putih pr-4 pl-12 text-body text-arang-900 placeholder:text-arang-500 focus:border-biru-500 focus-visible:outline-none"
          />
        </div>
        <Button type="submit" variant="secondary" size="md" className="shrink-0">
          Cari
        </Button>
      </form>
      <div className="mt-4">
        <DaftarSaran
          id={idSaran}
          q={q}
          saran={saran}
          memuat={memuat}
          aktif={aktif}
          riwayat={riwayat}
          areaPopuler={area}
          onPilih={pilih}
          onHapusRiwayat={() => {
            hapusRiwayat();
            setRiwayat([]);
          }}
        />
      </div>
    </Sheet>
  );
}
