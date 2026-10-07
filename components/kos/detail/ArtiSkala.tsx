"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { IconInfo } from "@/components/ui/Icon";
import { formatTanggal } from "@/lib/format";
import { BOBOT } from "@/lib/scoring";
import { SKALA_KEBERSIHAN, SKALA_KEDAP, SKALA_SELISIH_DB, type Tingkat } from "@/lib/skala";

const Sheet = dynamic(() => import("@/components/ui/Sheet").then((m) => m.Sheet));

const KOMPONEN = [
  ["Kebersihan", BOBOT.kebersihan],
  ["Kedap suara", BOBOT.kedap],
  ["Transparansi biaya", BOBOT.transparansi],
  ["Fasilitas untuk harganya", BOBOT.fasilitas],
  ["Sekitar", BOBOT.sekitar],
] as const;

// "Arti skor" next to the score and the cleanliness/soundproofing numbers.
// A sheet rather than a tooltip so it works with a thumb and a keyboard.
// It separates the three scales (Skor Bahagia /10, kebersihan /5, kedap
// suara /5) from decibels, which are a measurement, not a score; with the
// survey context it also says when and where this kos was measured.
export function ArtiSkala({
  className,
  label = "Arti skor",
  disurveiPada,
  kamarDiukur,
}: {
  className?: string;
  label?: string;
  disurveiPada?: string | null;
  kamarDiukur?: string | null;
}) {
  const [buka, setBuka] = useState(false);
  const [pernahBuka, setPernahBuka] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setPernahBuka(true);
          setBuka(true);
        }}
        className={className ?? "sentuh relative inline-flex items-center gap-1 rounded-sm text-small font-bold text-biru-600 hover:underline"}
      >
        <IconInfo className="size-4 shrink-0" />
        {label}
      </button>
      {pernahBuka && (
        <Sheet open={buka} onClose={() => setBuka(false)} title="Arti angka skor">
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="text-body font-bold text-arang-900">Skor Bahagia (0–10)</h3>
              <p className="mt-0.5 text-small text-arang-900">
                Gabungan lima komponen dari survei. Kalau kebersihan atau kedap suara belum bisa dinilai, kos tampil <b>Belum dinilai</b>, bukan angka tebakan. Paket berbayar tidak mengubah angka ini.
              </p>
              <dl className="mt-2 divide-y divide-biru-100 rounded-2xl border border-biru-100 bg-putih">
                {KOMPONEN.map(([nama, bobot]) => (
                  <div key={nama} className="flex justify-between gap-3 px-3 py-1.5 text-small">
                    <dt className="text-arang-900">{nama}</dt>
                    <dd className="font-bold text-arang-900 tabular-nums">{Math.round(bobot * 100)}%</dd>
                  </div>
                ))}
              </dl>
            </section>
            <Tabel judul="Kebersihan (1–5)" keterangan="Rata-rata kamar mandi, dapur bersama, dan koridor, dinilai surveyor dengan rubrik tetap. Makin tinggi, makin bersih." tingkat={SKALA_KEBERSIHAN} satuan="/5" />
            <Tabel judul="Kedap suara (1–5)" keterangan="Dari material tembok dan tes suara dari kamar sebelah. Makin tinggi, makin baik menahan suara." tingkat={SKALA_KEDAP} satuan="/5" />
            <Tabel judul="Desibel (dB): hasil ukur, bukan skor" keterangan="Selisih = angka saat tes dikurangi angka saat sunyi. Makin kecil selisihnya, makin sedikit suara tetangga yang tembus." tingkat={SKALA_SELISIH_DB} satuan=" dB" />
            {(disurveiPada || kamarDiukur) && (
              <p className="rounded-2xl bg-kertas-50 p-3 text-small text-arang-900">
                Untuk kos ini: diukur{disurveiPada ? ` saat survei ${formatTanggal(disurveiPada)}` : ""}{kamarDiukur ? ` di ${kamarDiukur}` : ""}. Satu kali tes pada jam survei; kondisi bisa berubah setelahnya.
              </p>
            )}
            <p className="text-small text-arang-500">
              Semua angka dicatat di lokasi oleh surveyor bernama.{" "}
              <Link href="/cara-kami-menilai" className="font-bold text-biru-600 hover:underline">Cara kami menilai</Link>
            </p>
          </div>
        </Sheet>
      )}
    </>
  );
}

const angka = (n: number | undefined) => (n == null ? "" : String(n).replace(".", ","));

function Tabel({ judul, keterangan, tingkat, satuan }: { judul: string; keterangan: string; tingkat: Tingkat[]; satuan: string }) {
  return (
    <section>
      <h3 className="text-body font-bold text-arang-900">{judul}</h3>
      <p className="mt-0.5 text-small text-arang-500">{keterangan}</p>
      <dl className="mt-2 divide-y divide-biru-100 rounded-2xl border border-biru-100 bg-putih">
        {tingkat.map((t, i) => (
          <div key={t.kata} className="flex gap-3 px-3 py-2">
            <dt className="w-24 shrink-0 text-small font-bold text-arang-900">
              {t.kata}
              <span className="block text-micro font-medium text-arang-500 tabular-nums">
                {i === tingkat.length - 1 ? `< ${angka(tingkat[i - 1]?.min)}` : `≥ ${angka(t.min)}`}{satuan}
              </span>
            </dt>
            <dd className="text-small text-arang-900">{t.keterangan}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
