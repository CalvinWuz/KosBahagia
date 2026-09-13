"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { formatRupiah } from "@/lib/format";
import { tanpaFilter, type CariParams, type TipeKosParam } from "@/lib/cari-params";
import { cn } from "@/lib/cn";

export type FasilitasFilter = { slug: string; nama: string; kategori: string };
type Ubah = (ubah: (p: CariParams) => CariParams) => void;

const HARGA_CEPAT = [1_000_000, 1_500_000, 2_000_000, 3_000_000];
const TIPE: Array<{ nilai: TipeKosParam; label: string }> = [
  { nilai: "putra", label: "Putra" },
  { nilai: "putri", label: "Putri" },
  { nilai: "campur", label: "Campur" },
];

// The full filter set. Every control applies immediately (no Apply button);
// the primary button only closes the sheet and reads the live count.
export function FilterSheet({
  open,
  onClose,
  params,
  total,
  memuat,
  fasilitas,
  terapkan,
}: {
  open: boolean;
  onClose: () => void;
  params: CariParams;
  total: number;
  memuat: boolean;
  fasilitas: FasilitasFilter[];
  terapkan: Ubah;
}) {
  const fas = new Set(params.fasilitas ?? []);
  const toggleFasilitas = (slug: string) =>
    terapkan((p) => {
      const set = new Set(p.fasilitas ?? []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      return { ...p, fasilitas: [...set] };
    });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filter"
      penuh
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => terapkan(tanpaFilter)}>
            Hapus semua
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose} aria-busy={memuat || undefined}>
            {memuat ? "Menghitung…" : `Lihat ${total} kos`}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-7">
        <Kelompok judul="Harga" keterangan="Total per bulan, bukan sewa saja">
          <div className="flex flex-wrap gap-2">
            {HARGA_CEPAT.map((h) => (
              <Chip key={h} selected={params.harga_max === h} onClick={() => terapkan((p) => ({ ...p, harga_max: p.harga_max === h ? undefined : h }))}>
                ≤ {formatRupiah(h)}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputRupiah label="Minimal" nilai={params.harga_min} onCommit={(v) => terapkan((p) => ({ ...p, harga_min: v }))} />
            <InputRupiah label="Maksimal" nilai={params.harga_max} onCommit={(v) => terapkan((p) => ({ ...p, harga_max: v }))} />
          </div>
        </Kelompok>

        <Kelompok judul="Kamar">
          <div className="flex flex-wrap gap-2">
            {TIPE.map((t) => (
              <Chip key={t.nilai} selected={params.tipe === t.nilai} onClick={() => terapkan((p) => ({ ...p, tipe: p.tipe === t.nilai ? undefined : t.nilai }))}>
                {t.label}
              </Chip>
            ))}
          </div>
        </Kelompok>

        <Kelompok judul="Kebersihan & suara" keterangan="Skor survei kami, skala 1–5">
          <Slider label="Kebersihan minimal" nilai={params.kebersihan} onCommit={(v) => terapkan((p) => ({ ...p, kebersihan: v }))} />
          <Slider label="Kedap suara minimal" nilai={params.kedap} onCommit={(v) => terapkan((p) => ({ ...p, kedap: v }))} />
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
          </div>
        </Kelompok>

        <Kelompok judul="Sembunyikan" keterangan="Buang yang pasti tidak kamu mau">
          <div className="flex flex-wrap gap-2">
            <Chip selected={!!params.tanpa_jam_malam} onClick={() => terapkan((p) => ({ ...p, tanpa_jam_malam: !p.tanpa_jam_malam }))}>
              yang ada jam malam
            </Chip>
            <Chip selected={fas.has("kamar-mandi-dalam")} onClick={() => toggleFasilitas("kamar-mandi-dalam")}>
              tanpa kamar mandi dalam
            </Chip>
            <Chip selected={!!params.dekat_minimarket} onClick={() => terapkan((p) => ({ ...p, dekat_minimarket: !p.dekat_minimarket }))}>
              yang jauh dari minimarket
            </Chip>
          </div>
        </Kelompok>

        <Kelompok judul="Fasilitas">
          <div className="flex flex-wrap gap-2">
            {fasilitas.map((f) => (
              <Chip key={f.slug} selected={fas.has(f.slug)} onClick={() => toggleFasilitas(f.slug)}>
                {f.nama}
              </Chip>
            ))}
          </div>
        </Kelompok>
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

// Range 0–5 where 0 means "tidak difilter". Commits on release / keyup so
// dragging does not spam the URL.
function Slider({ label, nilai, onCommit }: { label: string; nilai?: number; onCommit: (v: number | undefined) => void }) {
  const [lokal, setLokal] = useState(nilai ?? 0);
  const [propSebelumnya, setPropSebelumnya] = useState(nilai);
  if (propSebelumnya !== nilai) {
    // Prop changed from outside (back button, "Hapus semua"): resync.
    setPropSebelumnya(nilai);
    setLokal(nilai ?? 0);
  }
  const commit = () => onCommit(lokal === 0 ? undefined : lokal);
  const id = `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-small text-arang-900">{label}</label>
        <span className="text-small font-bold text-biru-600 tabular-nums">{lokal === 0 ? "Semua" : `${lokal} dari 5`}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={5}
        step={1}
        value={lokal}
        onChange={(e) => setLokal(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={(e) => e.key !== "Tab" && e.key !== "Escape" && commit()}
        className="h-2 w-full cursor-pointer accent-biru-500"
      />
      <div className="flex justify-between text-micro text-arang-500" aria-hidden="true">
        <span>Semua</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
      </div>
    </div>
  );
}

function InputRupiah({ label, nilai, onCommit }: { label: string; nilai?: number; onCommit: (v: number | undefined) => void }) {
  const [teks, setTeks] = useState(nilai ? String(nilai) : "");
  const [propSebelumnya, setPropSebelumnya] = useState(nilai);
  if (propSebelumnya !== nilai) {
    setPropSebelumnya(nilai);
    setTeks(nilai ? String(nilai) : "");
  }
  const id = `harga-${label.toLowerCase()}`;
  const commit = () => {
    const n = Number(teks.replace(/\D/g, ""));
    onCommit(n > 0 ? n : undefined);
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-small text-arang-900">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-small text-arang-500">Rp</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={teks}
          placeholder="0"
          onChange={(e) => setTeks(e.target.value.replace(/\D/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          className={cn("h-11 w-full rounded-xl border border-arang-500/30 bg-putih pr-3 pl-9 text-body text-arang-900 tabular-nums placeholder:text-arang-500 focus:border-biru-500")}
        />
      </div>
    </div>
  );
}
