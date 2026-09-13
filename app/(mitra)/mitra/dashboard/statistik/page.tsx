import type { Metadata } from "next";
import Link from "next/link";
import { mitraServer } from "@/lib/supabase/mitra";
import { dasarMitra } from "@/lib/mitra/dasar";
import { AWAL_BULAN, wajibSesi } from "@/lib/mitra/sesi";

export const metadata: Metadata = { title: "Statistik" };

// Views, WhatsApp clicks, position in the area search, and the area median.
// The numbers sell Premium on their own; one contextual line when below
// median, nothing more.
export default async function Statistik() {
  const dasar = await dasarMitra();
  const sesi = await wajibSesi(`${dasar}/dashboard/statistik`);
  const db = await mitraServer();
  const awal = AWAL_BULAN();

  const data = await Promise.all(
    sesi.kos.map(async (k) => {
      const [kunjungan, klik, posisi, median] = await Promise.all([
        db.from("kunjungan_kos").select("id", { count: "exact", head: true }).eq("kos_id", k.id).gte("dibuat_pada", awal),
        db.from("klik_wa").select("id", { count: "exact", head: true }).eq("kos_id", k.id).gte("dibuat_pada", awal),
        db.rpc("posisi_di_area", { p_kos_id: k.id }),
        db.rpc("median_area_bulan_ini", { p_kos_id: k.id }),
      ]);
      return {
        kos: k,
        kunjungan: kunjungan.count ?? 0,
        klik: klik.count ?? 0,
        posisi: posisi.data ?? null,
        medianKunjungan: Number(median.data?.[0]?.median_kunjungan ?? 0),
        medianKlik: Number(median.data?.[0]?.median_klik ?? 0),
      };
    }),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 pb-16">
      <div>
        <h1 className="text-h1 text-arang-900">Statistik</h1>
        <p className="text-small text-arang-500">Bulan ini, dibanding median kos lain di area yang sama.</p>
      </div>
      {data.length === 0 && <p className="text-body text-arang-500">Belum ada kos yang tertaut.</p>}
      <ul className="flex flex-col gap-4">
        {data.map((d) => {
          const bawahMedian = d.klik < d.medianKlik || d.kunjungan < d.medianKunjungan;
          return (
            <li key={d.kos.id} className="rounded-2xl border border-arang-500/20 bg-putih p-4">
              <h2 className="text-h2 text-arang-900">{d.kos.nama}</h2>
              <p className="text-small text-arang-500">
                {d.posisi != null ? `Posisi ${d.posisi} di hasil pencarian area` : "Belum masuk hasil pencarian area (cek ketersediaan atau status tayang)"}
              </p>
              <dl className="mt-3 flex flex-col gap-3">
                <Batang label="Dilihat" nilai={d.kunjungan} median={d.medianKunjungan} />
                <Batang label="Chat WhatsApp" nilai={d.klik} median={d.medianKlik} />
              </dl>
              {bawahMedian && d.kos.tier === "free" && (
                <p className="mt-3 text-small text-arang-900">
                  Di bawah median area. Paket Premium menaikkan posisi di hasil pencarian dan kualitas foto.{" "}
                  <Link href={`${dasar}/dashboard/paket`} className="font-bold text-biru-600 hover:underline">Lihat paket</Link>
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Batang({ label, nilai, median }: { label: string; nilai: number; median: number }) {
  const maks = Math.max(nilai, median, 1);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <dt className="text-small text-arang-900">{label}</dt>
        <dd className="text-small text-arang-500 tabular-nums">
          <span className="text-h2 text-arang-900">{nilai}</span> vs median {Math.round(median)}
        </dd>
      </div>
      <div className="mt-1 flex flex-col gap-1" aria-hidden="true">
        <div className="h-3 rounded-full bg-biru-500" style={{ width: `${(nilai / maks) * 100}%`, minWidth: nilai ? "0.5rem" : 0 }} />
        <div className="h-3 rounded-full bg-arang-500/30" style={{ width: `${(median / maks) * 100}%`, minWidth: median ? "0.5rem" : 0 }} />
      </div>
      <p className="mt-0.5 text-micro text-arang-500">biru: kos ini, abu: median area</p>
    </div>
  );
}
