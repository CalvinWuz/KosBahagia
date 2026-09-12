"use client";

import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionItem,
  Badge,
  Button,
  Chip,
  IconCheck,
  Sheet,
  Skeleton,
  SkeletonText,
} from "@/components/ui";
import { formatJarak, formatRupiah, formatWaktuRelatif } from "@/lib/format";

// Fixed clock so server and client agree on relative-time strings.
const SEKARANG = new Date("2026-09-13T09:00:00+07:00");
const menitLalu = (n: number) => new Date(SEKARANG.getTime() - n * 60_000);

const warna = [
  ["biru-600", "bg-biru-600"],
  ["biru-500", "bg-biru-500"],
  ["biru-100", "bg-biru-100"],
  ["jingga-500", "bg-jingga-500"],
  ["daun-500", "bg-daun-500"],
  ["daun-100", "bg-daun-100"],
  ["daun-700", "bg-daun-700"],
  ["merah-500", "bg-merah-500"],
  ["merah-100", "bg-merah-100"],
  ["merah-700", "bg-merah-700"],
  ["arang-900", "bg-arang-900"],
  ["arang-500", "bg-arang-500"],
  ["kertas-50", "bg-kertas-50"],
  ["putih", "bg-putih"],
] as const;

const tipe = [
  ["display", "text-display", "Kos yang sudah kami cek langsung"],
  ["h1", "text-h1", "Kos Putri Melati, Kemanggisan"],
  ["h2", "text-h2", "Rincian biaya per bulan"],
  ["body", "text-body", "Kamar 3×4 m, kamar mandi dalam, AC, listrik token."],
  ["small", "text-small", "Sewa Rp1.200.000 + listrik ± Rp250.000 + air Rp50.000"],
  ["micro", "text-micro", "Ketersediaan dicek 3 hari lalu"],
  ["price", "text-price tabular-nums", "Rp1.550.000"],
] as const;

const fasilitas = ["AC", "Kamar mandi dalam", "WiFi", "Dapur bersama", "Parkir motor", "Boleh pasutri"];

