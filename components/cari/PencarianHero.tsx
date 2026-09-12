"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { IconJam, IconPin, IconSearch } from "@/components/ui/Icon";
import { supabaseBrowser } from "@/lib/supabase/client";
import { hrefCari } from "@/lib/cari-params";
import { cn } from "@/lib/cn";

export type AreaRingkas = { slug: string; nama: string; tipe: string };
type Saran = { jenis: string; slug: string; nama: string; keterangan: string | null };
type Riwayat = { label: string; href: string };

const KUNCI_RIWAYAT = "kb:riwayat-cari";
const PLACEHOLDER = "Cari area atau kampus";
const TIPE_AREA: Record<string, string> = { kampus: "Kampus", stasiun: "Stasiun", kecamatan: "Kecamatan" };

function bacaRiwayat(): Riwayat[] {
  try {
    const raw = localStorage.getItem(KUNCI_RIWAYAT);
    return raw ? (JSON.parse(raw) as Riwayat[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}
function simpanRiwayat(item: Riwayat) {
  try {
    const tanpaDuplikat = bacaRiwayat().filter((r) => r.href !== item.href);
    localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify([item, ...tanpaDuplikat].slice(0, 5)));
  } catch {
    // Storage unavailable (private mode). Nothing to do.
  }
}
function hrefSaran(s: Saran) {
  return s.jenis === "area" ? hrefCari({ area: s.slug }) : `/kos/${s.slug}`;
}

// The one search box on the homepage. Plain GET form so it works without
// JavaScript; with JavaScript it adds typeahead (desktop dropdown, mobile
// full-screen sheet), recent searches and popular areas.
export function PencarianHero({ areaPopuler }: { areaPopuler: AreaRingkas[] }) {
  const router = useRouter();
  const idSaran = useId();
  const [q, setQ] = useState("");
  const [saran, setSaran] = useState<Saran[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [bukaDesktop, setBukaDesktop] = useState(false);
  const [bukaSheet, setBukaSheet] = useState(false);
  const [aktif, setAktif] = useState(-1);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const wadah = useRef<HTMLDivElement>(null);
  // When the sheet closes, focus returns to the hero input; don't reopen.
  const abaikanFokus = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const permintaan = useRef(0);

  // Typeahead over area.nama and kos.nama, debounced 150 ms. Responses that
  // arrive after a newer keystroke are dropped.
  const ubahQ = (nilai: string) => {
    setQ(nilai);
    setAktif(-1);
    window.clearTimeout(timer.current);
    const kata = nilai.trim();
    if (kata.length < 2) {
      setSaran([]);
      setMemuat(false);
      return;
    }
    setMemuat(true);
    const nomor = ++permintaan.current;
    timer.current = window.setTimeout(async () => {
      const { data } = await supabaseBrowser().rpc("cari_saran", { q: kata, p_limit: 8 });
      if (nomor !== permintaan.current) return;
      setSaran((data as Saran[] | null) ?? []);
      setMemuat(false);
    }, 150);
  };

  const mobile = () => window.matchMedia("(max-width: 767px)").matches;
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
    if (mobile()) setBukaSheet(true);
    else setBukaDesktop(true);
  };

  const pilih = (item: Riwayat) => {
    simpanRiwayat(item);
    setRiwayat(bacaRiwayat());
    setBukaDesktop(false);
    tutupSheet();
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

  const daftar = (
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
        try {
          localStorage.removeItem(KUNCI_RIWAYAT);
        } catch {
          // ignore
        }
        setRiwayat([]);
      }}
    />
  );

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
            {PLACEHOLDER}
          </label>
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-biru-500" />
            <input
              id="q"
              name="q"
              type="search"
              value={q}
              placeholder={PLACEHOLDER}
              autoComplete="off"
              enterKeyHint="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={bukaDesktop}
              aria-controls={idSaran}
              aria-activedescendant={aktif >= 0 ? `${idSaran}-${aktif}` : undefined}
              onChange={(e) => ubahQ(e.target.value)}
              onFocus={fokusHero}
              onClick={() => mobile() && setBukaSheet(true)}
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
            {daftar}
          </div>
        )}
      </div>

      <Sheet open={bukaSheet} onClose={tutupSheet} title="Cari kos" penuh>
        <form action="/cari" method="get" role="search" onSubmit={kirim} className="flex gap-2">
          <label htmlFor="q-sheet" className="sr-only">
            {PLACEHOLDER}
          </label>
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-biru-500" />
            <input
              id="q-sheet"
              name="q"
              type="search"
              value={q}
              placeholder={PLACEHOLDER}
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
        <div className="mt-4">{daftar}</div>
      </Sheet>
    </>
  );
}

