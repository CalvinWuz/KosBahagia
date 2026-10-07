import type { ReactNode } from "react";
import { IconBanding, IconHati, IconSearch } from "@/components/ui/Icon";
import { MODE_DEMO } from "@/lib/demo";
import { cn } from "@/lib/cn";

type Langkah = { judul: string; ikon: ReactNode; ringkas: string; isi: ReactNode[] };

// The three steps of the new-user guide. Only features that exist today.
// Shared by the homepage card, the /cari sheet and /cara-menggunakan.
const LANGKAH: Langkah[] = [
  {
    judul: "Cari lokasi dan atur kebutuhanmu",
    ikon: <IconSearch className="size-5" />,
    ringkas: "Ketik area atau kampus, lalu pakai Filter: total per bulan, tipe kos, kamar mandi dalam.",
    isi: [
      "Ketik area atau kampus di kotak pencarian, atau pilih salah satu kebutuhan di beranda.",
      "Tekan Filter untuk mengatur total biaya per bulan, tipe kos (boleh lebih dari satu), kamar mandi dalam, dan lainnya. Pilihanmu langsung diterapkan.",
      "Filter yang aktif tampil di atas hasil. Tekan tanda silang di salah satunya untuk menghapusnya saja.",
    ],
  },
  {
    judul: "Cek biaya, kondisi, dan simpan pilihan",
    ikon: <IconHati className="size-5" />,
    ringkas: "Angka besar di kartu adalah total per bulan. Tekan Simpan pada kos yang kamu suka.",
    isi: [
      "Angka besar di kartu adalah total per bulan untuk tipe kamar yang tertulis, bukan sewa saja.",
      "Buka kos untuk melihat rincian biaya, skor kebersihan dan kedap suara beserta artinya, dan catatan surveyor.",
      "Tekan Simpan. Tombolnya berubah menjadi Tersimpan, dan daftarnya ada di menu Simpanan. Simpanan tersimpan di perangkat ini, tanpa akun.",
    ],
  },
  {
    judul: "Bandingkan pilihan, lalu hubungi pemilik",
    ikon: <IconBanding className="size-5" />,
    ringkas: "Tekan Bandingkan di 2–3 kos, buka Bandingkan dari menu, lalu hubungi pemilik.",
    isi: [
      "Tekan Bandingkan di dua sampai tiga kos. Tipe kamar yang sedang kamu lihat ikut dibandingkan.",
      "Buka Bandingkan dari menu untuk melihat perbedaan biaya, status kamar, dan aturan berdampingan.",
      MODE_DEMO
        ? "Setelah yakin, tekan Chat pemilik di halaman kos. Di prototipe ini tombolnya hanya menampilkan pesan, karena nomor pemiliknya data contoh."
        : "Setelah yakin, tekan Chat pemilik di halaman kos untuk membuka WhatsApp pemilik.",
    ],
  },
];

export function LangkahPanduan({ ringkas = false, className }: { ringkas?: boolean; className?: string }) {
  return (
    <ol className={cn("grid grid-cols-1 gap-3", ringkas ? "md:grid-cols-3" : "", className)}>
      {LANGKAH.map((l, i) => (
        <li key={l.judul} className={cn("flex gap-3 rounded-2xl border border-biru-100 bg-putih", ringkas ? "p-3" : "p-4")}>
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-biru-100 text-biru-600" aria-hidden="true">
            {l.ikon}
            <span className="absolute -top-1.5 -left-1.5 grid size-5 place-items-center rounded-full bg-biru-600 text-micro font-bold text-putih">{i + 1}</span>
          </span>
          <div className="min-w-0 wrap-break-word">
            <h3 className="text-body leading-5 font-bold text-arang-900">
              <span className="sr-only">Langkah {i + 1}: </span>
              {l.judul}
            </h3>
            {ringkas ? (
              <p className="mt-1 text-small text-arang-500">{l.ringkas}</p>
            ) : (
              <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-small text-arang-900">
                {l.isi.map((x, j) => (
                  <li key={j}>{x}</li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
