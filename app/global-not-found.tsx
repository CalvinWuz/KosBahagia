import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { plusJakarta } from "@/lib/fonts";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Halaman tidak ada · Kos Bahagia", robots: { index: false } };

// Unmatched routes across both root layouts (experimental.globalNotFound).
export default function TidakAdaGlobal() {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body>
        <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16">
          <h1 className="text-h1 text-arang-900">Halaman ini tidak ada</h1>
          <p className="text-body text-arang-500">Mungkin tautannya salah ketik, atau halamannya sudah dipindah.</p>
          <Link href="/cari" className={buttonClasses({ variant: "primary" })}>Cari kos</Link>
          <Link href="/" className="text-small font-bold text-biru-600 hover:underline">Ke beranda</Link>
        </div>
      </body>
    </html>
  );
}
