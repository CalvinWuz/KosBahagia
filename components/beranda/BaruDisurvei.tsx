import Link from "next/link";
import { KosCard, type KosKartu } from "@/components/kos/KosCard";
import { hrefCari } from "@/lib/cari-params";

// Proof the team is active. Newest survey first; the label widens from
// "minggu ini" to "bulan ini" instead of hiding when a week is quiet.
export function BaruDisurvei({
  kos,
  judul,
  sekarang,
}: {
  kos: KosKartu[];
  judul: string;
  sekarang: Date;
}) {
  return (
    <section aria-labelledby="baru-disurvei" className="mx-auto w-full max-w-6xl px-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-micro font-bold text-biru-600">
            <span aria-hidden="true" className="relative flex size-2">
              <span className="absolute inset-0 rounded-full bg-daun-500 opacity-60 motion-safe:animate-ping" />
              <span className="relative size-2 rounded-full bg-daun-500" />
            </span>
            Tim di lapangan
          </p>
          <h2 id="baru-disurvei" className="mt-1 text-h2 text-arang-900">
            {judul}
          </h2>
          <p className="text-small text-arang-500">Tim kami baru saja datang, ukur, dan foto.</p>
        </div>
        <Link href={hrefCari({})} className="shrink-0 rounded-sm text-small font-bold text-biru-600 hover:underline">
          Lihat semua kos
        </Link>
      </div>

      {kos.length === 0 ? (
        <div className="mt-4 flex flex-col items-start gap-3 rounded-2xl border border-biru-100 bg-putih p-6">
          <p className="text-body text-arang-900">Data survei belum bisa dimuat.</p>
          <Link href={hrefCari({})} className="text-small font-bold text-biru-600 hover:underline">
            Cari kos langsung
          </Link>
        </div>
      ) : (
        <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {kos.map((k, i) => (
            <li key={k.id} className="w-[78vw] max-w-72 shrink-0 snap-start sm:w-72">
              <KosCard kos={k} sekarang={sekarang} prioritas={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
