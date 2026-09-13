"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { useBanding } from "@/lib/simpan";

// /banding with no ?kos= — fill the URL from the local tray so the page
// becomes shareable, or explain how to start.
export function BandingDariTray() {
  const tray = useBanding();
  const router = useRouter();
  const kunci = tray.map((b) => b.slug || b.id).join(",");
  useEffect(() => {
    if (kunci) router.replace(`/banding?kos=${kunci}`);
  }, [kunci, router]);

  if (kunci) return <p className="text-small text-arang-500">Menyiapkan perbandingan…</p>;
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-biru-100 bg-putih p-6">
      <p className="text-h2 text-arang-900">Belum ada kos yang dibandingkan.</p>
      <p className="text-small text-arang-500">Tekan ikon panah bolak-balik di kartu kos, maksimal tiga kos. Tidak perlu akun.</p>
      <Link href="/cari" className={buttonClasses({ variant: "primary" })}>Cari kos</Link>
    </div>
  );
}
