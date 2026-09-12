import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { plusJakarta } from "@/lib/fonts";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "Kos Bahagia — Kos yang sudah kami cek langsung",
    template: "%s · Kos Bahagia",
  },
  description:
    "Cari kos di Jakarta dan Malang dengan biaya bulanan sebenarnya, skor kebersihan dan kedap suara, serta catatan surveyor. Setiap kos sudah kami datangi.",
};

// Root layout for the renter surface (kosbahagia.com): the bright shell.
export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="sr-only rounded-lg bg-putih px-4 py-2 text-body font-bold text-biru-600 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Langsung ke konten
        </a>
        <Header />
        <main id="konten" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
