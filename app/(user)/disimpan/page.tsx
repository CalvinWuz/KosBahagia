import type { Metadata } from "next";
import { DaftarSimpanan } from "@/components/kos/DaftarSimpanan";
import { MAKS_TAUTAN_SIMPANAN, bacaKunciKos } from "@/lib/kos/kunci-banding";

export const metadata: Metadata = {
  title: "Kos tersimpan",
  robots: { index: false, follow: false },
};

// /disimpan?kos=a:<kamar>,b,c is a list someone shared (a friend, a parent):
// it is shown as-is, with the room types that were saved, and can be merged
// into this phone's own list.
export default async function HalamanSimpanan({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const dariTautan = bacaKunciKos(sp.kos, MAKS_TAUTAN_SIMPANAN);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 pb-16">
      <h1 className="text-h1 text-arang-900">Kos tersimpan</h1>
      <DaftarSimpanan dariTautan={dariTautan} />
    </div>
  );
}
