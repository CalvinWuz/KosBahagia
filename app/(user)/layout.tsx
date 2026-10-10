import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { plusJakarta } from "@/lib/fonts";
import { Header } from "@/components/layout/Header";
import { BannerDemo } from "@/components/layout/BannerDemo";
import { MODE_DEMO } from "@/lib/demo";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/Toast";
import { TrayBanding } from "@/components/kos/TrayBanding";
import { PelacakRiwayat } from "@/lib/navigasi";
import { SKRIP_PANDUAN } from "@/lib/panduan";
import { SKRIP_INTRO } from "@/lib/intro-logo";
import { IntroLogo } from "@/components/layout/IntroLogo";
import { TransisiHalaman } from "@/components/layout/TransisiHalaman";
import Script from "next/script";

// Privacy-respecting analytics: cookieless, no personal data, off unless configured.
const PLAUSIBLE = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export const metadata: Metadata = {
  // Absolute URLs for canonical/OpenGraph. Override per environment.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com"),
  title: {
    default: "Kos Bahagia — Kos yang sudah kami cek langsung",
    template: "%s · Kos Bahagia",
  },
  description: MODE_DEMO
    ? "Prototipe Kos Bahagia dengan data contoh: cari kos dengan biaya bulanan sebenarnya, skor kebersihan dan kedap suara, serta catatan surveyor."
    : "Cari kos di Jakarta dan Malang dengan biaya bulanan sebenarnya, skor kebersihan dan kedap suara, serta catatan surveyor. Setiap kos sudah kami datangi.",
};

// Root layout for the renter surface (kosbahagia.com): the bright shell.
export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the flags below set data-panduan / data-intro on <html> before React hydrates.
    <html lang="id" className={plusJakarta.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        {/* Runs before the first paint so the new-user guide never flashes for someone who closed it. */}
        <Script id="penanda-panduan" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SKRIP_PANDUAN }} />
        {/* Same idea for the logo intro: only on a reload, decided before the first paint (lib/intro-logo.ts). */}
        <Script id="penanda-intro" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SKRIP_INTRO }} />
        <a
          href="#konten"
          className="sr-only rounded-lg bg-putih px-4 py-2 text-body font-bold text-biru-600 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Langsung ke konten
        </a>
        <BannerDemo />
        <Header />
        <main id="konten" className="flex-1">
          <TransisiHalaman>{children}</TransisiHalaman>
        </main>
        <Footer />
        <TrayBanding />
        <Toaster />
        <PelacakRiwayat />
        <IntroLogo />
        {PLAUSIBLE && <Script defer data-domain={PLAUSIBLE} src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js"} strategy="afterInteractive" />}
      </body>
    </html>
  );
}