function DaftarSaran({
  id,
  q,
  saran,
  memuat,
  aktif,
  riwayat,
  areaPopuler,
  onPilih,
  onHapusRiwayat,
}: {
  id: string;
  q: string;
  saran: Saran[];
  memuat: boolean;
  aktif: number;
  riwayat: Riwayat[];
  areaPopuler: AreaRingkas[];
  onPilih: (item: Riwayat) => void;
  onHapusRiwayat: () => void;
}) {
  const kata = q.trim();

  if (kata.length < 2) {
    return (
      <div className="flex flex-col gap-4">
        {riwayat.length > 0 && (
          <Kelompok
            judul="Terakhir dicari"
            aksi={
              <button type="button" onClick={onHapusRiwayat} className="rounded-sm text-micro text-arang-500 hover:text-biru-600 hover:underline">
                Hapus
              </button>
            }
          >
            {riwayat.map((r) => (
              <ItemSaran key={r.href} ikon={<IconJam className="size-4" />} nama={r.label} onClick={() => onPilih(r)} />
            ))}
          </Kelompok>
        )}
        <Kelompok judul="Area populer">
          {areaPopuler.map((a) => (
            <ItemSaran
              key={a.slug}
              ikon={<IconPin className="size-4" />}
              nama={a.nama}
              keterangan={TIPE_AREA[a.tipe] ?? a.tipe}
              onClick={() => onPilih({ label: a.nama, href: hrefCari({ area: a.slug }) })}
            />
          ))}
        </Kelompok>
      </div>
    );
  }

  if (!memuat && saran.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 px-2 py-3">
        <p className="text-small text-arang-900">
          Belum ada area atau kos bernama “{kata}”.
        </p>
        <button
          type="button"
          onClick={() => onPilih({ label: kata, href: hrefCari({ q: kata }) })}
          className="rounded-sm text-small font-bold text-biru-600 hover:underline"
        >
          Cari “{kata}” di semua area
        </button>
      </div>
    );
  }

  return (
    <ul id={id} role="listbox" aria-label="Saran pencarian" aria-busy={memuat} className="flex flex-col">
      {saran.map((s, i) => (
        <li key={`${s.jenis}-${s.slug}`} id={`${id}-${i}`} role="option" aria-selected={i === aktif}>
          <ItemSaran
            ikon={<IconPin className="size-4" />}
            nama={s.nama}
            keterangan={s.keterangan ?? undefined}
            aktif={i === aktif}
            onClick={() => onPilih({ label: s.nama, href: hrefSaran(s) })}
          />
        </li>
      ))}
    </ul>
  );
}

function Kelompok({ judul, aksi, children }: { judul: string; aksi?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between px-2 pb-1">
        <h3 className="text-micro font-bold text-arang-500 uppercase">{judul}</h3>
        {aksi}
      </div>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

function ItemSaran({
  ikon,
  nama,
  keterangan,
  aktif = false,
  onClick,
}: {
  ikon: ReactNode;
  nama: string;
  keterangan?: string;
  aktif?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors duration-150 ease-out hover:bg-biru-100/60",
        aktif && "bg-biru-100",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-kertas-50 text-biru-600">{ikon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-arang-900">{nama}</span>
        {keterangan && <span className="block text-micro text-arang-500">{keterangan}</span>}
      </span>
    </button>
  );
}
