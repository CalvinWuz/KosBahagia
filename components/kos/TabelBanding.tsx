"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClasses } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/Icon";
import { SkorBadge } from "@/components/kos/SkorBadge";
import { TombolChat } from "@/components/kos/detail/BarAksi";
import { formatRupiah, formatSkor } from "@/lib/format";
import { kataKebersihan, kataKedap } from "@/lib/skala";
import { hapusBanding, MAKS_BANDING } from "@/lib/simpan";
import { tampilkanToast } from "@/lib/toast";
import type { KosBanding } from "@/lib/kos/banding";
import { cn } from "@/lib/cn";

type Sel = { teks: ReactNode; kunci: string; angka?: number | null };
type Baris = { label: string; sel: Sel[]; terbaik?: "min" | "max" };

function bikinBaris(kos: KosBanding[]): Baris[] {
  const rincian = (k: KosBanding) => {
    const r = (Array.isArray(k.kartu.rincian) ? k.kartu.rincian : []) as Array<{ nama: string; jumlah: number }>;
    return r.map((x) => `${x.nama} ${formatRupiah(x.jumlah)}`);
  };
  const teksSkor = (n: number | null | undefined, kata: string | null) =>
    n == null ? "Belum dinilai" : (
      <>
        {formatSkor(n)}/5{kata && <span className="block text-micro font-medium text-arang-500">{kata}</span>}
      </>
    );
  return [
    { label: "Total per bulan", terbaik: "min", sel: kos.map((k) => ({ teks: <span className="text-h2 tabular-nums">{formatRupiah(k.kartu.total_bulanan ?? 0)}</span>, kunci: String(k.kartu.total_bulanan), angka: k.kartu.total_bulanan })) },
    { label: "Rincian biaya", sel: kos.map((k) => ({ teks: <ul className="flex flex-col gap-0.5 text-micro">{rincian(k).map((t) => <li key={t}>{t}</li>)}</ul>, kunci: rincian(k).join("|") })) },
    { label: "Skor Bahagia", terbaik: "max", sel: kos.map((k) => ({ teks: <SkorBadge skor={k.kartu.skor} />, kunci: String(k.kartu.skor ?? "-"), angka: k.kartu.skor })) },
    { label: "Kebersihan", terbaik: "max", sel: kos.map((k) => ({ teks: teksSkor(k.kartu.skor_kebersihan, kataKebersihan(k.kartu.skor_kebersihan)), kunci: String(k.kartu.skor_kebersihan ?? "-"), angka: k.kartu.skor_kebersihan })) },
    { label: "Kedap suara", terbaik: "max", sel: kos.map((k) => ({ teks: teksSkor(k.kartu.skor_kedap, kataKedap(k.kartu.skor_kedap)), kunci: String(k.kartu.skor_kedap ?? "-"), angka: k.kartu.skor_kedap })) },
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

const KOLOM_LABEL = "sticky left-0 z-10 w-28 min-w-28 bg-putih px-3 py-3 text-left align-top text-small font-bold text-arang-900 sm:w-36 sm:min-w-36";
const KOLOM_KOS = "min-w-52 px-3 py-3 align-top text-arang-900 sm:min-w-60";

function BarisTabel({ b, sorot, adaSlot }: { b: Baris; sorot: boolean; adaSlot: boolean }) {
  const menang = sorot ? terbaikIndex(b) : -1;
  return (
    <tr className="border-t border-biru-100">
      <th scope="row" className={KOLOM_LABEL}>
        {b.label}
      </th>
      {b.sel.map((s, i) => (
        <td key={i} className={cn(KOLOM_KOS, menang === i && "bg-daun-100 font-bold text-daun-700")}>
          {s.teks}
          {menang === i && <span className="sr-only"> (terbaik)</span>}
        </td>
      ))}
      {adaSlot && <td className={cn(KOLOM_KOS, "bg-kertas-50")} aria-hidden="true" />}
    </tr>
  );
}

// Built for the screenshot a student sends to their parents: differences
// highlighted, identical rows folded away, attribute column frozen on
// mobile. The table scrolls inside its own box; the page never widens.
export function TabelBanding({ kos, url }: { kos: KosBanding[]; url: string }) {
  const router = useRouter();
  const [disalin, setDisalin] = useState(false);
  const [bukaSama, setBukaSama] = useState(false);
  const baris = bikinBaris(kos);
  const beda = baris.filter((b) => new Set(b.sel.map((s) => s.kunci)).size > 1);
  const sama = baris.filter((b) => new Set(b.sel.map((s) => s.kunci)).size <= 1);
  const adaSlot = kos.length < MAKS_BANDING;

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

  const keluarkan = (k: KosBanding) => {
    if (k.kartu.id) hapusBanding(k.kartu.id);
    const sisa = kos.filter((x) => x.kartu.id !== k.kartu.id).map((x) => x.kartu.slug);
    tampilkanToast({ teks: `${k.kartu.nama} dikeluarkan dari perbandingan.` });
    router.replace(sisa.length ? `/banding?kos=${sisa.join(",")}` : "/banding");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-arang-500">
          {beda.length} perbedaan, {sama.length} hal yang sama.
          <span className="sm:hidden"> Geser tabel ke samping untuk kos berikutnya.</span>
        </p>
        <Button variant="secondary" size="sm" onClick={bagikan}>{disalin ? "Tautan disalin" : "Bagikan"}</Button>
      </div>

      {/* `relative` matters: the sr-only cells are absolutely positioned and
          would otherwise widen the whole document on phones. */}
      <div className="relative overflow-x-auto rounded-2xl border border-biru-100 bg-putih [scrollbar-width:thin]">
        <table className="w-full border-collapse text-small">
          <thead>
            <tr>
              <th scope="col" className={cn(KOLOM_LABEL, "align-bottom text-micro text-arang-500")}>Kos</th>
              {kos.map((k) => (
                <th key={k.kartu.id} scope="col" className={cn(KOLOM_KOS, "text-left font-normal")}>
                  <div className="flex flex-col gap-2">
                    <Link href={`/kos/${k.kartu.slug}`} aria-hidden="true" tabIndex={-1} className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-biru-100">
                      {k.kartu.foto_url && <Image src={k.kartu.foto_url} alt="" fill sizes="(min-width: 1024px) 380px, 60vw" className="object-cover" />}
                    </Link>
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/kos/${k.kartu.slug}`} className="rounded-sm text-body leading-5 font-bold text-arang-900 hover:text-biru-600 hover:underline">
                        {k.kartu.nama}
                      </Link>
                      <button
                        type="button"
                        onClick={() => keluarkan(k)}
                        aria-label={`Keluarkan ${k.kartu.nama} dari perbandingan`}
                        className="grid size-8 shrink-0 place-items-center rounded-full border border-biru-100 text-arang-500 hover:border-biru-500 hover:text-biru-600"
                      >
                        <IconClose className="size-4" />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              {adaSlot && (
                <th scope="col" className={cn(KOLOM_KOS, "bg-kertas-50 text-left font-normal")}>
                  <Link href="/cari" className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-biru-100 text-small font-bold text-biru-600 hover:border-biru-500 hover:bg-biru-100/40">
                    <span className="text-h2 leading-none">+</span>
                    Tambah kos
                  </Link>
                  <p className="mt-2 text-micro text-arang-500">Sampai {MAKS_BANDING} kos.</p>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {beda.map((b) => <BarisTabel key={b.label} b={b} sorot adaSlot={adaSlot} />)}
            {sama.length > 0 && (
              <tr className="border-t border-biru-100">
                <td colSpan={kos.length + 1 + (adaSlot ? 1 : 0)} className="p-2">
                  <Button variant="ghost" size="sm" onClick={() => setBukaSama((v) => !v)} aria-expanded={bukaSama} className="sticky left-2">
                    {bukaSama ? `Sembunyikan ${sama.length} hal yang sama` : `Tampilkan ${sama.length} hal yang sama`}
                  </Button>
                </td>
              </tr>
            )}
            {bukaSama && sama.map((b) => <BarisTabel key={b.label} b={b} sorot={false} adaSlot={adaSlot} />)}
            <tr className="border-t border-biru-100">
              <th scope="row" className={KOLOM_LABEL}>Hubungi</th>
              {kos.map((k) => (
                <td key={k.kartu.id} className={KOLOM_KOS}>
                  {k.whatsapp && k.kartu.id && k.kartu.nama ? (
                    <TombolChat kosId={k.kartu.id} namaKos={k.kartu.nama} whatsapp={k.whatsapp} kamar={k.kamar} variant="secondary" size="sm" sumber="banding" />
                  ) : (
                    <Link href={`/kos/${k.kartu.slug}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>Lihat detail</Link>
                  )}
                </td>
              ))}
              {adaSlot && <td className={cn(KOLOM_KOS, "bg-kertas-50")} aria-hidden="true" />}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
