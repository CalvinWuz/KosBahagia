"use client";

import Link from "next/link";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { SkorBadge } from "@/components/kos/SkorBadge";
import { PenandaDemo } from "@/components/ui/PenandaDemo";
import { BOBOT, cekTransparansi, KRITERIA_TRANSPARANSI } from "@/lib/scoring";
import { kataKebersihan, kataKedap } from "@/lib/skala";
import { lompatKe } from "@/lib/bagian";
import type { TipeKamar } from "@/lib/biaya";
import type { Penilaian, Sekitar, SkorKos } from "@/lib/kos/detail";
import { BelumDicatat, Blok } from "./bagian";
import { ArtiSkala } from "./ArtiSkala";

// Block 3: the total /10, one sentence, and the five-component calculation
// in an accordion. The two /5 rubric scores live in "Kebersihan & kedap
// suara" (block 5); this block links there instead of repeating them, and
// the calculation points at that evidence rather than listing raw
// measurements again. The formula is the same one lib/scoring.ts documents.
export function SkorRincian({
  skor,
  penilaian,
  sekitar,
  nFasilitas,
  tipeKamar,
  kamar,
  sekarang,
  disurveiPada,
}: {
  disurveiPada: string | null;
  skor: SkorKos | null;
  penilaian: Penilaian | null;
  sekitar: Sekitar | null;
  nFasilitas: number;
  tipeKamar: TipeKamar[];
  kamar: TipeKamar | null;
  sekarang: Date;
}) {
  // Transparency is averaged over every room type; the evidence lists the
  // checks for the room the renter is looking at.
  const cek = kamar ? cekTransparansi(kamar, sekarang) : null;
  const lolos = cek ? KRITERIA_TRANSPARANSI.filter((k) => cek[k.kunci]).length : 0;
  const komponen = [
    {
      nama: "Kebersihan",
      bobot: BOBOT.kebersihan,
      nilai: skor?.kebersihan ?? null,
      kata: kataKebersihan(skor?.kebersihan),
      bukti: ["Rata-rata kamar mandi, dapur bersama, dan koridor"],
      rujukan: penilaian ? { id: "bukti-kebersihan", label: "Lihat bukti kebersihan" } : undefined,
    },
    {
      nama: "Kedap suara",
      bobot: BOBOT.kedap,
      nilai: skor?.kedap ?? null,
      kata: kataKedap(skor?.kedap),
      bukti: ["Dari material tembok dan tes desibel"],
      rujukan: penilaian ? { id: "bukti-kedap", label: "Lihat bukti kedap suara" } : undefined,
    },
    {
      nama: "Transparansi biaya",
      bobot: BOBOT.transparansi,
      nilai: skor?.transparansi ?? null,
      kata: null as string | null,
      bukti: cek
        ? [
            `Kamar ${kamar?.nama}: ${lolos} dari 4 hal biaya jelas${tipeKamar.length > 1 ? ` (skor = rata-rata ${tipeKamar.length} tipe kamar)` : ""}`,
            ...KRITERIA_TRANSPARANSI.map((k) => `${cek[k.kunci] ? "Ya" : "Belum"}: ${k.label.charAt(0).toLowerCase()}${k.label.slice(1)}`),
          ]
        : [],
    },
    {
      nama: "Fasilitas untuk harganya",
      bobot: BOBOT.fasilitas,
      nilai: skor?.fasilitas ?? null,
      kata: null as string | null,
      bukti: [`${nFasilitas} fasilitas yang bisa difilter, dibanding kos lain di kisaran harga yang sama`],
    },
    {
      nama: "Sekitar",
      bobot: BOBOT.sekitar,
      nilai: skor?.sekitar ?? null,
      kata: null as string | null,
      bukti: sekitar
        ? [
            sekitar.landmark_menit_jalan != null ? `${sekitar.landmark_menit_jalan} menit jalan ke ${sekitar.landmark_nama}` : null,
            sekitar.penerangan != null ? `Penerangan jalan ${sekitar.penerangan}/5` : null,
            `${[sekitar.minimarket, sekitar.warung, sekitar.laundry, sekitar.transit].filter(Boolean).length} dari 4 fasilitas sekitar tercatat`,
          ].filter((x): x is string => Boolean(x))
        : [],
    },
  ];

  return (
    <Blok id="skor" judul="Skor Bahagia" keterangan="Dihitung dari survei kami, bukan dari ulasan. Paket berbayar tidak memengaruhi angka ini.">
      <PenandaDemo className="-mt-1 mb-2" />
      <div className="flex flex-wrap items-center gap-3">
        <SkorBadge skor={skor?.skor ?? null} size="lg" />
        <p className="text-small text-arang-900">
          {skor?.skor == null
            ? "Rubrik kebersihan atau kedap suara belum lengkap, jadi kami tidak menebak angkanya."
            : "dari 10, gabungan lima komponen survei. Makin tinggi makin baik."}
        </p>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href="#kebersihan"
          onClick={(e) => {
            e.preventDefault();
            lompatKe("kebersihan");
          }}
          className="sentuh relative rounded-sm text-small font-bold text-biru-600 hover:underline"
        >
          Lihat kebersihan & kedap suara
        </a>
        <ArtiSkala disurveiPada={disurveiPada} kamarDiukur={penilaian?.kamar_diukur} />
        <Link href="/cara-kami-menilai" className="text-small font-bold text-biru-600 hover:underline">Cara kami menilai</Link>
      </p>
      <Accordion className="mt-3">
        <AccordionItem title="Lihat perhitungan skor" ringkasan="Lima komponen dan bobotnya">
          <ul className="flex flex-col gap-4">
            {komponen.map((k) => (
              <li key={k.nama}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-small font-bold text-arang-900">
                    {k.nama} <span className="font-medium text-arang-500">({Math.round(k.bobot * 100)}%)</span>
                  </span>
                  {k.nilai == null ? (
                    <BelumDicatat />
                  ) : (
                    <span className="text-small font-bold text-arang-900 tabular-nums">
                      {k.nilai.toFixed(1).replace(".", ",")}/5{k.kata && <span className="font-medium text-arang-500"> · {k.kata}</span>}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-biru-100" aria-hidden="true">
                  <div className="h-full rounded-full bg-biru-500" style={{ width: `${((k.nilai ?? 0) / 5) * 100}%` }} />
                </div>
                {k.bukti.length > 0 && (
                  <ul className={k.nama === "Transparansi biaya" ? "mt-1 flex flex-col gap-0.5 text-micro text-arang-500" : "mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-micro text-arang-500"}>
                    {k.bukti.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                    {k.rujukan && (
                      <li>
                        <a
                          href={`#${k.rujukan.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (k.rujukan) lompatKe(k.rujukan.id);
                          }}
                          className="font-bold text-biru-600 hover:underline"
                        >
                          {k.rujukan.label}
                        </a>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </AccordionItem>
      </Accordion>
    </Blok>
  );
}
