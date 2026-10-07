"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { IconClose } from "@/components/ui/Icon";
import { SkorBadge } from "@/components/kos/SkorBadge";
import { TombolChat } from "@/components/kos/detail/BarAksi";
import { formatRupiah, formatSkor } from "@/lib/format";
import { hitungBiaya, hitungUangMasuk, labelTotal } from "@/lib/biaya";
import { statusKamar, type InfoStatus } from "@/lib/kamar";
import { kataKebersihan, kataKedap } from "@/lib/skala";
import { setBanding } from "@/lib/simpan";
import { hrefBanding, MAKS_BANDING, type KunciBanding } from "@/lib/kos/kunci-banding";
import { tampilkanToast } from "@/lib/toast";
import type { KosBanding } from "@/lib/kos/banding";
import { cn } from "@/lib/cn";

const TIPE: Record<string, string> = { putra: "Putra", putri: "Putri", campur: "Campur" };
const PASANGAN: Record<string, string> = { boleh: "Boleh", tidak: "Tidak boleh", surat_nikah: "Boleh dengan surat nikah" };
const TAMU: Record<string, string> = { boleh: "Boleh ke kamar", ruang_tamu: "Ruang tamu saja", tidak: "Tidak boleh" };
const ASAL: Record<KosBanding["asalKamar"], string> = {
  dipilih: "Tipe kamar pilihanmu",
  otomatis: "Dipilih otomatis: termurah yang masih ada kamar",
  hilang: "Tipe kamar di tautan ini sudah tidak ada",
};

type Sel = { teks: ReactNode; kunci: string; angka?: number | null };
type Baris = { label: string; sel: Sel[]; terbaik?: "min" | "max"; tetap?: boolean };
type Kolom = KosBanding & { biaya: ReturnType<typeof hitungBiaya> | null; masuk: ReturnType<typeof hitungUangMasuk> | null; status: InfoStatus | null };

const KOSONG: Sel = { teks: <span className="text-arang-500">Pilih tipe kamar dulu</span>, kunci: "-" };