export function Kitchensink() {
  const [terpilih, setTerpilih] = useState<string[]>(["AC", "WiFi"]);
  const [memuat, setMemuat] = useState(false);
  const [sheetTerbuka, setSheetTerbuka] = useState(false);

  const toggleChip = (label: string) =>
    setTerpilih((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );

  const mulaiMemuat = () => {
    setMemuat(true);
    window.setTimeout(() => setMemuat(false), 1800);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8">
      <div>
        <h1 className="text-display text-arang-900">Kitchensink</h1>
        <p className="mt-2 text-body text-arang-500">
          Halaman dev. Semua primitif dalam semua status. Dihapus di task 09.
        </p>
      </div>

      <Bagian judul="Warna">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {warna.map(([nama, kelas]) => (
            <li key={nama} className="flex flex-col gap-1">
              <div className={`h-14 rounded-xl border border-arang-500/20 ${kelas}`} />
              <span className="text-micro text-arang-500">{nama}</span>
            </li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Tipografi">
        <ul className="flex flex-col gap-4">
          {tipe.map(([nama, kelas, contoh]) => (
            <li key={nama} className="grid gap-1 sm:grid-cols-[6rem_1fr] sm:items-baseline">
              <span className="text-micro text-arang-500">{nama}</span>
              <span className={`${kelas} text-arang-900`}>{contoh}</span>
            </li>
          ))}
        </ul>
      </Bagian>

      <Bagian judul="Button">
        <div className="flex flex-col gap-6">
          {(["sm", "md", "lg"] as const).map((ukuran) => (
            <div key={ukuran} className="flex flex-col gap-2">
              <span className="text-micro text-arang-500">{ukuran}</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size={ukuran}>Chat pemilik</Button>
                <Button variant="secondary" size={ukuran}>Simpan kos ini</Button>
                <Button variant="ghost" size={ukuran}>Lihat rincian</Button>
                <Button variant="secondary" size={ukuran} disabled>Nonaktif</Button>
              </div>
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <span className="text-micro text-arang-500">loading</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" loading={memuat} onClick={mulaiMemuat}>
                Lihat 84 kos
              </Button>
              <Button variant="secondary" loading>Menyimpan</Button>
              <Button variant="ghost" loading>Memuat</Button>
            </div>
          </div>
        </div>
      </Bagian>

      <Bagian judul="Chip">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Fasilitas">
          {fasilitas.map((label) => (
            <Chip
              key={label}
              selected={terpilih.includes(label)}
              onClick={() => toggleChip(label)}
            >
              {label}
            </Chip>
          ))}
          <Chip disabled>Dekat kampus</Chip>
          <Chip selected disabled>Terverifikasi</Chip>
        </div>
        <p className="mt-3 text-small text-arang-500">
          Terpilih: {terpilih.length ? terpilih.join(", ") : "belum ada"}
        </p>
      </Bagian>

      <Bagian judul="Badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="baik" icon={<IconCheck className="size-3" />}>Tersedia</Badge>
          <Badge tone="baik">Terverifikasi</Badge>
          <Badge tone="netral">Premium</Badge>
          <Badge tone="peringatan">Perlu dikonfirmasi</Badge>
          <Badge tone="bahaya">Penuh</Badge>
          <Badge tone="bahaya">Belum dinilai</Badge>
        </div>
      </Bagian>

      <Bagian judul="Accordion">
        <Accordion className="max-w-xl">
          <AccordionItem title="Rincian biaya" defaultOpen>
            <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-small">
              <dt className="text-arang-500">Sewa kamar</dt>
              <dd className="tabular-nums">{formatRupiah(1_200_000)}</dd>
              <dt className="text-arang-500">Listrik (perkiraan)</dt>
              <dd className="tabular-nums">{formatRupiah(250_000)}</dd>
              <dt className="text-arang-500">Air dan sampah</dt>
              <dd className="tabular-nums">{formatRupiah(100_000)}</dd>
              <dt className="font-bold">Total per bulan</dt>
              <dd className="font-bold tabular-nums">{formatRupiah(1_550_000)}</dd>
            </dl>
          </AccordionItem>
          <AccordionItem title="Aturan kos">
            Tamu boleh sampai pukul 22.00. Tidak boleh membawa hewan. Jam malam
            tidak ada, tapi gerbang dikunci pukul 23.00 dan penghuni pegang kunci.
          </AccordionItem>
          <AccordionItem title="Catatan surveyor">
            Dinding bata, suara dari kamar sebelah hampir tidak terdengar (42 dB
            saat siang). Kamar mandi bersih, ada sedikit jamur di sudut plafon.
          </AccordionItem>
        </Accordion>
      </Bagian>

      <Bagian judul="Sheet">
        <Button variant="secondary" onClick={() => setSheetTerbuka(true)}>
          Buka filter
        </Button>
        <Sheet
          open={sheetTerbuka}
          onClose={() => setSheetTerbuka(false)}
          title="Filter"
          footer={
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setTerpilih([])}>
                Hapus semua
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setSheetTerbuka(false)}
              >
                Lihat 84 kos
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            <fieldset>
              <legend className="mb-2 text-small font-bold">Fasilitas</legend>
              <div className="flex flex-wrap gap-2">
                {fasilitas.map((label) => (
                  <Chip
                    key={label}
                    selected={terpilih.includes(label)}
                    onClick={() => toggleChip(label)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2">
              <label htmlFor="harga-maks" className="text-small font-bold">
                Biaya bulanan maksimal
              </label>
              <input
                id="harga-maks"
                type="number"
                inputMode="numeric"
                placeholder="2000000"
                className="h-11 rounded-xl border border-arang-500/30 bg-putih px-3 text-body text-arang-900 placeholder:text-arang-500"
              />
              <p className="text-micro text-arang-500">
                Termasuk listrik, air, dan biaya lain.
              </p>
            </div>
            <p className="text-small text-arang-500">
              Isi panjang untuk menguji scroll di dalam sheet. Tab hanya berputar
              di dalam panel ini; Escape menutupnya.
            </p>
            {Array.from({ length: 8 }, (_, i) => (
              <SkeletonText key={i} lines={2} />
            ))}
          </div>
        </Sheet>
      </Bagian>

      <Bagian judul="Skeleton">
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="flex flex-col gap-3 rounded-2xl border border-biru-100 bg-putih p-4"
            aria-busy="true"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
            <SkeletonText lines={2} />
            <span className="sr-only">Memuat kos</span>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-biru-100 bg-putih p-4">
            <div className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-biru-100 text-small text-biru-600">
              Foto kos
            </div>
            <h3 className="text-h2">Kos Putri Melati</h3>
            <p className="text-price text-arang-900 tabular-nums">
              {formatRupiah(1_550_000)}
              <span className="ml-1 text-small font-normal text-arang-500">/bulan</span>
            </p>
            <p className="text-small text-arang-500">
              Sewa {formatRupiah(1_200_000)} + listrik, air, sampah. {formatJarak(450)} dari kampus.
            </p>
          </div>
        </div>
      </Bagian>

      <Bagian judul="Format (lib/format.ts)">
        <div className="overflow-x-auto rounded-2xl border border-biru-100 bg-putih">
          <table className="w-full text-small">
            <thead>
              <tr className="border-b border-biru-100 text-left text-micro text-arang-500">
                <th className="px-4 py-2 font-medium">Fungsi</th>
                <th className="px-4 py-2 font-medium">Masukan</th>
                <th className="px-4 py-2 font-medium">Keluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-biru-100">
              <Baris fn="formatRupiah" masukan="1550000" keluaran={formatRupiah(1_550_000)} />
              <Baris fn="formatRupiah" masukan="950000" keluaran={formatRupiah(950_000)} />
              <Baris fn="formatRupiah" masukan="0" keluaran={formatRupiah(0)} />
              <Baris fn="formatJarak" masukan="450" keluaran={formatJarak(450)} />
              <Baris fn="formatJarak" masukan="1200" keluaran={formatJarak(1200)} />
              <Baris fn="formatJarak" masukan="12000" keluaran={formatJarak(12_000)} />
              <Baris fn="formatWaktuRelatif" masukan="30 detik lalu" keluaran={formatWaktuRelatif(menitLalu(0.5), SEKARANG)} />
              <Baris fn="formatWaktuRelatif" masukan="5 menit lalu" keluaran={formatWaktuRelatif(menitLalu(5), SEKARANG)} />
              <Baris fn="formatWaktuRelatif" masukan="7 jam lalu" keluaran={formatWaktuRelatif(menitLalu(7 * 60), SEKARANG)} />
              <Baris fn="formatWaktuRelatif" masukan="3 hari lalu" keluaran={formatWaktuRelatif(menitLalu(3 * 24 * 60), SEKARANG)} />
              <Baris fn="formatWaktuRelatif" masukan="2 bulan lalu" keluaran={formatWaktuRelatif(menitLalu(65 * 24 * 60), SEKARANG)} />
              <Baris fn="formatWaktuRelatif" masukan="1 tahun lalu" keluaran={formatWaktuRelatif(menitLalu(400 * 24 * 60), SEKARANG)} />
            </tbody>
          </table>
        </div>
      </Bagian>
    </div>
  );
}

function Bagian({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`bagian-${judul}`}>
      <h2 id={`bagian-${judul}`} className="mb-4 text-h2 text-arang-900">
        {judul}
      </h2>
      {children}
    </section>
  );
}

function Baris({ fn, masukan, keluaran }: { fn: string; masukan: string; keluaran: string }) {
  return (
    <tr>
      <td className="px-4 py-2 font-medium">{fn}</td>
      <td className="px-4 py-2 text-arang-500">{masukan}</td>
      <td className="px-4 py-2 tabular-nums">{keluaran}</td>
    </tr>
  );
}
