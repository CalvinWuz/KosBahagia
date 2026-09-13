"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SkorBadge } from "@/components/kos/SkorBadge";
import { formatRupiah, formatSkor } from "@/lib/format";
import type { KosBanding } from "@/lib/kos/banding";
import { cn } from "@/lib/cn";

type Sel = { teks: ReactNode; kunci: string; angka?: number | null };
type Baris = { label: string; sel: Sel[]; terbaik?: "min" | "max" };

function bikinBaris(kos: KosBanding[]): Baris[] {
  const rincian = (k: KosBanding) => {
    const r = (Array.isArray(k.kartu.rincian) ? k.kartu.rincian : []) as Array<{ nama: string; jumlah: number }>;
    return r.map((x) => `${x.nama} ${formatRupiah(x.jumlah)}`);
  };
  const teksSkor = (n: number | null | undefined) => (n == null ? "Belum dinilai" : `${formatSkor(n)}/5`);
  return [
    { label: "Total per bulan", terbaik: "min", sel: kos.map((k) => ({ teks: <span className="text-h2 tabular-nums">{formatRupiah(k.kartu.total_bulanan ?? 0)}</span>, kunci: String(k.kartu.total_bulanan), angka: k.kartu.total_bulanan })) },
    { label: "Rincian biaya", sel: kos.map((k) => ({ teks: <ul className="flex flex-col gap-0.5 text-micro">{rincian(k).map((t) => <li key={t}>{t}</li>)}</ul>, kunci: rincian(k).join("|") })) },
    { label: "Skor Bahagia", terbaik: "max", sel: kos.map((k) => ({ teks: <SkorBadge skor={k.kartu.skor} />, kunci: String(k.kartu.skor ?? "-"), angka: k.kartu.skor })) },
    { label: "Kebersihan", terbaik: "max", sel: kos.map((k) => ({ teks: teksSkor(k.kartu.skor_kebersihan), kunci: String(k.kartu.skor_kebersihan ?? "-"), angka: k.kartu.skor_kebersihan })) },
    { label: "Kedap suara", terbaik: "max", sel: kos.map((k) => ({ teks: teksSkor(k.kartu.skor_kedap), kunci: String(k.kartu.skor_kedap ?? "-"), angka: k.kartu.skor_kedap })) },
    { label: "Ukuran kamar", sel: kos.map((k) => ({ teks: k.kamar?.ukuran ?? "Belum kami catat", kunci: k.kamar?.ukuran ?? "-" })) },
    { label: "Kamar mandi dalam", terbaik: "max", sel: kos.map((k) => ({ teks: k.kmDalam ? "Ya" : "Berbagi", kunci: String(k.kmDalam), angka: k.kmDalam ? 1 : 0 })) },
    { label: "AC", terbaik: "max", sel: kos.map((k) => ({ teks: k.kamar?.boleh_ac ? "Ya" : "Tidak", kunci: String(Boolean(k.kamar?.boleh_ac)), angka: k.kamar?.boleh_ac ? 1 : 0 })) },
    { label: "Jam malam", terbaik: "max", sel: kos.map((k) => ({ teks: k.jamMalam ? `Pukul ${k.jamMalam.slice(0, 5).replace(":", ".")}` : "Tidak ada", kunci: k.jamMalam ?? "-", angka: k.jamMalam ? 0 : 1 })) },
    { label: "Jarak ke landmark", terbaik: "min", sel: kos.map((k) => ({ teks: k.kartu.landmark_menit_jalan != null ? `${k.kartu.landmark_menit_jalan} mnt jalan ke ${k.kartu.landmark_nama}` : "Belum kami catat", kunci: `${k.kartu.landmark_menit_jalan}|${k.kartu.landmark_nama}`, angka: k.kartu.landmark_menit_jalan })) },
    { label: "Ketersediaan", terbaik: "max", sel: kos.map((k) => ({ teks: (k.kartu.kamar_tersedia ?? 0) > 0 ? `${k.kartu.kamar_tersedia} kamar` : "Penuh", kunci: String(k.kartu.kamar_tersedia), angka: k.kartu.kamar_tersedia })) },
  ];
}

