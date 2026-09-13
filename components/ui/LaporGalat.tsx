"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonClasses } from "@/components/ui/Button";

// Shared body of the 500 pages: report once, offer a retry and a way home.
export function LaporGalat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    try {
      navigator.sendBeacon("/api/galat", new Blob([JSON.stringify({ pesan: error.message, stack: error.stack, digest: error.digest, url: location.href })], { type: "application/json" }));
    } catch {
      // ignore
    }
  }, [error]);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-h1 text-arang-900">Ada yang macet di pihak kami</h1>
      <p className="text-body text-arang-500">Halaman ini gagal dimuat. Kami sudah menerima laporannya. Coba muat ulang; kalau masih macet, cari lewat beranda.</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={reset}>Muat ulang</Button>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>Ke beranda</Link>
      </div>
      {error.digest && <p className="text-micro text-arang-500">Kode: {error.digest}</p>}
    </div>
  );
}
