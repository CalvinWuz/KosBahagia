"use client";

import { useActionState, type InputHTMLAttributes } from "react";
import { Button } from "@/components/ui/Button";
import { daftarMitra, type Hasil } from "@/lib/mitra/aksi";

const kelasInput =
  "h-14 w-full rounded-xl border-2 border-arang-500/30 bg-putih px-4 text-body text-arang-900 placeholder:text-arang-500 focus:border-biru-500";

// Five fields. We survey in person, so nothing else is asked here.
export function FormPendaftaran() {
  const [hasil, aksi, sibuk] = useActionState<Hasil | null, FormData>(daftarMitra, null);

  if (hasil?.ok) {
    return (
      <div className="rounded-2xl border border-daun-700/30 bg-daun-100 p-5" role="status">
        <p className="text-h2 text-daun-700">Pendaftaran diterima.</p>
        <p className="mt-1 text-body text-arang-900">Tim kami akan menghubungi lewat WhatsApp dalam 2 hari kerja untuk menjadwalkan survei. Tidak ada biaya.</p>
      </div>
    );
  }

  return (
    <form action={aksi} className="flex flex-col gap-4" aria-describedby={hasil && !hasil.ok ? "galat-daftar" : undefined}>
      <Field label="Nama Bapak/Ibu" name="nama" autoComplete="name" />
      <Field label="Nomor WhatsApp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="0812 3456 7890" />
      <Field label="Nama kos" name="nama_kos" />
      <Field label="Alamat kos" name="alamat" autoComplete="street-address" />
      <Field label="Jumlah kamar" name="jumlah_kamar" type="number" inputMode="numeric" min={1} max={500} />
      {hasil && !hasil.ok && (
        <p id="galat-daftar" className="text-small font-bold text-merah-700" role="alert">{hasil.pesan}</p>
      )}
      <Button type="submit" variant="primary" size="lg" loading={sibuk} className="w-full">
        Daftarkan kos saya
      </Button>
      <p className="text-small text-arang-500">Gratis. Kami yang datang, ukur, dan foto.</p>
    </form>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-body font-bold text-arang-900">{label}</span>
      <input name={name} required className={kelasInput} {...rest} />
    </label>
  );
}
