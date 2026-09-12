import Link from "next/link";
import { IconCatatan, IconJalanKaki, IconPengukur } from "@/components/ui/Icon";

const POIN = [
  {
    ikon: <IconJalanKaki />,
    judul: "Kami datangi",
    isi: "Tim survei masuk ke tiap kos, bukan cuma telepon pemilik.",
  },
  {
    ikon: <IconPengukur />,
    judul: "Kami ukur",
    isi: "Kebersihan dinilai dengan rubrik tetap; kedap suara diukur pakai desibel meter.",
  },
  {
    ikon: <IconCatatan />,
    judul: "Kami tulis yang jelek juga",
    isi: "Tiga hal baik, tiga hal yang perlu kamu tahu, plus red flag keselamatan.",
  },
];

export function CaraVerifikasi() {
  return (
    <section aria-labelledby="cara-verifikasi" className="mx-auto w-full max-w-6xl px-4">
      <h2 id="cara-verifikasi" className="text-h2 text-arang-900">
        Cara kami memastikan datanya benar
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {POIN.map((p) => (
          <li key={p.judul} className="flex gap-3 rounded-2xl border border-biru-100 bg-putih p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-biru-100 text-biru-600 [&>svg]:size-5">
              {p.ikon}
            </span>
            <div>
              <h3 className="text-body font-bold text-arang-900">{p.judul}</h3>
              <p className="text-small text-arang-500">{p.isi}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link href="/cara-kami-menilai" className="mt-4 inline-block rounded-sm text-small font-bold text-biru-600 hover:underline">
        Baca cara kami menilai
      </Link>
    </section>
  );
}
