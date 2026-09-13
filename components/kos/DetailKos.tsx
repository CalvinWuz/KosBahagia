"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatJarak } from "@/lib/format";
import type { DetailKosData } from "@/lib/kos/detail";
import { AksiKartu, KosCard } from "./KosCard";
import { Galeri } from "./detail/Galeri";
import { SkorRincian } from "./detail/SkorRincian";
import { RincianBiaya } from "./detail/RincianBiaya";
import { BuktiKebersihan } from "./detail/BuktiKebersihan";
import { DaftarFasilitas } from "./detail/DaftarFasilitas";
import { DaftarAturan } from "./detail/DaftarAturan";
import { CaraKeSini } from "./detail/CaraKeSini";
import { SekitarKos } from "./detail/SekitarKos";
import { CatatanSurveyor } from "./detail/CatatanSurveyor";
import { Ketersediaan, useKetersediaan } from "./detail/Ketersediaan";
import { BarAksi } from "./detail/BarAksi";
import { Blok } from "./detail/bagian";
import { Tur360Pemicu } from "./tur360/Tur360Pemicu";
import { bacaTitik, type TitikTur } from "./tur360/jenis";

const TIPE_LABEL: Record<string, string> = { putra: "Kos putra", putri: "Kos putri", campur: "Kos campur" };

// Block order is deliberate (task 05): it follows the questions in a
// renter's head. Do not rearrange.
export function DetailKos({ data, sekarang }: { data: DetailKosData; sekarang: string }) {
  const { kartu, kos, area, tipeKamar, penilaian, aturan, sekitar, media, catatan, skor, semuaFasilitas, fasilitasKos, serupa } = data;
  const sekarangDate = useMemo(() => new Date(sekarang), [sekarang]);
  const [kamarId, setKamarId] = useState(tipeKamar[0]?.id ?? null);
  const kamar = tipeKamar.find((t) => t.id === kamarId) ?? tipeKamar[0] ?? null;

  const ketersediaan = useKetersediaan(kos.id, {
    kamar: tipeKamar.map((t) => ({ id: t.id, nama: t.nama, kamar_tersedia: t.kamar_tersedia, total_kamar: t.total_kamar })),
    dikonfirmasiPada: kos.ketersediaan_dikonfirmasi_pada,
  });

  const foto = media.filter((m) => m.jenis === "foto");
  const patokan = media.filter((m) => m.jenis === "patokan");
  const titikTur = media.filter((m) => m.jenis === "foto360").map(bacaTitik).filter((t): t is TitikTur => t !== null);
  const nFasilitas = semuaFasilitas.filter((f) => f.bisa_difilter && fasilitasKos.includes(f.slug)).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:pb-16">
      <div className="flex flex-col gap-10">
        {/* 1 */}
        <div className="flex flex-col gap-3">
          <Galeri foto={foto} nama={kos.nama} ada360={titikTur.length > 0} />
          {titikTur.length > 0 && (
            <Tur360Pemicu titik={titikTur} fotoCadangan={foto.map((f) => ({ url: f.url, keterangan: f.keterangan }))} />
          )}
        </div>

        {/* 2 */}
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="netral">{TIPE_LABEL[kos.tipe] ?? kos.tipe}</Badge>
            {kos.tier !== "free" && <Badge tone="netral">Mitra</Badge>}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-h1 text-arang-900">{kos.nama}</h1>
            <AksiKartu id={kos.id} nama={kos.nama} />
          </div>
          <p className="text-body text-arang-900">
            {kos.alamat}
            {area && (
              <>
                {" "}
                <Link href={`/area/${area.slug}`} className="rounded-sm font-bold text-biru-600 hover:underline">
                  Lihat kos lain di {area.nama}
                </Link>
              </>
            )}
          </p>
          {sekitar && (
            <p className="text-small text-arang-500">
              {formatJarak(sekitar.landmark_jarak_m)} dari {sekitar.landmark_nama}
              {sekitar.landmark_menit_jalan != null && `, ${sekitar.landmark_menit_jalan} menit jalan kaki`}
            </p>
          )}
        </header>

        {/* 3 */}
        <SkorRincian skor={skor} penilaian={penilaian} sekitar={sekitar} nFasilitas={nFasilitas} />
        {/* 4 */}
        <RincianBiaya tipeKamar={tipeKamar} terpilih={kamar} onPilih={setKamarId} />
        {/* 5 */}
        <BuktiKebersihan penilaian={penilaian} />
        {/* 6 */}
        <DaftarFasilitas semua={semuaFasilitas} dimiliki={fasilitasKos} kamar={kamar} />
        {/* 7 */}
        <DaftarAturan aturan={aturan} />
        {/* 8 */}
        <CaraKeSini sekitar={sekitar} patokan={patokan} lat={kartu.lat} lng={kartu.lng} nama={kos.nama} />
        {/* 9 */}
        <SekitarKos sekitar={sekitar} />
        {/* 10 */}
        <CatatanSurveyor catatan={catatan} surveyor={kos.surveyor} disurveiPada={kos.disurvei_pada} />
        {/* 11 */}
        <Ketersediaan kosId={kos.id} data={ketersediaan} sekarang={sekarangDate} />
        {/* 12 */}
        <Blok id="serupa" judul="Kos serupa" keterangan={area ? `Di ${area.nama}, kisaran harga mirip.` : undefined}>
          {serupa.length === 0 ? (
            <p className="text-small text-arang-500">
              Belum ada pembanding di area ini.{" "}
              <Link href="/cari" className="font-bold text-biru-600 hover:underline">Cari kos lain</Link>
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-3">
              {serupa.map((k) => (
                <li key={k.id}><KosCard kos={k} sekarang={sekarangDate} /></li>
              ))}
            </ul>
          )}
        </Blok>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-20 flex flex-col gap-3">
          <BarAksi kosId={kos.id} namaKos={kos.nama} whatsapp={kos.whatsapp} kamar={kamar} desktop />
          <dl className="rounded-2xl border border-biru-100 bg-putih px-4 text-small">
            <div className="flex justify-between py-2"><dt className="text-arang-500">Kontak</dt><dd className="text-arang-900">{kos.kontak_nama}</dd></div>
            <div className="flex justify-between border-t border-biru-100 py-2"><dt className="text-arang-500">Kamar tersedia</dt><dd className="text-arang-900 tabular-nums">{ketersediaan.kamar.reduce((a, k) => a + k.kamar_tersedia, 0)}</dd></div>
            {kos.jumlah_lantai != null && <div className="flex justify-between border-t border-biru-100 py-2"><dt className="text-arang-500">Lantai</dt><dd className="text-arang-900 tabular-nums">{kos.jumlah_lantai}{kos.ada_lift ? ", ada lift" : ""}</dd></div>}
            {kos.tahun_bangunan != null && <div className="flex justify-between border-t border-biru-100 py-2"><dt className="text-arang-500">Dibangun</dt><dd className="text-arang-900 tabular-nums">{kos.tahun_bangunan}</dd></div>}
          </dl>
        </div>
      </aside>

      <BarAksi kosId={kos.id} namaKos={kos.nama} whatsapp={kos.whatsapp} kamar={kamar} />
    </div>
  );
}
