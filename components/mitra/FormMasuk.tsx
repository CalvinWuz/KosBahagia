"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { mitraBrowser } from "@/lib/supabase/mitra-client";
import { pastikanOwner } from "@/lib/mitra/aksi";
import { useDasarMitra } from "@/lib/mitra/DasarMitra";

const kelasInput =
  "h-14 w-full rounded-xl border-2 border-arang-500/30 bg-putih px-4 text-h2 text-arang-900 tabular-nums placeholder:text-arang-500 focus:border-biru-500";

function keE164(v: string) {
  const d = v.replace(/\D/g, "");
  const nomor = d.startsWith("62") ? d : d.startsWith("0") ? `62${d.slice(1)}` : `62${d}`;
  return `+${nomor}`;
}

// WhatsApp-number OTP. Two steps, big inputs, one button each.
export function FormMasuk({ next }: { next: string }) {
  const router = useRouter();
  const dasar = useDasarMitra();
  const [tahap, setTahap] = useState<"nomor" | "kode">("nomor");
  const [nomor, setNomor] = useState("");
  const [kode, setKode] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [tunggu, setTunggu] = useState(0);
  const [terkirimLagi, setTerkirimLagi] = useState(false);
  const viaWa = process.env.NEXT_PUBLIC_WA_OTP === "1";

  // Resend is allowed after 30 s; the countdown says how long.
  useEffect(() => {
    if (tunggu <= 0) return;
    const t = window.setTimeout(() => setTunggu((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [tunggu]);

  const kirim = async () => {
    setSibuk(true);
    setGalat(null);
    const { error } = await mitraBrowser().auth.signInWithOtp({
      phone: keE164(nomor),
      options: { channel: viaWa ? "whatsapp" : "sms", shouldCreateUser: true },
    });
    setSibuk(false);
    if (error) {
      setGalat("Kode belum bisa dikirim. Cek nomornya, lalu coba lagi.");
      return false;
    }
    setTunggu(30);
    return true;
  };

  const kirimKode = async (e: FormEvent) => {
    e.preventDefault();
    if (await kirim()) setTahap("kode");
  };

  const kirimUlang = async () => {
    setKode("");
    setTerkirimLagi(await kirim());
  };

  const verifikasi = async (e: FormEvent) => {
    e.preventDefault();
    setSibuk(true);
    setGalat(null);
    const { error } = await mitraBrowser().auth.verifyOtp({ phone: keE164(nomor), token: kode.trim(), type: "sms" });
    if (error) {
      setSibuk(false);
      return setGalat("Kode salah atau sudah kedaluwarsa. Minta kode baru.");
    }
    await pastikanOwner();
    router.replace(next.startsWith("/") ? next : `${dasar}/dashboard`);
    router.refresh();
  };

  return tahap === "nomor" ? (
    <form onSubmit={kirimKode} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-body font-bold text-arang-900">Nomor WhatsApp</span>
        <input type="tel" inputMode="tel" autoComplete="tel" required value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="0812 3456 7890" className={kelasInput} />
      </label>
      {galat && <p className="text-small font-bold text-merah-700" role="alert">{galat}</p>}
      <Button type="submit" variant="primary" size="lg" loading={sibuk} className="w-full">
        Kirim kode
      </Button>
      <p className="text-small text-arang-500">Kode 6 angka dikirim ke {viaWa ? "WhatsApp" : "SMS"} nomor ini. Tidak ada kata sandi.</p>
    </form>
  ) : (
    <form onSubmit={verifikasi} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-body font-bold text-arang-900">Kode dari {viaWa ? "WhatsApp" : "SMS"}</span>
        <input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={kode} onChange={(e) => setKode(e.target.value)} placeholder="123456" className={kelasInput} autoFocus />
      </label>
      {galat && <p className="text-small font-bold text-merah-700" role="alert">{galat}</p>}
      <Button type="submit" variant="primary" size="lg" loading={sibuk} className="w-full">
        Masuk
      </Button>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-small">
        {tunggu > 0 ? (
          <span className="text-arang-500 tabular-nums" aria-live="polite">Kirim ulang bisa dalam {tunggu} detik</span>
        ) : (
          <button type="button" onClick={kirimUlang} disabled={sibuk} className="font-bold text-biru-600 hover:underline disabled:opacity-50">
            Kirim ulang kode
          </button>
        )}
        <button type="button" onClick={() => setTahap("nomor")} className="font-bold text-biru-600 hover:underline">
          Ganti nomor
        </button>
      </div>
      {terkirimLagi && tunggu > 0 && <p className="text-small text-daun-700" role="status">Kode baru dikirim ke {keE164(nomor)}.</p>}
    </form>
  );
}
