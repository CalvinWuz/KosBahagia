"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { useBanding, useSimpanan } from "@/lib/simpan";
import { useHrefCariTerakhir } from "@/lib/navigasi";
import { hrefBanding } from "@/lib/kos/kunci-banding";

// /banding with no ?kos= — fill the URL from the tray on this device (kos and
// room type) so the page becomes shareable, or explain how to start.
export function BandingDariTray() {
  const tray = useBanding();
  const simpanan = useSimpanan();
  const hrefCari = useHrefCariTerakhir();
  const router = useRouter();
  const href = hrefBanding(tray.map((b) => ({ kos: b.slug || b.id, kamar: b.kamarId })));
  useEffect(() => {
    if (tray.length) router.replace(href);
  }, [tray.length, href, router]);

  if (tray.length) return <p className="text-small text-arang-500" role="status">Menyiapkan perbandingan…</p>;
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-biru-100 bg-putih p-6">
      <p className="text-h2 text-arang-900">Belum ada kos yang dibandingkan.</p>
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-small text-arang-900">
        <li>Buka hasil pencarian atau halaman kos.</li>
        <li>Tekan tombol <b>Bandingkan</b> di kos yang kamu minati. Tombolnya berubah menjadi <b>Dalam banding</b>.</li>
        <li>Pilih dua sampai tiga kos, lalu tekan <b>Bandingkan</b> di panel bawah atau buka halaman ini lagi.</li>
      </ol>
      <p className="text-small text-arang-500">Tipe kamar yang sedang kamu lihat ikut dibandingkan. Tidak perlu akun; daftarnya tersimpan di perangkat ini.</p>
      <div className="flex flex-wrap gap-3">
        <Link href={hrefCari} className={buttonClasses({ variant: "primary" })}>Cari kos</Link>
        {simpanan.length > 0 && (
          <Link href="/disimpan" className={buttonClasses({ variant: "secondary", bungkus: true })}>Pilih dari simpanan ({simpanan.length})</Link>
        )}
      </div>
    </div>
  );
}
