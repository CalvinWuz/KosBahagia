import type { Metadata } from "next";
import { buttonClasses } from "@/components/ui/Button";
import { dasarMitra } from "@/lib/mitra/dasar";
import { wajibSesi } from "@/lib/mitra/sesi";

export const metadata: Metadata = { title: "Paket" };

const URUT = ["free", "premium", "spotlight"] as const;
const NAMA: Record<string, string> = { free: "Free", premium: "Premium", spotlight: "Spotlight" };
const TAMBAHAN: Record<string, string[]> = {
  premium: ["Foto profesional dan video singkat oleh tim kami", "Tur 360° kamar dan koridor", "Prioritas urutan di hasil pencarian area"],
  spotlight: ["Semua di Premium", "Posisi teratas hasil pencarian area (maksimal 2 kos per area)"],
};
const WA_TIM = process.env.NEXT_PUBLIC_WA_TIM ?? "6281234567890";

export default async function Paket() {
  const dasar = await dasarMitra();
  const sesi = await wajibSesi(`${dasar}/dashboard/paket`);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 pb-16">
      <div>
        <h1 className="text-h1 text-arang-900">Paket</h1>
        <p className="text-small text-arang-500">Tidak ada pembayaran online. Tim kami yang mengatur lewat WhatsApp.</p>
      </div>
      <ul className="flex flex-col gap-4">
        {sesi.kos.map((k) => {
          const idx = URUT.indexOf(k.tier as (typeof URUT)[number]);
          const berikut = URUT[idx + 1];
          const pesan = encodeURIComponent(`Halo tim Kos Bahagia, saya ${sesi.owner?.nama ?? "pemilik"} dari ${k.nama}. Mau tanya paket ${berikut ? NAMA[berikut] : "yang ada"}.`);
          return (
            <li key={k.id} className="rounded-2xl border border-arang-500/20 bg-putih p-4">
              <h2 className="text-h2 text-arang-900">{k.nama}</h2>
              <p className="mt-1 text-body text-arang-900">Paket saat ini: <strong>{NAMA[k.tier]}</strong></p>
              {berikut ? (
                <>
                  <p className="mt-3 text-small font-bold text-arang-900">Yang ditambah {NAMA[berikut]}:</p>
                  <ul className="mt-1 flex flex-col gap-1 text-small text-arang-900">
                    {TAMBAHAN[berikut].map((t) => <li key={t}>• {t}</li>)}
                  </ul>
                </>
              ) : (
                <p className="mt-3 text-small text-arang-500">Ini paket tertinggi.</p>
              )}
              <p className="mt-3 text-small text-arang-500">Paket apa pun tidak mengubah Skor Bahagia atau catatan surveyor.</p>
              <a href={`https://wa.me/${WA_TIM}?text=${pesan}`} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "primary", size: "lg", className: "mt-4 w-full sm:w-auto" })}>
                Chat tim Kos Bahagia
              </a>
            </li>
          );
        })}
        {sesi.kos.length === 0 && <li className="text-body text-arang-500">Belum ada kos yang tertaut.</li>}
      </ul>
    </div>
  );
}
