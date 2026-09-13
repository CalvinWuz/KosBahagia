import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormMasuk } from "@/components/mitra/FormMasuk";
import { dasarMitra } from "@/lib/mitra/dasar";
import { sesiMitra } from "@/lib/mitra/sesi";

export const metadata: Metadata = { title: "Masuk" };

export default async function HalamanMasuk({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, dasar, sesi] = await Promise.all([searchParams, dasarMitra(), sesiMitra()]);
  if (sesi) redirect(`${dasar}/dashboard`);
  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-16">
      <h1 className="text-h1 text-arang-900">Masuk</h1>
      <p className="mt-1 mb-5 text-body text-arang-500">Pakai nomor WhatsApp yang terdaftar saat survei.</p>
      <FormMasuk next={next ?? `${dasar}/dashboard`} />
    </div>
  );
}
