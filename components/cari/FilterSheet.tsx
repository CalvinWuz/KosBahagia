"use client";

import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { formatRupiah } from "@/lib/format";
import { bacaRupiah, tampilRupiahInput, tanpaFilter, toggleTipe, validasiRentangHarga, TIPE_KOS, type CariParams, type TipeKosParam } from "@/lib/cari-params";
import { PILIHAN_KEBERSIHAN, PILIHAN_KEDAP } from "@/lib/skala";
import { cn } from "@/lib/cn";
import { FASILITAS_KAMAR, SLUG_KAMAR, namaFasilitas, type FasilitasFilter } from "@/lib/cari/fasilitas";
import { FilterAktif } from "./FilterAktif";

export type { FasilitasFilter };
type Ubah = (ubah: (p: CariParams) => CariParams) => void;

const HARGA_CEPAT = [1_000_000, 1_500_000, 2_000_000, 3_000_000];
const LABEL_TIPE: Record<TipeKosParam, string> = { putra: "Putra", putri: "Putri", campur: "Campur" };

// The full filter set. Every control applies immediately (no Apply button);
// the primary button only closes the sheet and reads the live count. The
// parent applies changes with replaceState while the sheet is open, so one
// sheet session is one history step; hrefTerakhir keeps it on back-close.
// Every choice is worded as what the renter wants (no "hide …" negatives),
// and each one has exactly one control here; the quick chips above the
// results write the same values.
export function FilterSheet({
  open,
  onClose,
  params,
  total,
  memuat,
  fasilitas,
  terapkan,
  hrefTerakhir,
  pertahankan,
}: {
  open: boolean;
  onClose: () => void;
  params: CariParams;
  total: number;
  memuat: boolean;
  fasilitas: FasilitasFilter[];
  terapkan: Ubah;
  hrefTerakhir?: string;
  pertahankan?: () => boolean;
}) {
  const fas = new Set(params.fasilitas ?? []);

  // Price boxes keep what was typed. A value is applied only when both boxes
  // read as numbers and the minimum is not above the maximum; otherwise the
  // error sits under the box and the search is left as it was.
  const [teksMin, setTeksMin] = useState(tampilRupiahInput(params.harga_min));
  const [teksMax, setTeksMax] = useState(tampilRupiahInput(params.harga_max));
  const [galat, setGalat] = useState<{ min?: string; max?: string }>({});
  const [hargaUrl, setHargaUrl] = useState({ min: params.harga_min, max: params.harga_max });
  // Follow changes made elsewhere (chips, "Hapus semua", back button) but
  // never overwrite a box the renter is still typing in.
  if (hargaUrl.min !== params.harga_min || hargaUrl.max !== params.harga_max) {
    setHargaUrl({ min: params.harga_min, max: params.harga_max });
    if (hargaUrl.min !== params.harga_min && bacaRupiah(teksMin).nilai !== params.harga_min) {
      setTeksMin(tampilRupiahInput(params.harga_min));
      setGalat((g) => ({ ...g, min: undefined }));
    }
    if (hargaUrl.max !== params.harga_max && bacaRupiah(teksMax).nilai !== params.harga_max) {
      setTeksMax(tampilRupiahInput(params.harga_max));
      setGalat((g) => ({ ...g, max: undefined }));
    }
  }
  const refMin = useRef<HTMLInputElement>(null);
  const refMax = useRef<HTMLInputElement>(null);

  const terapkanHarga = (min: string, max: string) => {
    const a = bacaRupiah(min);
    const b = bacaRupiah(max);
    const rentang = !a.galat && !b.galat ? validasiRentangHarga(a.nilai, b.nilai) : null;
    const baru = { min: a.galat ?? rentang?.pesan, max: b.galat };
    setGalat(baru);
    if (baru.min || baru.max) return;
    setTeksMin(tampilRupiahInput(a.nilai));
    setTeksMax(tampilRupiahInput(b.nilai));
    terapkan((p) => ({ ...p, harga_min: a.nilai, harga_max: b.nilai }));
  };
  const adaGalat = Boolean(galat.min || galat.max);
  const fokusGalat = () => (galat.min ? refMin : refMax).current?.focus();

  const toggleFasilitas = (slug: string) =>
    terapkan((p) => {
      const set = new Set(p.fasilitas ?? []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      return { ...p, fasilitas: [...set] };
    });
  const tipe = new Set(params.tipe ?? []);
  const lainnya = fasilitas.filter((f) => !SLUG_KAMAR.has(f.slug));
  const kelompokLain = [
    { judul: "Di kamar", isi: lainnya.filter((f) => f.kategori === "kamar") },
    { judul: "Dipakai bersama", isi: lainnya.filter((f) => f.kategori !== "kamar") },
  ].filter((g) => g.isi.length > 0);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filter"
      penuh
      hrefTerakhir={hrefTerakhir}
      pertahankan={pertahankan}
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => terapkan(tanpaFilter)}>
            Hapus semua
          </Button>
          {adaGalat ? (
            <Button variant="primary" className="flex-1" onClick={fokusGalat}>
              Perbaiki rentang harga
            </Button>
          ) : (
            <Button variant="primary" className="flex-1" onClick={onClose} aria-busy={memuat || undefined}>
              {memuat ? "Menghitung…" : `Lihat ${total} kos`}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <p className="text-small text-arang-500">
            Pilihanmu langsung diterapkan ke hasil. Tekan <b className="text-arang-900">{memuat ? "Lihat kos" : `Lihat ${total} kos`}</b> untuk kembali ke daftar.
          </p>
          <FilterAktif params={params} namaFasilitas={namaFasilitas(fasilitas)} terapkan={terapkan} hapusSemua={false} />
        </div>

        <Kelompok judul="Harga" keterangan="Total per bulan, bukan sewa saja. Kos yang biayanya belum lengkap tidak ikut filter harga.">
          <div className="flex flex-wrap gap-2">
            {HARGA_CEPAT.map((h) => (
              <Chip key={h} selected={params.harga_max === h && !adaGalat} onClick={() => terapkanHarga(teksMin, params.harga_max === h ? "" : String(h))}>
                ≤ {formatRupiah(h)}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputRupiah ref={refMin} id="harga-minimal" label="Minimal" teks={teksMin} onUbah={setTeksMin} onCommit={() => terapkanHarga(teksMin, teksMax)} galat={galat.min} />
            <InputRupiah ref={refMax} id="harga-maksimal" label="Maksimal" teks={teksMax} onUbah={setTeksMax} onCommit={() => terapkanHarga(teksMin, teksMax)} galat={galat.max} />
          </div>
        </Kelompok>

        <Kelompok judul="Tipe kos" keterangan="Boleh pilih lebih dari satu. Tidak memilih berarti semua tipe.">
          <div className="flex flex-wrap gap-2">
            {TIPE_KOS.map((t) => (
              <Chip key={t} selected={tipe.has(t)} onClick={() => terapkan((p) => toggleTipe(p, t))}>
                {LABEL_TIPE[t]}
              </Chip>
            ))}
          </div>
        </Kelompok>

        <Kelompok judul="Kamar" keterangan="Dicocokkan per tipe kamar: harga dan pilihan di sini harus ada di kamar yang sama.">
          <div className="flex flex-wrap gap-2">
            {FASILITAS_KAMAR.map((f) => (
              <Chip key={f.slug} selected={fas.has(f.slug)} onClick={() => toggleFasilitas(f.slug)}>
                {f.nama}
              </Chip>
            ))}
          </div>
        </Kelompok>

        <Kelompok judul="Kebersihan" keterangan="Dari rubrik surveyor kami, skala 1–5. Pilih batas bawahnya.">
          <div className="flex flex-wrap gap-2">
            {PILIHAN_KEBERSIHAN.map((t) => (
              <Chip key={t.nilai} selected={params.kebersihan === t.nilai} onClick={() => terapkan((p) => ({ ...p, kebersihan: p.kebersihan === t.nilai ? undefined : t.nilai }))}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Kelompok>

        <Kelompok judul="Kedap suara" keterangan="Skala 1–5 dari material tembok dan tes desibel. Makin tinggi, makin sedikit suara tetangga yang terdengar.">
          <div className="flex flex-wrap gap-2">
            {PILIHAN_KEDAP.map((t) => (
              <Chip key={t.nilai} selected={params.kedap === t.nilai} onClick={() => terapkan((p) => ({ ...p, kedap: p.kedap === t.nilai ? undefined : t.nilai }))}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Kelompok>

        <Kelompok judul="Aturan">
          <div className="flex flex-wrap gap-2">
            <Chip selected={params.pasangan === "boleh"} onClick={() => terapkan((p) => ({ ...p, pasangan: p.pasangan === "boleh" ? undefined : "boleh" }))}>
              Boleh pasangan
            </Chip>
            <Chip selected={!!params.hewan} onClick={() => terapkan((p) => ({ ...p, hewan: !p.hewan }))}>
              Boleh hewan
            </Chip>
            <Chip selected={!!params.masak} onClick={() => terapkan((p) => ({ ...p, masak: !p.masak }))}>
              Boleh masak di kamar
            </Chip>
            <Chip selected={!!params.tanpa_jam_malam} onClick={() => terapkan((p) => ({ ...p, tanpa_jam_malam: !p.tanpa_jam_malam }))}>
              Tanpa jam malam
            </Chip>
          </div>
        </Kelompok>

        <Kelompok judul="Sekitar" keterangan="Jarak dari kos, dicatat surveyor. Kos yang belum punya catatan minimarket tidak ikut.">
          <div className="flex flex-wrap gap-2">
            <Chip selected={!!params.dekat_minimarket} onClick={() => terapkan((p) => ({ ...p, dekat_minimarket: !p.dekat_minimarket }))}>
              Minimarket ≤ 300 m
            </Chip>
          </div>
        </Kelompok>

        {kelompokLain.length > 0 && (
          <Kelompok judul="Fasilitas lain" keterangan="Dicatat per kos, belum per tipe kamar.">
            {kelompokLain.map((g) => (
              <div key={g.judul} className="flex flex-col gap-2" role="group" aria-label={`Fasilitas ${g.judul.toLowerCase()}`}>
                <p className="text-small font-bold text-arang-500" aria-hidden="true">{g.judul}</p>
                <div className="flex flex-wrap gap-2">
                  {g.isi.map((f) => (
                    <Chip key={f.slug} selected={fas.has(f.slug)} onClick={() => toggleFasilitas(f.slug)}>
                      {f.nama}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </Kelompok>
        )}
      </div>
    </Sheet>
  );
}

function Kelompok({ judul, keterangan, children }: { judul: string; keterangan?: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1">
        <span className="block text-body font-bold text-arang-900">{judul}</span>
        {keterangan && <span className="block text-micro text-arang-500">{keterangan}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function InputRupiah({
  ref,
  id,
  label,
  teks,
  onUbah,
  onCommit,
  galat,
}: {
  ref: React.Ref<HTMLInputElement>;
  id: string;
  label: string;
  teks: string;
  onUbah: (t: string) => void;
  onCommit: () => void;
  galat?: string;
}) {
  const idGalat = `${id}-galat`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-small text-arang-900">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-small text-arang-500">Rp</span>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={teks}
          placeholder="Berapa pun"
          aria-invalid={galat ? true : undefined}
          aria-describedby={galat ? idGalat : undefined}
          onChange={(e) => onUbah(e.target.value)}
          onBlur={onCommit}
          onKeyDown={(e) => e.key === "Enter" && onCommit()}
          className={cn(
            "h-11 w-full rounded-xl border bg-putih pr-3 pl-9 text-body text-arang-900 tabular-nums placeholder:text-arang-500 focus:border-biru-500",
            galat ? "border-merah-700" : "border-arang-500/30",
          )}
        />
      </div>
      {galat && (
        <p id={idGalat} role="alert" className="text-small text-merah-700">
          {galat}
        </p>
      )}
    </div>
  );
}
