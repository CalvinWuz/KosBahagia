import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { plusJakarta } from "@/lib/fonts";
import { NavMitra } from "@/components/mitra/NavMitra";
import { DasarMitraProvider } from "@/lib/mitra/DasarMitra";
import { dasarMitra } from "@/lib/mitra/dasar";
import { sesiMitra } from "@/lib/mitra/sesi";

export const metadata: Metadata = {
  title: {
    default: "Kos Bahagia Mitra",
    template: "%s · Kos Bahagia Mitra",
  },
  description: "Tempat pemilik kos memperbarui ketersediaan dan melihat performa listingnya.",
  robots: { index: false, follow: false },
};

// Root layout for the owner surface (mitra.kosbahagia.com): a calm, dense,
// utilitarian shell. It deliberately shares nothing with the user Header.
export default async function MitraLayout({ children }: { children: ReactNode }) {
  const [dasar, sesi] = await Promise.all([dasarMitra(), sesiMitra()]);
  return (
    <html lang="id" className={plusJakarta.variable} data-scroll-behavior="smooth">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="sr-only rounded-lg bg-putih px-4 py-2 text-body font-bold text-biru-600 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Langsung ke konten
        </a>
        <DasarMitraProvider dasar={dasar}>
          <NavMitra dasar={dasar} masuk={Boolean(sesi)} nama={sesi?.owner?.nama} />
          <main id="konten" className="flex-1">
            {children}
          </main>
          <footer className="border-t border-arang-500/10 py-4 text-center text-micro text-arang-500">
            Kos Bahagia Mitra. Butuh bantuan? Hubungi tim lewat WhatsApp di halaman Paket.
          </footer>
        </DasarMitraProvider>
      </body>
    </html>
  );
}
