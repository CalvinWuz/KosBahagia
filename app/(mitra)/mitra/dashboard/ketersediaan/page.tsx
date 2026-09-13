import type { Metadata } from "next";
import Link from "next/link";
import { EditorKetersediaan } from "@/components/mitra/EditorKetersediaan";
import { simpanKetersediaan } from "@/lib/mitra/aksi";
import { dasarMitra } from "@/lib/mitra/dasar";
import { wajibSesi } from "@/lib/mitra/sesi";

export const metadata: Metadata = { title: "Ketersediaan" };

export default async function HalamanKetersediaan({ searchParams }: { searchParams: Promise<{ kos?: string }> }) {
  const [{ kos: kosId }, dasar] = await Promise.all([searchParams, dasarMitra()]);
  const sesi = await wajibSesi(`${dasar}/dashboard/ketersediaan${kosId ? `?kos=${kosId}` : ""}`);
  const kos = sesi.kos.find((k) => k.id === kosId) ?? sesi.kos[0];

  if (!kos) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-h1 text-arang-900">Belum ada kos yang tertaut</h1>
        <p className="mt-2 text-body text-arang-500">Setelah survei, tim kami menautkan kos ke nomor WhatsApp ini. Kalau sudah disurvei tapi belum muncul, hubungi tim lewat halaman Paket.</p>
      </div>
    );
  }

  const simpan = simpanKetersediaan.bind(null, kos.id);
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-16">
      {sesi.kos.length > 1 && (
        <nav aria-label="Pilih kos" className="flex flex-wrap gap-2">
          {sesi.kos.map((k) => (
            <Link
              key={k.id}
              href={`${dasar}/dashboard/ketersediaan?kos=${k.id}`}
              aria-current={k.id === kos.id ? "page" : undefined}
              className={k.id === kos.id ? "rounded-full bg-arang-900 px-3 py-2 text-small font-bold text-putih" : "rounded-full border border-arang-500/30 px-3 py-2 text-small font-bold text-arang-900"}
            >
              {k.nama}
            </Link>
          ))}
        </nav>
      )}
      <EditorKetersediaan
        key={kos.id}
        kosNama={kos.nama}
        kamar={kos.tipe_kamar.map((t) => ({ id: t.id, nama: t.nama, kamar_tersedia: t.kamar_tersedia, total_kamar: t.total_kamar }))}
        dikonfirmasiPada={kos.ketersediaan_dikonfirmasi_pada}
        simpan={simpan}
      />
    </div>
  );
}
