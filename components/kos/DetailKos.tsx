"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { IconKembali } from "@/components/ui/Icon";
import { SkorBadge } from "@/components/kos/SkorBadge";
import { formatJarak, formatTanggal } from "@/lib/format";
import { kamarAcuan, kamarDariUrl, statusKamar } from "@/lib/kamar";
import { kelebihanKekurangan } from "@/lib/kos/ringkasan";
import { PenandaDemo } from "@/components/ui/PenandaDemo";
import { useKembali } from "@/lib/navigasi";
import { hrefCari } from "@/lib/cari-params";
import type { DetailKosData } from "@/lib/kos/detail";
import { kekuatanKos } from "@/lib/kos/kekuatan";
import { cn } from "@/lib/cn";
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
import { RingkasanKeputusan } from "./detail/RingkasanKeputusan";
import { Blok } from "./detail/bagian";
import { NavBagian, type Bagian } from "./detail/NavBagian";
import { Tur360Pemicu } from "./tur360/Tur360Pemicu";
import { BantuanJarak } from "./BantuanJarak";
import { TombolMenu } from "@/components/layout/Navigasi";
import { bacaTitik, type TitikTur } from "./tur360/jenis";
import { CatatKunjungan } from "./CatatKunjungan";

const TIPE_LABEL: Record<string, string> = { putra: "Kos putra", putri: "Kos putri", campur: "Kos campur" };

// ?kamar= read without useSearchParams, so the page stays statically
// rendered; the server snapshot is "no choice" and the client corrects it.
const langgananUrl = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};
const bacaKamarUrl = () => new URLSearchParams(window.location.search).get("kamar");
const tanpaKamarUrl = () => null;

const BAGIAN: Bagian[] = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "skor", label: "Skor" },
  { id: "biaya", label: "Biaya" },
  { id: "kebersihan", label: "Kebersihan & suara" },
  { id: "fasilitas", label: "Fasilitas" },
  { id: "aturan", label: "Aturan" },
  { id: "cara-ke-sini", label: "Lokasi" },
  { id: "sekitar", label: "Sekitar" },
  { id: "catatan", label: "Catatan surveyor" },
  { id: "ketersediaan", label: "Ketersediaan" },
];

