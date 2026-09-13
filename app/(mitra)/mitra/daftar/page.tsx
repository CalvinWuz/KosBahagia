import type { Metadata } from "next";
import { FormPendaftaran } from "@/components/mitra/FormPendaftaran";

export const metadata: Metadata = { title: "Daftar jadi mitra" };

export default function HalamanDaftar() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-16">
      <h1 className="text-h1 text-arang-900">Daftarkan kos Bapak/Ibu</h1>
      <p className="mt-1 mb-5 text-body text-arang-500">Lima kolom. Sisanya kami isi saat survei, gratis.</p>
      <FormPendaftaran />
    </div>
  );
}
