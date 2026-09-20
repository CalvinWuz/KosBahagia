"use client";

import { useRef, useState, type ReactNode } from "react";
import { IconJam, IconPin } from "@/components/ui/Icon";
import { restRpc } from "@/lib/supabase/rest";
import { hrefCari } from "@/lib/cari-params";
import { cn } from "@/lib/cn";

// Typeahead state and list shared by the homepage hero (desktop dropdown)
// and the search sheet (header, /cari title, homepage on mobile).

export type AreaRingkas = { slug: string; nama: string; tipe: string };
export type Saran = { jenis: string; slug: string; nama: string; keterangan: string | null };
export type PilihanCari = { label: string; href: string };

export const KUNCI_RIWAYAT = "kb:riwayat-cari";
export const PLACEHOLDER_CARI = "Cari area atau kampus";
const TIPE_AREA: Record<string, string> = { kampus: "Kampus", stasiun: "Stasiun", kecamatan: "Kecamatan" };

export function bacaRiwayat(): PilihanCari[] {
  try {
    const raw = localStorage.getItem(KUNCI_RIWAYAT);
    return raw ? (JSON.parse(raw) as PilihanCari[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}
export function simpanRiwayat(item: PilihanCari) {
  try {
    const tanpaDuplikat = bacaRiwayat().filter((r) => r.href !== item.href);
    localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify([item, ...tanpaDuplikat].slice(0, 5)));
  } catch {
    // Storage unavailable (private mode). Nothing to do.
  }
}
export function hapusRiwayat() {
  try {
    localStorage.removeItem(KUNCI_RIWAYAT);
  } catch {
    // ignore
  }
}
export function hrefSaran(s: Saran) {
  return s.jenis === "area" ? hrefCari({ area: s.slug }) : `/kos/${s.slug}`;
}

/** Debounced typeahead over area.nama and kos.nama; stale responses are dropped. */
export function useSaranCari() {
  const [q, setQ] = useState("");
  const [saran, setSaran] = useState<Saran[]>([]);
  const [memuat, setMemuat] = useState(false);
  const [aktif, setAktif] = useState(-1);
  const timer = useRef<number | undefined>(undefined);
  const permintaan = useRef(0);

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
      const { data } = await restRpc("cari_saran", { q: kata, p_limit: 8 });
      if (nomor !== permintaan.current) return;
      setSaran((data as Saran[] | null) ?? []);
      setMemuat(false);
    }, 150);
  };

  return { q, ubahQ, saran, memuat, aktif, setAktif };
}

export function DaftarSaran({
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
  riwayat: PilihanCari[];
  areaPopuler: AreaRingkas[];
  onPilih: (item: PilihanCari) => void;
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
          {areaPopuler.length === 0 && <li className="px-2 py-2 text-small text-arang-500">Memuat area…</li>}
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
        <h3 className="text-micro font-bold text-arang-500">{judul}</h3>
        {aksi}
      </div>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

export function ItemSaran({
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
