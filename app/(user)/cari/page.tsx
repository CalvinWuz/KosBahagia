import type { Metadata } from "next";
import { Suspense } from "react";
import { DaftarSkeleton, HasilPencarian, type DataHasil } from "@/components/cari/HasilPencarian";
import type { FasilitasFilter } from "@/components/cari/FilterSheet";
import { supabaseServer } from "@/lib/supabase/server";
import { bacaCariParams } from "@/lib/cari-params";
import { ambilHasil } from "@/lib/cari/ambil";
import { tentukanPusat, type AreaPublik } from "@/lib/cari/pusat";

export const metadata: Metadata = {
  title: "Cari kos",
  description: "Hasil pencarian kos dengan biaya bulanan sebenarnya, skor kebersihan dan kedap suara.",
};

type Mentah = Record<string, string | string[] | undefined>;

// Same serialisation the client's useSearchParams().toString() produces,
// so the first client render knows its data is already current.
function kunciDari(sp: Mentah): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
    else if (v != null) usp.append(k, v);
  }
  return usp.toString();
}

// Server-rendered first page so results are on screen before any JS runs;
// every filter change after that is fetched in the browser.
export default async function CariPage({ searchParams }: { searchParams: Promise<Mentah> }) {
  const sp = await searchParams;
  const params = bacaCariParams(sp);
  const kunci = kunciDari(sp);
  const sekarang = new Date().toISOString();
  const db = supabaseServer();

  const [areaRes, fasRes] = await Promise.all([
    db.from("area_publik").select("*").order("nama"),
    db.from("fasilitas").select("slug, nama, kategori").eq("bisa_difilter", true).order("kategori").order("nama"),
  ]);
  const areas = (areaRes.data ?? []) as AreaPublik[];
  const fasilitas = (fasRes.data ?? []) as FasilitasFilter[];
  const pusat = tentukanPusat(params, areas);

  let awal: DataHasil;
  try {
    awal = { kunci, ...(await ambilHasil(db, params, pusat)) };
  } catch (e) {
    awal = { kunci, hasil: [], total: 0, error: e instanceof Error ? e.message : "Gagal memuat" };
  }

  return (
    <Suspense fallback={<div className="px-4 py-4"><DaftarSkeleton /></div>}>
      <HasilPencarian awal={awal} areas={areas} fasilitas={fasilitas} sekarang={sekarang} />
    </Suspense>
  );
}
