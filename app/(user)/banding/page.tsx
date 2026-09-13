import type { Metadata } from "next";
import Link from "next/link";
import { TabelBanding } from "@/components/kos/TabelBanding";
import { BandingDariTray } from "@/components/kos/BandingDariTray";
import { supabaseServer } from "@/lib/supabase/server";
import { ambilBanding, bacaKunciBanding } from "@/lib/kos/banding";

export const metadata: Metadata = {
  title: "Bandingkan kos",
  robots: { index: false, follow: false },
};

const SITUS = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com";

// Server-rendered from ?kos=a,b,c so a shared link shows the same table to
// anyone, signed out, on the first paint.
export default async function HalamanBanding({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kunci = bacaKunciBanding(sp.kos);
  const kos = kunci.length ? await ambilBanding(supabaseServer(), kunci) : [];
  const url = `${SITUS}/banding?kos=${kos.map((k) => k.kartu.slug).join(",")}`;

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
          {kos.length < 2 && (
            <p className="text-small text-arang-500">
              Baru satu kos. <Link href="/cari" className="font-bold text-biru-600 hover:underline">Tambah satu lagi</Link> supaya ada yang dibandingkan.
            </p>
          )}
          <TabelBanding kos={kos} url={url} />
        </>
      )}
    </div>
  );
}
