import type { Metadata } from "next";
import { HeroVisual, type ContohHero } from "@/components/beranda/HeroVisual";
import { MODE_DEMO } from "@/lib/demo";
import { IconCheck, IconPin, IconJam } from "@/components/ui/Icon";
import { BaruDisurvei } from "@/components/beranda/BaruDisurvei";
import { PenjelasBiaya } from "@/components/beranda/PenjelasBiaya";
import { CaraVerifikasi } from "@/components/beranda/CaraVerifikasi";
import { LanjutkanCari } from "@/components/beranda/LanjutkanCari";
import { PanduanSingkat } from "@/components/panduan/PanduanSingkat";
import { PencarianHero, type AreaRingkas } from "@/components/cari/PencarianHero";
import { PresetGrid } from "@/components/cari/PresetGrid";
import type { KosKartu } from "@/components/kos/KosCard";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { absolute: "Kos Bahagia — Kos yang sudah kami cek langsung" },
};

// The rail and area list change slowly; rebuild every 10 minutes.
export const revalidate = 600;

async function muatData() {
  const sekarang = new Date();
  const kosong = { area: [] as AreaRingkas[], kos: [] as KosKartu[], judul: "Baru disurvei", sekarang, jumlahKos: 0, contoh: null as ContohHero | null };
  try {
    const db = supabaseServer();
    const [area, kartu, hitung, calon] = await Promise.all([
      db.from("area").select("slug, nama, tipe").order("tipe").order("nama"),
      db
        .from("kos_kartu")
        .select("*")
        .eq("status", "tayang")
        .order("disurvei_pada", { ascending: false })
        .limit(24),
      db.from("kos_kartu").select("id", { count: "exact", head: true }).eq("status", "tayang"),
      // Hero example: a real, unpaid listing that shows the product at its
      // best and whose headline room has space right now.
      db
        .from("kos_kartu")
        .select("*")
        .eq("status", "tayang")
        .eq("tier", "free")
        .eq("perlu_dikonfirmasi", false)
        .gt("kamar_acuan_tersedia", 0)
        .eq("jumlah_red_flags", 0)
        .gte("skor_kebersihan", 4)
        .gte("skor_kedap", 4)
        .order("skor", { ascending: false })
        .order("slug")
        .limit(1)
        .maybeSingle(),
    ]);
    let contoh: ContohHero | null = null;
    if (calon.data?.id) {
      const [kos, nilai] = await Promise.all([
        db.from("kos").select("surveyor, disurvei_pada").eq("id", calon.data.id).maybeSingle(),
        db.from("kos_penilaian").select("db_ambient, db_tes").eq("kos_id", calon.data.id).maybeSingle(),
      ]);
      contoh = {
        kartu: calon.data,
        surveyor: kos.data?.surveyor ?? null,
        disurveiPada: kos.data?.disurvei_pada ?? null,
        dbAmbient: nilai.data?.db_ambient ?? null,
        dbTes: nilai.data?.db_tes ?? null,
      };
    }
    // Always the six newest surveys; the label says how recent they are.
    const kos = (kartu.data ?? []).slice(0, 6);
    const batas = (hari: number) => new Date(sekarang.getTime() - hari * 86_400_000);
    const semuaSejak = (hari: number) =>
      kos.length > 0 && kos.every((k) => k.disurvei_pada && new Date(k.disurvei_pada) >= batas(hari));
    const judul = semuaSejak(7)
      ? "Baru disurvei minggu ini"
      : semuaSejak(30)
        ? "Baru disurvei bulan ini"
        : "Terakhir disurvei";
    return { area: (area.data ?? []) as AreaRingkas[], kos, judul, sekarang, jumlahKos: hitung.count ?? 0, contoh };
  } catch {
    return kosong;
  }
}

export default async function Beranda() {
  const { area, kos, judul, sekarang, jumlahKos, contoh } = await muatData();
  const kampus = area.filter((a) => a.tipe === "kampus");
  const kecamatan = area.filter((a) => a.tipe === "kecamatan");
  const terbaru = kos[0]?.disurvei_pada ? new Date(kos[0].disurvei_pada) : null;
  const hariSejak = terbaru ? Math.max(0, Math.round((sekarang.getTime() - terbaru.getTime()) / 86_400_000)) : null;

  return (
    <div className="flex flex-col gap-14 pb-16 lg:gap-20">
      {/* Hero: cheerful on the front door. A tinted block with a faint dot
          grid, the headline, the one search box, and the product itself
          drawn beside it. */}
      <section className="relative overflow-hidden bg-biru-100">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--color-biru-500)_1px,transparent_1px)] [background-size:22px_22px] opacity-[0.12]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-putih/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:py-20">
          <div className="flex flex-col gap-5">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-putih/80 py-1 pr-3 pl-1.5 text-micro font-bold text-biru-600 shadow-sm">
              <span className="grid size-5 place-items-center rounded-full bg-daun-100 text-daun-700">
                <IconCheck className="size-3" />
              </span>
              Disurvei langsung, satu kecamatan dulu
            </p>
            <h1 className="max-w-xl text-display text-arang-900 lg:text-display-lg">
              Kos yang sudah kami cek langsung
            </h1>
            <p className="max-w-lg text-body text-arang-900">
              Biaya bulanan sebenarnya, skor kebersihan dan kedap suara, plus catatan surveyor untuk
              tiap kos di Jakarta Barat dan Malang.
            </p>
            <PencarianHero areaPopuler={area} />
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-small text-arang-900" aria-label="Fakta singkat">
              <li className="inline-flex items-center gap-1.5">
                <IconCheck className="size-4 text-daun-700" />
                <span>{MODE_DEMO ? <><b className="tabular-nums">{jumlahKos}</b> kos contoh (prototipe)</> : <><b className="tabular-nums">{jumlahKos}</b> kos disurvei</>}</span>
              </li>
              <li className="inline-flex items-center gap-1.5">
                <IconPin className="size-4 text-biru-600" />
                {kecamatan.length > 0 ? kecamatan.map((k) => k.nama).join(" dan ") : "Jakarta Barat dan Malang"}
              </li>
              {hariSejak != null && (
                <li className="inline-flex items-center gap-1.5">
                  <IconJam className="size-4 text-biru-600" />
                  {MODE_DEMO ? "data contoh diperbarui" : "survei terakhir"} {hariSejak === 0 ? "hari ini" : `${hariSejak} hari lalu`}
                </li>
              )}
            </ul>
          </div>
          <HeroVisual contoh={contoh} className="mt-2 lg:mt-0" />
        </div>
      </section>

      <PanduanSingkat fokusKe="preset" />
      <LanjutkanCari />

      <section aria-labelledby="preset" className="mx-auto w-full max-w-6xl px-4">
        <p className="text-micro font-bold text-biru-600">Mulai dari sini</p>
        <h2 id="preset" className="mt-1 text-h2 text-arang-900">
          Mulai dari yang paling kamu butuhkan
        </h2>
        <p className="mt-1 text-small text-arang-500">Satu ketukan ke hasil yang sudah difilter.</p>
        <div className="mt-5">
          <PresetGrid kampus={kampus} />
        </div>
      </section>

      <BaruDisurvei kos={kos} judul={judul} sekarang={sekarang} />
      <PenjelasBiaya />
      <CaraVerifikasi />
    </div>
  );
}
