import type { Metadata } from "next";
import { DaftarSimpanan } from "@/components/kos/DaftarSimpanan";

export const metadata: Metadata = {
  title: "Kos tersimpan",
  robots: { index: false, follow: false },
};

export default function HalamanSimpanan() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 pb-16">
      <h1 className="text-h1 text-arang-900">Kos tersimpan</h1>
      <DaftarSimpanan />
    </div>
  );
}
