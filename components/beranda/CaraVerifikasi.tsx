import Link from "next/link";
import { IconCatatan, IconJalanKaki, IconPengukur } from "@/components/ui/Icon";

// The three steps of every survey, in the order they happen. Numbered
// because the order is real: nothing is measured before someone has walked
// in, and nothing is written before it is measured.
const LANGKAH = [
  {
    ikon: <IconJalanKaki />,
    judul: "Kami datangi",
    isi: "Tim survei masuk ke tiap kos, bukan cuma telepon pemilik.",
    bukti: "Alamat, foto, dan rute dari landmark dicatat di lokasi.",
  },
  {
    ikon: <IconPengukur />,
    judul: "Kami ukur",
    isi: "Kebersihan dinilai dengan rubrik tetap; kedap suara diukur pakai desibel meter.",
    bukti: "Angka sunyi dan angka saat tes suara dari kamar sebelah.",
  },
  {
    ikon: <IconCatatan />,
    judul: "Kami tulis yang jelek juga",
    isi: "Tiga hal baik, tiga hal yang perlu kamu tahu, plus red flag keselamatan.",
    bukti: "Ditulis surveyor bernama; paket berbayar tidak bisa menghapusnya.",
  },
];

export function CaraVerifikasi() {
  return (
    <section aria-labelledby="cara-verifikasi" className="mx-auto w-full max-w-6xl px-4">
      <p className="text-micro font-bold text-biru-600">Kenapa bisa dipercaya</p>
      <h2 id="cara-verifikasi" className="mt-1 text-h2 text-arang-900">
        Cara kami memastikan datanya benar
      </h2>
      <ol className="relative mt-5 grid gap-3 sm:grid-cols-3">
        {/* The connector between steps, desktop only. */}
        <span aria-hidden="true" className="absolute top-9 right-[16%] left-[16%] hidden h-px bg-biru-100 sm:block" />
        {LANGKAH.map((l, i) => (
          <li key={l.judul} className="relative flex flex-col gap-3 rounded-2xl border border-biru-100 bg-putih p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-biru-100 to-biru-100/40 text-biru-600 ring-1 ring-biru-500/10 ring-inset [&>svg]:size-6">
                {l.ikon}
              </span>
              <span className="grid size-7 place-items-center rounded-full bg-arang-900 text-micro font-bold text-putih tabular-nums">{i + 1}</span>
            </div>
            <div>
              <h3 className="text-body font-bold text-arang-900">{l.judul}</h3>
              <p className="mt-1 text-small text-arang-900">{l.isi}</p>
              <p className="mt-2 border-t border-biru-100 pt-2 text-micro text-arang-500">{l.bukti}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/cara-kami-menilai" className="mt-4 inline-block rounded-sm text-small font-bold text-biru-600 hover:underline">
        Baca cara kami menilai
      </Link>
    </section>
  );
}
