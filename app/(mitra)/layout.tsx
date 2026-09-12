import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";
import { plusJakarta } from "@/lib/fonts";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: {
    default: "Kos Bahagia Mitra",
    template: "%s · Kos Bahagia Mitra",
  },
  description: "Kelola listing kos kamu di Kos Bahagia.",
  robots: { index: false, follow: false },
};

// Root layout for the owner surface (mitra.kosbahagia.com): a calm, dense,
// utilitarian shell. It deliberately shares nothing with the user Header.
export default function MitraLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="sr-only rounded-lg bg-putih px-4 py-2 text-body font-bold text-biru-600 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Langsung ke konten
        </a>
        <header className="border-b border-arang-500/20 bg-putih">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 text-arang-900">
            <Logo className="size-6" />
            <span className="text-small font-bold">Kos Bahagia</span>
            <span className="text-small text-arang-500">Mitra</span>
          </div>
        </header>
        <main id="konten" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
