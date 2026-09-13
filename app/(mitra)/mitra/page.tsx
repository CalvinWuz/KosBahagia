import Link from "next/link";
import Image from "next/image";
import { FormPendaftaran } from "@/components/mitra/FormPendaftaran";
import { dasarMitra } from "@/lib/mitra/dasar";

const PAKET = [
  { nama: "Free", harga: "Gratis", isi: ["Disurvei dan difoto oleh tim kami", "Data biaya, kebersihan, dan catatan surveyor tayang", "Tautan WhatsApp langsung ke Bapak/Ibu"] },
  { nama: "Premium", harga: "Hubungi kami", isi: ["Semua di Free", "Foto profesional dan video singkat", "Tur 360° kamar dan koridor", "Prioritas urutan di area Bapak/Ibu"] },
  { nama: "Spotlight", harga: "Slot terbatas", isi: ["Semua di Premium", "Posisi teratas hasil pencarian area", "Maksimal 2 kos per area"] },
];

// Sells the service, not features. One form, one button, zero illustration.
export default async function LandingMitra() {
  const dasar = await dasarMitra();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-8 pb-16">
      <section className="flex flex-col gap-4">
        <h1 className="text-display text-arang-900">Fotonya kami yang urus. Hasilnya jadi milik Bapak/Ibu.</h1>
        <p className="text-body text-arang-900">
          Tim Kos Bahagia datang ke kos, mengukur, memotret, lalu menayangkannya dengan biaya bulanan yang jelas. Penyewa yang serius menghubungi Bapak/Ibu langsung lewat WhatsApp. Kos Anda tampil di area ini, bukan tenggelam di antara ribuan iklan.
        </p>
        <Link href={`${dasar}/masuk`} className="text-small font-bold text-biru-600 hover:underline">Sudah jadi mitra? Masuk di sini</Link>
      </section>

      <section aria-labelledby="sebelum-sesudah" className="flex flex-col gap-3">
        <h2 id="sebelum-sesudah" className="text-h2 text-arang-900">Foto pemilik vs foto tim kami</h2>
        <div className="grid grid-cols-2 gap-3">
          <figure className="overflow-hidden rounded-2xl border border-arang-500/20 bg-putih">
            <div className="relative aspect-[4/3] bg-kertas-50">
              <Image src="https://picsum.photos/seed/mitra-sebelum/800/600" alt="Foto kamar hasil jepretan pemilik, gelap dan miring" fill sizes="50vw" className="object-cover" />
            </div>
            <figcaption className="px-3 py-2 text-small text-arang-500">Sebelum: foto HP pemilik</figcaption>
          </figure>
          <figure className="overflow-hidden rounded-2xl border border-arang-500/20 bg-putih">
            <div className="relative aspect-[4/3] bg-kertas-50">
              <Image src="https://picsum.photos/seed/mitra-sesudah/800/600" alt="Foto kamar yang sama oleh tim kami, terang dan rapi" fill sizes="50vw" className="object-cover" />
            </div>
            <figcaption className="px-3 py-2 text-small text-arang-500">Sesudah: foto tim Kos Bahagia</figcaption>
          </figure>
        </div>
        <p className="text-micro text-arang-500">Contoh pasangan foto; foto asli dari kos mitra dipasang setelah survei pertama.</p>
      </section>

      <section aria-labelledby="cara-kerja">
        <h2 id="cara-kerja" className="text-h2 text-arang-900">Cara kerjanya</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {["Isi formulir di bawah. Lima kolom saja.", "Tim kami datang, mengukur, dan memotret. Gratis.", "Kos tayang. Penyewa chat langsung ke WhatsApp Bapak/Ibu."].map((t, i) => (
            <li key={t} className="rounded-2xl border border-arang-500/20 bg-putih p-4 text-body text-arang-900">
              <span className="mb-1 block text-micro font-bold text-arang-500">Langkah {i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="paket">
        <h2 id="paket" className="text-h2 text-arang-900">Paket</h2>
        <p className="mt-1 text-body text-arang-900">
          Paket berbayar menaikkan posisi dan kualitas foto. <strong>Paket tidak mengubah Skor Bahagia, tidak menyembunyikan catatan surveyor, dan tidak mengubah data survei.</strong> Itu yang membuat penyewa percaya.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PAKET.map((p) => (
            <div key={p.nama} className="flex flex-col gap-2 rounded-2xl border border-arang-500/20 bg-putih p-4">
              <h3 className="text-body font-bold text-arang-900">{p.nama}</h3>
              <p className="text-small text-arang-500">{p.harga}</p>
              <ul className="flex flex-col gap-1 text-small text-arang-900">
                {p.isi.map((x) => <li key={x}>• {x}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-2 text-small text-arang-500">Tidak ada pembayaran online. Tim kami yang menghubungi dan mengatur.</p>
      </section>

      <section id="daftar" aria-labelledby="form-daftar" className="rounded-2xl border border-arang-500/20 bg-putih p-5">
        <h2 id="form-daftar" className="text-h2 text-arang-900">Daftarkan kos Bapak/Ibu</h2>
        <p className="mt-1 mb-4 text-small text-arang-500">Lima kolom. Sisanya kami isi saat survei.</p>
        <FormPendaftaran />
      </section>
    </div>
  );
}
