import type { Metadata } from "next";
import Link from "next/link";
import { TabelBanding } from "@/components/kos/TabelBanding";
import { BandingDariTray } from "@/components/kos/BandingDariTray";
import { supabaseServer } from "@/lib/supabase/server";
import { ambilBanding, bacaKunciBanding } from "@/lib/kos/banding";
import { tulisKunciBanding } from "@/lib/kos/kunci-banding";

export const metadata: Metadata = {
  title: "Bandingkan kos",
  robots: { index: false, follow: false },
};

const SITUS = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com";

// Server-rendered from ?kos=slug:kamar,… so a shared link shows the same
// rooms to anyone, signed out, on the first paint.
export default async function HalamanBanding({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kunci = bacaKunciBanding(sp.kos);
  const kos = kunci.length ? await ambilBanding(supabaseServer(), kunci) : [];
  const url = `${SITUS}/banding?kos=${tulisKunciBanding(kos.map((k) => ({ kos: k.kunci.kos, kamar: k.kamar?.id ?? k.kunci.kamar })))}`;
  const hilang = kunci.length - kos.length;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 pb-16">
      <h1 className="text-h1 text-arang-900">Bandingkan kos</h1>
      {kunci.length === 0 ? (
        <BandingDariTray />
      ) : kos.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-biru-100 bg-putih p-6">
          <p className="text-body text-arang-900">Kos di tautan ini sudah tidak tayang.</p>
          <Link href="/cari" className="text-small font-bold text-biru-600 hover:underline">Cari kos lain</Link>
        </div>
      ) : (
        <>
          {hilang > 0 && <p className="text-small text-arang-500">{hilang} kos dari tautan ini sudah tidak tayang dan tidak ikut dibandingkan.</p>}
          {kos.length < 2 && (
            <p className="text-small text-arang-500">
              Baru satu pilihan. <Link href="/cari" className="font-bold text-biru-600 hover:underline">Tambah satu lagi</Link> supaya ada yang dibandingkan.
            </p>
          )}
          <TabelBanding kos={kos} url={url} sekarang={new Date().toISOString()} />
        </>
      )}
    </div>
  );
}
