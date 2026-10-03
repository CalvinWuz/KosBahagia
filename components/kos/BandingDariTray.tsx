"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { useBanding } from "@/lib/simpan";
import { hrefBanding } from "@/lib/kos/kunci-banding";

// /banding with no ?kos= — fill the URL from the tray on this device (kos and
// room type) so the page becomes shareable, or explain how to start.
export function BandingDariTray() {
  const tray = useBanding();
  const router = useRouter();
  const href = hrefBanding(tray.map((b) => ({ kos: b.slug || b.id, kamar: b.kamarId })));
  useEffect(() => {
    if (tray.length) router.replace(href);
  }, [tray.length, href, router]);

  if (tray.length) return <p className="text-small text-arang-500" role="status">Menyiapkan perbandingan…</p>;
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-biru-100 bg-putih p-6">
      <p className="text-h2 text-arang-900">Belum ada kos yang dibandingkan.</p>
      <p className="text-small text-arang-500">Tekan ikon panah bolak-balik di kartu kos atau di halaman kos, sampai tiga pilihan. Tipe kamar yang sedang kamu lihat ikut tersimpan. Tidak perlu akun; daftar ini tersimpan di perangkat ini.</p>
      <Link href="/cari" className={buttonClasses({ variant: "primary" })}>Cari kos</Link>
    </div>
  );
}