function bikinBaris(kol: Kolom[]): Baris[] {
  const perKamar = (f: (k: Kolom) => Sel): Sel[] => kol.map((k) => (k.kamar ? f(k) : KOSONG));
  const teksSkor = (n: number | null | undefined, kata: string | null) =>
    n == null ? "Belum dinilai" : (
      <>
        {formatSkor(n)}/5{kata && <span className="block text-micro font-medium text-arang-500">{kata}</span>}
      </>
    );
  return [
    // Basic requirements stay visible even in "only differences" mode.
    { label: "Untuk", tetap: true, sel: kol.map((k) => ({ teks: `Kos ${TIPE[k.kartu.tipe ?? ""]?.toLowerCase() ?? k.kartu.tipe}`, kunci: k.kartu.tipe ?? "-" })) },
    { label: "Pasangan", tetap: true, sel: kol.map((k) => ({ teks: k.aturan ? PASANGAN[k.aturan.pasangan] : "Belum kami catat", kunci: k.aturan?.pasangan ?? "-" })) },
    {
      label: "Total per bulan",
      terbaik: "min",
      sel: perKamar((k) => ({
        teks: (
          <>
            <span className="text-h2 tabular-nums">{formatRupiah(k.biaya!.total)}</span>
            <span className="block text-micro font-medium text-arang-500">
              {labelTotal(k.biaya!)}
              {!k.biaya!.lengkap ? `: ${k.biaya!.belumDiketahui.join(", ").toLowerCase()} belum diketahui` : ""}
            </span>
          </>
        ),
        kunci: `${k.biaya!.total}|${k.biaya!.lengkap}`,
        // An incomplete total cannot win "cheapest".
        angka: k.biaya!.lengkap ? k.biaya!.total : null,
      })),
    },
    {
      label: "Rincian biaya",
      sel: perKamar((k) => {
        const baris = k.biaya!.bulanan.map((x) =>
          x.sifat === "termasuk" ? `${x.nama}: termasuk sewa` : x.sifat === "belum_diketahui" ? `${x.nama}: belum diketahui` : `${x.nama} ${formatRupiah(x.jumlah ?? 0)}${x.sifat === "pemakaian" ? " (estimasi)" : ""}`,
        );
        return { teks: <ul className="flex flex-col gap-0.5 text-micro">{baris.map((t) => <li key={t}>{t}</li>)}</ul>, kunci: baris.join("|") };
      }),
    },
    {
      label: "Uang masuk",
      terbaik: "min",
      sel: perKamar((k) => ({
        teks: (
          <>
            <span className="tabular-nums">{k.masuk!.lengkap ? "" : "min. "}{formatRupiah(k.masuk!.total)}</span>
            <span className="block text-micro font-medium text-arang-500">
              {k.masuk!.bulanDimuka ? `${k.masuk!.bulanDimuka} bln di muka` : "bulan di muka belum diketahui"}
              {k.masuk!.deposit ? ` + deposit ${formatRupiah(k.masuk!.deposit)}` : ""}
            </span>
          </>
        ),
        kunci: `${k.masuk!.total}|${k.masuk!.lengkap}`,
        angka: k.masuk!.lengkap ? k.masuk!.total : null,
      })),
    },
    { label: "Kontrak minimal", terbaik: "min", sel: perKamar((k) => ({ teks: `${k.kamar!.durasi_minimal} bulan`, kunci: String(k.kamar!.durasi_minimal), angka: k.kamar!.durasi_minimal })) },
    {
      label: "Ketersediaan tipe ini",
      sel: perKamar((k) => ({
        teks: (
          <>
            <Badge tone={k.status!.status === "tersedia" ? "baik" : k.status!.status === "penuh" ? "bahaya" : "peringatan"}>{k.status!.label}</Badge>
            <span className="mt-0.5 block text-micro font-medium text-arang-500">{k.status!.rincian}</span>
          </>
        ),
        kunci: `${k.status!.status}|${k.status!.tersedia}`,
      })),
    },
    { label: "Ukuran kamar", sel: perKamar((k) => ({ teks: k.kamar!.ukuran ?? "Belum kami catat", kunci: k.kamar!.ukuran ?? "-" })) },
    {
      label: "Kamar mandi dalam",
      terbaik: "max",
      sel: perKamar((k) => ({
        teks: k.kmDalam == null ? "Belum dicatat" : k.kmDalam ? "Ya" : "Tidak, dipakai bersama",
        kunci: String(k.kmDalam),
        angka: k.kmDalam == null ? null : k.kmDalam ? 1 : 0,
      })),
    },
    { label: "AC", terbaik: "max", sel: perKamar((k) => ({ teks: k.kamar!.boleh_ac ? "Ya" : "Tidak", kunci: String(k.kamar!.boleh_ac), angka: k.kamar!.boleh_ac ? 1 : 0 })) },
    { label: "Skor Bahagia", terbaik: "max", sel: kol.map((k) => ({ teks: <SkorBadge skor={k.kartu.skor} />, kunci: String(k.kartu.skor ?? "-"), angka: k.kartu.skor })) },
    { label: "Kebersihan", terbaik: "max", sel: kol.map((k) => ({ teks: teksSkor(k.kartu.skor_kebersihan, kataKebersihan(k.kartu.skor_kebersihan)), kunci: String(k.kartu.skor_kebersihan ?? "-"), angka: k.kartu.skor_kebersihan })) },
    { label: "Kedap suara", terbaik: "max", sel: kol.map((k) => ({ teks: teksSkor(k.kartu.skor_kedap, kataKedap(k.kartu.skor_kedap)), kunci: String(k.kartu.skor_kedap ?? "-"), angka: k.kartu.skor_kedap })) },
    { label: "Jam malam", terbaik: "max", sel: kol.map((k) => ({ teks: k.aturan?.jam_malam ? `Pukul ${k.aturan.jam_malam.slice(0, 5).replace(":", ".")}` : k.aturan ? "Tidak ada" : "Belum kami catat", kunci: k.aturan?.jam_malam ?? (k.aturan ? "tidak" : "-"), angka: k.aturan ? (k.aturan.jam_malam ? 0 : 1) : null })) },
    { label: "Tamu", sel: kol.map((k) => ({ teks: k.aturan ? TAMU[k.aturan.tamu] : "Belum kami catat", kunci: k.aturan?.tamu ?? "-" })) },
    {
      label: "Jarak jalan kaki",
      sel: kol.map((k) => ({
        teks: k.kartu.landmark_menit_jalan != null ? `${k.kartu.landmark_menit_jalan} mnt ke ${k.kartu.landmark_nama}` : "Belum kami catat",
        kunci: `${k.kartu.landmark_menit_jalan}|${k.kartu.landmark_nama}`,
      })),
    },
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
const KOLOM_KOS = "min-w-48 px-3 py-3 align-top text-arang-900 sm:min-w-60";

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

// Built for the screenshot a student sends to their parents. Each column is
// a kos AND a room type: the room picked on the detail page stays that room
// here, after a reload and in a shared link. Differences are highlighted,
// identical rows fold away except the basic requirements (who it is for,
// couples), and the table scrolls inside its own box with the kos names and
// the attribute column pinned. Phones get a compact summary first.
export function TabelBanding({ kos, url, sekarang: sekarangIso }: { kos: KosBanding[]; url: string; sekarang: string }) {
  const router = useRouter();
  const [disalin, setDisalin] = useState(false);
  const [bukaSama, setBukaSama] = useState(false);
  const sekarang = new Date(sekarangIso);
  const kol: Kolom[] = kos.map((k) => ({
    ...k,
    biaya: k.kamar ? hitungBiaya(k.kamar) : null,
    masuk: k.kamar ? hitungUangMasuk(k.kamar) : null,
    status: k.kamar ? statusKamar(k.kamar, k.kartu.ketersediaan_dikonfirmasi_pada, sekarang) : null,
  }));
  const baris = bikinBaris(kol);
  const tetap = baris.filter((b) => b.tetap);
  const beda = baris.filter((b) => !b.tetap && new Set(b.sel.map((s) => s.kunci)).size > 1);
  const sama = baris.filter((b) => !b.tetap && new Set(b.sel.map((s) => s.kunci)).size <= 1);
  const adaSlot = kos.length < MAKS_BANDING;

  // URL and the tray on this device change together.
  const terapkan = (kunci: KunciBanding[]) => {
    setBanding(
      kunci.map((k) => {
        const asal = kos.find((x) => x.kunci.kos === k.kos);
        return { id: asal?.kartu.id ?? k.kos, slug: k.kos, nama: asal?.kartu.nama ?? "", kamarId: k.kamar, kamarNama: asal?.semuaKamar.find((t) => t.id === k.kamar)?.nama ?? null };
      }),
    );
    router.replace(hrefBanding(kunci), { scroll: false });
  };
  const gantiKamar = (i: number, kamarId: string) => terapkan(kos.map((k, j) => (j === i ? { kos: k.kunci.kos, kamar: kamarId } : { kos: k.kunci.kos, kamar: k.kamar?.id ?? k.kunci.kamar })));
  const keluarkan = (i: number) => {
    tampilkanToast({ teks: `${kos[i].kartu.nama} dikeluarkan dari perbandingan.` });
    terapkan(kos.filter((_, j) => j !== i).map((k) => ({ kos: k.kunci.kos, kamar: k.kamar?.id ?? k.kunci.kamar })));
  };

  const bagikan = async () => {
    const data = { title: "Perbandingan kos", text: kos.map((k) => `${k.kartu.nama}${k.kamar ? ` (${k.kamar.nama})` : ""}`).join(" vs "), url };
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
        <p className="text-small text-arang-500" aria-live="polite">
          {beda.length} perbedaan, {sama.length} hal yang sama. Setiap kolom membandingkan satu tipe kamar.
        </p>
        <Button variant="secondary" size="sm" onClick={bagikan}>{disalin ? "Tautan disalin" : "Bagikan"}</Button>
      </div>

      <RingkasBanding kol={kol} />

      <p className="text-small text-arang-500 sm:hidden">Tabel lengkap di bawah; geser ke samping untuk kolom berikutnya.</p>
      {/* `relative` matters: the sr-only cells are absolutely positioned and
          would otherwise widen the whole document on phones. The box scrolls
          both ways so the header row and the label column can stay pinned. */}
      <div className="relative max-h-[80dvh] overflow-auto rounded-2xl border border-biru-100 bg-putih [scrollbar-width:thin]" tabIndex={0} role="region" aria-label="Tabel perbandingan lengkap, bisa digeser">
        <table className="w-full border-collapse text-small">
          <thead className="sticky top-0 z-20 bg-putih shadow-[0_1px_0_var(--color-biru-100)]">
            <tr>
              <th scope="col" className={cn(KOLOM_LABEL, "z-30 align-bottom text-micro text-arang-500")}>Kos dan tipe kamar</th>
              {kol.map((k, i) => (
                <th key={`${k.kartu.id}:${k.kunci.kamar ?? ""}`} scope="col" className={cn(KOLOM_KOS, "text-left font-normal")}>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start gap-2">
                      <Link href={`/kos/${k.kartu.slug}${k.kamar ? `?kamar=${k.kamar.id}` : ""}`} aria-hidden="true" tabIndex={-1} className="relative hidden h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-biru-100 sm:block">
                        {k.kartu.foto_url && <Image src={k.kartu.foto_url} alt="" fill sizes="64px" className="object-cover" />}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/kos/${k.kartu.slug}${k.kamar ? `?kamar=${k.kamar.id}` : ""}`} className="rounded-sm text-body leading-5 font-bold text-arang-900 hover:text-biru-600 hover:underline">
                          {k.kartu.nama}
                        </Link>
                        <p className="text-micro text-arang-500">Kos {TIPE[k.kartu.tipe ?? ""]?.toLowerCase() ?? k.kartu.tipe}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => keluarkan(i)}
                        aria-label={`Keluarkan ${k.kartu.nama}${k.kamar ? `, kamar ${k.kamar.nama},` : ""} dari perbandingan`}
                        className="sentuh relative grid size-8 shrink-0 place-items-center rounded-full border border-biru-100 text-arang-500 hover:border-biru-500 hover:text-biru-600"
                      >
                        <IconClose className="size-4" />
                      </button>
                    </div>
                    <label className="flex flex-col gap-0.5">
                      <span className={cn("text-micro", k.asalKamar === "hilang" ? "font-bold text-merah-700" : "text-arang-500")}>
                        {k.asalKamar === "otomatis" && k.semuaKamar.every((t) => t.kamar_tersedia === 0) ? "Dipilih otomatis: termurah (semua tipe penuh)" : ASAL[k.asalKamar]}
                      </span>
                      <select
                        value={k.kamar?.id ?? ""}
                        onChange={(e) => e.target.value && gantiKamar(i, e.target.value)}
                        className="h-11 w-full rounded-lg border border-arang-500/30 bg-putih px-2 text-small font-bold text-arang-900"
                      >
                        {!k.kamar && <option value="">Pilih tipe kamar</option>}
                        {k.semuaKamar.map((t) => (
                          <option key={t.id} value={t.id}>{t.nama}, {formatRupiah(hitungBiaya(t).total)}</option>
                        ))}
                      </select>
                    </label>
                    {k.status && (
                      <p className="text-micro">
                        <Badge tone={k.status.status === "tersedia" ? "baik" : k.status.status === "penuh" ? "bahaya" : "peringatan"}>{k.status.label}</Badge>
                      </p>
                    )}
                  </div>
                </th>
              ))}
              {adaSlot && (
                <th scope="col" className={cn(KOLOM_KOS, "bg-kertas-50 text-left font-normal")}>
                  <Link href="/cari" className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-biru-100 text-small font-bold text-biru-600 hover:border-biru-500 hover:bg-biru-100/40">
                    <span className="text-h2 leading-none">+</span>
                    Tambah kos
                  </Link>
                  <p className="mt-2 text-micro text-arang-500">Sampai {MAKS_BANDING} pilihan.</p>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {tetap.map((b) => <BarisTabel key={b.label} b={b} sorot={false} adaSlot={adaSlot} />)}
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
              {kol.map((k) => (
                <td key={`${k.kartu.id}:${k.kunci.kamar ?? ""}`} className={KOLOM_KOS}>
                  {k.whatsapp && k.kartu.id && k.kartu.nama && k.kamar ? (
                    <TombolChat kosId={k.kartu.id} namaKos={k.kartu.nama} whatsapp={k.whatsapp} kamar={k.kamar} status={k.status ?? undefined} variant="secondary" size="sm" sumber="banding" />
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

// Phones: the attributes people decide on, side by side in narrow columns,
// so two or three options can be judged without scrolling sideways.
function RingkasBanding({ kol }: { kol: Kolom[] }) {
  const isi: Array<{ label: string; nilai: (k: Kolom) => ReactNode }> = [
    { label: "Tipe kamar", nilai: (k) => k.kamar?.nama ?? "Belum dipilih" },
    { label: "Untuk", nilai: (k) => `Kos ${TIPE[k.kartu.tipe ?? ""]?.toLowerCase() ?? k.kartu.tipe}` },
    { label: "Pasangan", nilai: (k) => (k.aturan ? PASANGAN[k.aturan.pasangan] : "Belum dicatat") },
    { label: "Per bulan", nilai: (k) => (k.biaya ? <>{formatRupiah(k.biaya.total)}{!k.biaya.lengkap ? "+" : ""}{k.biaya.estimasi ? <span className="block text-micro text-arang-500">estimasi</span> : null}</> : "–") },
    { label: "Uang masuk", nilai: (k) => (k.masuk ? `${k.masuk.lengkap ? "" : "min. "}${formatRupiah(k.masuk.total)}` : "–") },
    { label: "Status", nilai: (k) => k.status?.label ?? "–" },
    { label: "Skor", nilai: (k) => (k.kartu.skor != null ? `${formatSkor(k.kartu.skor)}/10` : "Belum dinilai") },
    { label: "Kedap suara", nilai: (k) => kataKedap(k.kartu.skor_kedap) ?? "Belum dinilai" },
  ];
  return (
    <section aria-labelledby="ringkas-banding" className="rounded-2xl border border-biru-100 bg-putih p-3 sm:hidden">
      <h2 id="ringkas-banding" className="text-body font-bold text-arang-900">Ringkas</h2>
      <div className="mt-2 grid gap-x-2 text-small" style={{ gridTemplateColumns: `repeat(${kol.length}, minmax(0, 1fr))` }}>
        {kol.map((k) => (
          <p key={`n-${k.kartu.id}:${k.kunci.kamar ?? ""}`} className="truncate pb-1 text-micro font-bold text-biru-600" title={k.kartu.nama ?? undefined}>
            {k.kartu.nama}
          </p>
        ))}
        {isi.map((r) => (
          <dl key={r.label} className="col-span-full grid grid-cols-subgrid border-t border-biru-100 py-1.5">
            <dt className="col-span-full text-micro text-arang-500">{r.label}</dt>
            {kol.map((k) => (
              <dd key={`${r.label}-${k.kartu.id}:${k.kunci.kamar ?? ""}`} className="min-w-0 font-bold break-words text-arang-900 tabular-nums">
                {r.nilai(k)}
              </dd>
            ))}
          </dl>
        ))}
      </div>
    </section>
  );
}