// Block order is deliberate (task 05): it follows the questions in a
// renter's head. Do not rearrange. The one layout exception: on desktop
// the title block sits above the gallery so name, score and address are on
// the first screen; blocks 3–12 keep their order everywhere.
export function DetailKos({ data, sekarang }: { data: DetailKosData; sekarang: string }) {
  const { kartu, kos, area, tipeKamar, penilaian, aturan, sekitar, landmark, media, catatan, skor, semuaFasilitas, fasilitasKos, serupa } = data;
  const sekarangDate = useMemo(() => new Date(sekarang), [sekarang]);
  const kembali = useKembali(area ? hrefCari({ area: area.slug }) : "/cari");

  const ketersediaan = useKetersediaan(kos.id, {
    kamar: tipeKamar.map((t) => ({ id: t.id, nama: t.nama, kamar_tersedia: t.kamar_tersedia, total_kamar: t.total_kamar })),
    dikonfirmasiPada: kos.ketersediaan_dikonfirmasi_pada,
  });
  // Live counts override the static page's numbers for every room type.
  const kamarHidup = useMemo(
    () => tipeKamar.map((t) => ({ ...t, kamar_tersedia: ketersediaan.kamar.find((k) => k.id === t.id)?.kamar_tersedia ?? t.kamar_tersedia })),
    [tipeKamar, ketersediaan],
  );

  // The selected room type drives price, status, summary, contact message,
  // save and compare. It lives in ?kamar= so reloads, shared links and the
  // back button keep it; without one the cheapest room with space is shown.
  const kamarUrl = useSyncExternalStore(langgananUrl, bacaKamarUrl, tanpaKamarUrl);
  const [pilihan, setPilihan] = useState<string | null>(null);
  const kamarId = pilihan ?? kamarDariUrl(tipeKamar, kamarUrl)?.id ?? kartu.kamar_id ?? kamarAcuan(tipeKamar)?.id ?? null;
  const pilihKamar = useCallback((id: string) => {
    setPilihan(id);
    const url = new URL(window.location.href);
    url.searchParams.set("kamar", id);
    window.history.replaceState(window.history.state, "", url);
  }, []);
  const kamar = kamarHidup.find((t) => t.id === kamarId) ?? kamarHidup[0] ?? null;
  const status = kamar ? statusKamar(kamar, ketersediaan.dikonfirmasiPada, sekarangDate) : null;

  const foto = media.filter((m) => m.jenis === "foto");
  const patokan = media.filter((m) => m.jenis === "patokan");
  const titikTur = media.filter((m) => m.jenis === "foto360").map(bacaTitik).filter((t): t is TitikTur => t !== null);
  const nFasilitas = semuaFasilitas.filter((f) => f.bisa_difilter && fasilitasKos.includes(f.slug)).length;
  const kekuatan = kekuatanKos({ skor, sekitar });
  const ringkasan = {
    id: kos.id,
    slug: kos.slug,
    nama: kos.nama,
    kamarId: kamar?.id ?? null,
    kamarNama: kamar?.nama ?? null,
    total_bulanan: kamar?.total_bulanan ?? kartu.total_bulanan,
    kamar_tersedia: kamar?.kamar_tersedia ?? null,
  };
  const { kelebihan, kekurangan } = kelebihanKekurangan({
    kebersihan: skor?.kebersihan ?? null,
    transparansi: skor?.transparansi ?? null,
    penilaian,
    aturan,
    sekitar,
    redFlags: catatan?.red_flags.length ?? 0,
    kamar,
    status,
  });

  // The mobile header shows the kos name once the title has scrolled away.
  const judulRef = useRef<HTMLHeadingElement>(null);
  const [judulLewat, setJudulLewat] = useState(false);
  useEffect(() => {
    const el = judulRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setJudulLewat(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: "-56px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const bagianTersedia = BAGIAN.filter((b) => b.id !== "cara-ke-sini" || sekitar);

  return (
    <>
      {/* Mobile header: back, name (after scrolling), labelled save and
          compare, and the main menu (the global header is hidden here). */}
      <div className="sticky top-0 z-40 border-b border-biru-100 bg-putih lg:hidden">
        {/* Wraps instead of overflowing when text is enlarged; one row otherwise. */}
        <div className="flex min-h-14 flex-wrap items-center justify-end gap-1 px-1">
          <button type="button" onClick={kembali} aria-label="Kembali" className="grid size-11 shrink-0 place-items-center rounded-full text-arang-900 hover:bg-biru-100">
            <IconKembali />
          </button>
          <p aria-hidden={!judulLewat} className={cn("min-w-0 flex-1 basis-0 truncate px-1 text-body font-bold text-arang-900 transition-opacity duration-150", judulLewat ? "opacity-100" : "opacity-0")}>
            {kos.nama}
          </p>
          <AksiKartu kos={ringkasan} tampilan="tumpuk" />
          <TombolMenu tumpuk />
        </div>
        <NavBagian bagian={bagianTersedia} className={cn("border-t border-biru-100 transition-opacity duration-150", judulLewat ? "opacity-100" : "hidden")} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-4 pb-28 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:pb-16">
        <CatatKunjungan kosId={kos.id} />
        <div className="flex flex-col gap-10">
          {/* 1 */}
          <div className="flex flex-col gap-3">
            <Galeri
              foto={foto}
              nama={kos.nama}
              aksi={titikTur.length > 0 ? <Tur360Pemicu titik={titikTur} fotoCadangan={foto.map((f) => ({ url: f.url, keterangan: f.keterangan }))} /> : undefined}
            />
          </div>

          {/* 2 */}
          <header className="flex flex-col gap-2 lg:order-first">
            <nav aria-label="Breadcrumb" className="hidden lg:block">
              <ol className="flex flex-wrap items-center gap-1 text-small text-arang-500">
                <li><Link href="/" className="rounded-sm hover:text-biru-600 hover:underline">Beranda</Link></li>
                {area && (
                  <>
                    <li aria-hidden="true">›</li>
                    <li><Link href={`/area/${area.slug}`} className="rounded-sm hover:text-biru-600 hover:underline">{area.nama}</Link></li>
                  </>
                )}
                <li aria-hidden="true">›</li>
                <li aria-current="page" className="text-arang-900">{kos.nama}</li>
              </ol>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="netral">{TIPE_LABEL[kos.tipe] ?? kos.tipe}</Badge>
              {kos.tier !== "free" && (
                <Badge tone="netral" title="Pemilik membayar paket untuk foto dan tur 360°. Skor tidak terpengaruh.">Mitra berbayar</Badge>
              )}
              <PenandaDemo />
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 ref={judulRef} className="text-h1 text-arang-900">{kos.nama}</h1>
              {/* Phones have the same buttons in the sticky bar above. */}
              <div className="hidden lg:block">
                <AksiKartu kos={ringkasan} tampilan="judul" />
              </div>
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
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-arang-500">
                <span>
                  {sekitar.landmark_menit_jalan != null ? `${sekitar.landmark_menit_jalan} menit jalan kaki` : formatJarak(sekitar.landmark_jarak_m)} dari {sekitar.landmark_nama}
                  {sekitar.landmark_menit_jalan != null ? ` (${formatJarak(sekitar.landmark_jarak_m)})` : ""}, dicatat surveyor
                </span>
                <BantuanJarak />
              </div>
            )}
            {kos.disurvei_pada && kos.surveyor && (
              <p className="text-small text-arang-500">
                Disurvei {formatTanggal(kos.disurvei_pada)} oleh {kos.surveyor}.{" "}
                <Link href="/cara-kami-menilai" className="font-bold text-biru-600 hover:underline">Cara kami menilai</Link>
              </p>
            )}
          </header>

          <>
            {/* 2b: decision summary, computed from the blocks below */}
            <RingkasanKeputusan
              tipe={kos.tipe}
              pasangan={aturan?.pasangan ?? null}
              tipeKamar={kamarHidup}
              kamar={kamar}
              onPilih={pilihKamar}
              status={status}
              dikonfirmasiPada={ketersediaan.dikonfirmasiPada}
              disurveiPada={kos.disurvei_pada}
              surveyor={kos.surveyor}
              kelebihan={kelebihan}
              kekurangan={kekurangan}
              sekarang={sekarangDate}
            />
            {/* 3 */}
            <SkorRincian skor={skor} penilaian={penilaian} sekitar={sekitar} nFasilitas={nFasilitas} tipeKamar={tipeKamar} kamar={kamar} sekarang={sekarangDate} disurveiPada={kos.disurvei_pada} />
            {/* 4 */}
            <RincianBiaya tipeKamar={kamarHidup} terpilih={kamar} onPilih={pilihKamar} dikonfirmasiPada={ketersediaan.dikonfirmasiPada} sekarang={sekarangDate} />
            {/* 5 */}
            <BuktiKebersihan penilaian={penilaian} disurveiPada={kos.disurvei_pada} />
            {/* 6 */}
            <DaftarFasilitas semua={semuaFasilitas} dimiliki={fasilitasKos} kamar={kamar} />
            {/* 7 */}
            <DaftarAturan aturan={aturan} />
            {/* 8 */}
            <CaraKeSini sekitar={sekitar} patokan={patokan} lat={kartu.lat} lng={kartu.lng} landmark={landmark} nama={kos.nama} />
            {/* 9 */}
            <SekitarKos sekitar={sekitar} kamar={kamar} disurveiPada={kos.disurvei_pada} />
            {/* 10 */}
            <CatatanSurveyor catatan={catatan} surveyor={kos.surveyor} disurveiPada={kos.disurvei_pada} />
            {/* 11 */}
            <Ketersediaan kosId={kos.id} data={ketersediaan} terpilihId={kamar?.id ?? null} sekarang={sekarangDate} />
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
          </>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20 flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-biru-100 bg-putih px-4 py-3">
              <SkorBadge skor={skor?.skor ?? null} />
              <p className="min-w-0 truncate text-small text-arang-500">
                {kekuatan.length > 0 ? kekuatan.join(", ") : "Skor Bahagia dari survei kami"}
              </p>
            </div>
            <BarAksi kosId={kos.id} namaKos={kos.nama} whatsapp={kos.whatsapp} kamar={kamar} status={status} desktop />
            <dl className="rounded-2xl border border-biru-100 bg-putih px-4 text-small">
              <div className="flex justify-between gap-3 py-2"><dt className="text-arang-500">Kontak</dt><dd className="text-right text-arang-900">{kos.kontak_nama}</dd></div>
              <div className="flex justify-between gap-3 border-t border-biru-100 py-2">
                <dt className="text-arang-500">Kamar {kamar?.nama ?? "ini"}</dt>
                <dd className="text-right text-arang-900 tabular-nums">{status ? `${status.label}, ${status.tersedia} dari ${status.total}` : "Belum dicatat"}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-biru-100 py-2">
                <dt className="text-arang-500">Seluruh kos</dt>
                <dd className="text-right text-arang-900 tabular-nums">{ketersediaan.kamar.reduce((a, k) => a + k.kamar_tersedia, 0)} kamar kosong, {ketersediaan.kamar.length} tipe</dd>
              </div>
              {kos.jumlah_lantai != null && <div className="flex justify-between border-t border-biru-100 py-2"><dt className="text-arang-500">Lantai</dt><dd className="text-arang-900 tabular-nums">{kos.jumlah_lantai}{kos.ada_lift ? ", ada lift" : ""}</dd></div>}
              {kos.tahun_bangunan != null && <div className="flex justify-between border-t border-biru-100 py-2"><dt className="text-arang-500">Dibangun</dt><dd className="text-arang-900 tabular-nums">{kos.tahun_bangunan}</dd></div>}
            </dl>
            <NavBagian bagian={bagianTersedia} tampilan="daftar" className="rounded-2xl border border-biru-100 bg-putih p-2" />
          </div>
        </aside>

        <BarAksi kosId={kos.id} namaKos={kos.nama} whatsapp={kos.whatsapp} kamar={kamar} status={status} />
      </div>
    </>
  );
}