function terbaikIndex(b: Baris): number {
  if (!b.terbaik) return -1;
  const angka = b.sel.map((s) => s.angka ?? null);
  const valid = angka.filter((a): a is number => a != null);
  if (valid.length < 2) return -1;
  const target = b.terbaik === "min" ? Math.min(...valid) : Math.max(...valid);
  const menang = angka.map((a, i) => (a === target ? i : -1)).filter((i) => i >= 0);
  return menang.length === 1 ? menang[0] : -1;
}

function BarisTabel({ b, sorot }: { b: Baris; sorot: boolean }) {
  const menang = sorot ? terbaikIndex(b) : -1;
  return (
    <tr className="border-t border-biru-100">
      <th scope="row" className="sticky left-0 z-10 bg-putih px-3 py-3 text-left align-top text-small font-bold text-arang-900">
        {b.label}
      </th>
      {b.sel.map((s, i) => (
        <td key={i} className={cn("px-3 py-3 align-top text-arang-900", menang === i && "bg-daun-100 font-bold text-daun-700")}>
          {s.teks}
          {menang === i && <span className="sr-only"> (terbaik)</span>}
        </td>
      ))}
    </tr>
  );
}

// Built for the screenshot a student sends to their parents: differences
// highlighted, identical rows folded away, attribute column frozen on mobile.
export function TabelBanding({ kos, url }: { kos: KosBanding[]; url: string }) {
  const [disalin, setDisalin] = useState(false);
  const [bukaSama, setBukaSama] = useState(false);
  const baris = bikinBaris(kos);
  const beda = baris.filter((b) => new Set(b.sel.map((s) => s.kunci)).size > 1);
  const sama = baris.filter((b) => new Set(b.sel.map((s) => s.kunci)).size <= 1);

  const bagikan = async () => {
    const data = { title: "Perbandingan kos", text: kos.map((k) => k.kartu.nama).join(" vs "), url };
    try {
      if (navigator.share) return await navigator.share(data);
      await navigator.clipboard.writeText(url);
      setDisalin(true);
      window.setTimeout(() => setDisalin(false), 2500);
    } catch {
      // User dismissed the share sheet.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-arang-500">{beda.length} perbedaan, {sama.length} hal yang sama.</p>
        <Button variant="secondary" size="sm" onClick={bagikan}>{disalin ? "Tautan disalin" : "Bagikan"}</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-biru-100 bg-putih">
        <table className="w-full min-w-[40rem] table-fixed border-collapse text-small">
          <colgroup>
            <col className="w-36" />
            {kos.map((k) => <col key={k.kartu.id} />)}
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-putih px-3 py-3 text-left align-bottom text-micro font-bold text-arang-500">Kos</th>
              {kos.map((k) => (
                <th key={k.kartu.id} scope="col" className="px-3 py-3 text-left align-top">
                  <Link href={`/kos/${k.kartu.slug}`} className="flex flex-col gap-2 rounded-sm">
                    <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-biru-100">
                      {k.kartu.foto_url && <Image src={k.kartu.foto_url} alt="" fill sizes="(min-width: 1024px) 380px, 45vw" className="object-cover" />}
                    </span>
                    <span className="text-body leading-5 font-bold text-arang-900">{k.kartu.nama}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {beda.map((b) => <BarisTabel key={b.label} b={b} sorot />)}
            {sama.length > 0 && (
              <tr className="border-t border-biru-100">
                <td colSpan={kos.length + 1} className="sticky left-0 bg-kertas-50 p-0">
                  <button
                    type="button"
                    onClick={() => setBukaSama((v) => !v)}
                    aria-expanded={bukaSama}
                    className="w-full px-3 py-3 text-left text-small font-bold text-arang-500 hover:text-biru-600"
                  >
                    Sama semua ({sama.length}) {bukaSama ? "— sembunyikan" : "— tampilkan"}
                  </button>
                </td>
              </tr>
            )}
            {bukaSama && sama.map((b) => <BarisTabel key={b.label} b={b} sorot={false} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
