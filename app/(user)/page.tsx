import type { Metadata } from "next";
import { HeroSketch } from "@/components/beranda/HeroSketch";
import { BaruDisurvei } from "@/components/beranda/BaruDisurvei";
import { PenjelasBiaya } from "@/components/beranda/PenjelasBiaya";
import { CaraVerifikasi } from "@/components/beranda/CaraVerifikasi";
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
  const kosong = { area: [] as AreaRingkas[], kos: [] as KosKartu[], judul: "Baru disurvei", sekarang };
  try {
    const db = supabaseServer();
    const [area, kartu] = await Promise.all([
      db.from("area").select("slug, nama, tipe").order("tipe").order("nama"),
      db
        .from("kos_kartu")
        .select("*")
        .eq("status", "tayang")
        .order("disurvei_pada", { ascending: false })
        .limit(24),
    ]);
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
    return { area: (area.data ?? []) as AreaRingkas[], kos, judul, sekarang };
  } catch {
    return kosong;
  }
}

export default async function Beranda() {
  const { area, kos, judul, sekarang } = await muatData();
  const kampus = area.filter((a) => a.tipe === "kampus");

  return (
    <div className="flex flex-col gap-12 pb-16">
      <section className="bg-biru-100">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-[1.1fr_1fr] lg:py-16">
          <div className="flex flex-col gap-5">
            <h1 className="max-w-xl text-display text-arang-900">
              Kos yang sudah kami cek langsung
            </h1>
            <p className="max-w-xl text-body text-arang-900">
              Biaya bulanan sebenarnya, skor kebersihan, dan catatan surveyor untuk tiap kos di
              Jakarta Barat dan Malang.
            </p>
            <PencarianHero areaPopuler={area} />
          </div>
          <HeroSketch className="mx-auto h-auto w-full max-w-md lg:max-w-none" />
        </div>
      </section>

      <section aria-labelledby="preset" className="mx-auto w-full max-w-6xl px-4">
        <h2 id="preset" className="text-h2 text-arang-900">
          Mulai dari yang paling kamu butuhkan
        </h2>
        <div className="mt-4">
          <PresetGrid kampus={kampus} />
        </div>
      </section>

      <BaruDisurvei kos={kos} judul={judul} sekarang={sekarang} />
      <PenjelasBiaya />
      <CaraVerifikasi />
    </div>
  );
}
