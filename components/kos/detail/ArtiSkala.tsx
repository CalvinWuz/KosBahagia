"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SKALA_KEBERSIHAN, SKALA_KEDAP, SKALA_SELISIH_DB, type Tingkat } from "@/lib/skala";

const Sheet = dynamic(() => import("@/components/ui/Sheet").then((m) => m.Sheet));

// "Apa artinya?" next to the cleanliness and soundproofing numbers. A sheet
// rather than a tooltip so it works with a thumb.
export function ArtiSkala({ className }: { className?: string }) {
  const [buka, setBuka] = useState(false);
  const [pernahBuka, setPernahBuka] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPernahBuka(true);
          setBuka(true);
        }}
        className={className ?? "rounded-sm text-small font-bold text-biru-600 hover:underline"}
      >
        Apa artinya?
      </button>
      {pernahBuka && (
        <Sheet open={buka} onClose={() => setBuka(false)} title="Arti angka kebersihan & suara">
          <div className="flex flex-col gap-6">
            <Tabel judul="Kebersihan (1–5)" keterangan="Rata-rata kamar mandi, dapur bersama, dan koridor, dinilai surveyor dengan rubrik tetap." tingkat={SKALA_KEBERSIHAN} satuan="/5" />
            <Tabel judul="Kedap suara (1–5)" keterangan="Dari material tembok dan tes desibel: kami putar suara di kamar sebelah, lalu ukur di kamar ini." tingkat={SKALA_KEDAP} satuan="/5" />
            <Tabel judul="Selisih desibel" keterangan="Angka saat tes dikurangi angka saat sunyi. Makin kecil, makin sedikit suara tetangga yang tembus." tingkat={SKALA_SELISIH_DB} satuan=" dB" />
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
