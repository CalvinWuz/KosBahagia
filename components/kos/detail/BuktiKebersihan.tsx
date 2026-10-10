import Link from "next/link";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import type { Penilaian } from "@/lib/kos/detail";
import { PenandaDemo } from "@/components/ui/PenandaDemo";
import { formatSkala, formatTanggal } from "@/lib/format";
import { kataKebersihan, kataKedap, kataSelisihDb, keteranganKebersihan, keteranganKedap, skorKebersihanRata } from "@/lib/skala";
import { cn } from "@/lib/cn";
import { Baris, BelumDicatat, Blok, Skala } from "./bagian";
import { ArtiSkala } from "./ArtiSkala";

const PEMBERSIH: Record<string, string> = {
  petugas: "Petugas kebersihan",
  pemilik: "Pemilik sendiri",
  penghuni: "Penghuni bergantian",
};

// Block 5, the one home of the two /5 scores. By default: two short cards
// (score, word, one sentence of what it means) and the survey context. The
// evidence (three area scores, cleaning routine, wall, decibels, limits) is
// one tap away in two accordions, unchanged in content. Numbers and words come
// from lib/skala, the same source as the card chips, the hero and the score.
export function BuktiKebersihan({ penilaian, disurveiPada }: { penilaian: Penilaian | null; disurveiPada: string | null }) {
  if (!penilaian) {
    return (
      <Blok id="kebersihan" judul="Kebersihan & kedap suara">
        <BelumDicatat />
      </Blok>
    );
  }
  const p = penilaian;
  const beda = p.db_ambient != null && p.db_tes != null ? p.db_tes - p.db_ambient : null;
  const rata = skorKebersihanRata(p);
  const konteks = [disurveiPada ? `Survei ${formatTanggal(disurveiPada)}` : "Hasil survei", p.kamar_diukur ? `tes suara di ${p.kamar_diukur}` : null]
    .filter(Boolean)
    .join("; ");

  return (
    <Blok id="kebersihan" judul="Kebersihan & kedap suara" keterangan={`${konteks}.`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <KartuKondisi
          judul="Kebersihan"
          nilai={rata}
          kata={kataKebersihan(rata)}
          baik={rata != null && rata >= 4}
          arti={keteranganKebersihan(rata) ?? "Kurang dari dua area yang bisa dinilai, jadi tidak ada angka."}
        />
        <KartuKondisi
          judul="Kedap suara"
          nilai={p.skor_kedap}
          kata={kataKedap(p.skor_kedap)}
          baik={p.skor_kedap != null && p.skor_kedap >= 4}
          arti={keteranganKedap(p.skor_kedap) ?? "Tes suara belum kami catat."}
        />
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
        <ArtiSkala label="Cara dinilai" disurveiPada={disurveiPada} kamarDiukur={p.kamar_diukur} />
        <PenandaDemo />
      </p>

      <Accordion className="mt-3">
        <AccordionItem id="bukti-kebersihan" title="Lihat bukti kebersihan" ringkasan="Kamar mandi, dapur, koridor, dan cara kos ini dibersihkan">
          <div className="flex flex-col gap-3">
            <Skala nilai={p.skor_kamar_mandi} label="Kamar mandi" />
            <Skala nilai={p.skor_dapur} label="Dapur bersama" />
            <Skala nilai={p.skor_koridor} label="Koridor" />
            <p className="text-micro text-arang-500">Skor kebersihan adalah rata-rata area yang bisa dinilai (paling sedikit dua).</p>
            <dl className="divide-y divide-biru-100 border-t border-biru-100">
              <Baris label="Yang membersihkan">{p.pembersih ? (PEMBERSIH[p.pembersih] ?? p.pembersih) : null}</Baris>
              <Baris label="Frekuensi bersih-bersih">{p.frekuensi_bersih}</Baris>
              <Baris label="Sampah diangkut">{p.frekuensi_sampah}</Baris>
            </dl>
          </div>
        </AccordionItem>
        <AccordionItem id="bukti-kedap" title="Lihat bukti kedap suara" ringkasan="Tembok, hasil desibel, kamar yang diukur, dan batas pengukuran">
          <div className="flex flex-col gap-3">
            <p className="text-small text-arang-900">Skor kedap suara 1–5: makin tinggi, makin baik menahan suara. Desibel (dB) di bawah adalah hasil ukurnya, bukan skor.</p>
            {p.db_ambient != null && p.db_tes != null ? (
              <div className="rounded-xl bg-kertas-50 p-3">
                <div className="flex items-end justify-between text-small">
                  <span className="text-arang-500">Sunyi</span>
                  <span className="font-bold text-arang-900 tabular-nums">{p.db_ambient} dB</span>
                </div>
                <Batang nilai={p.db_ambient} />
                <div className="mt-2 flex items-end justify-between text-small">
                  <span className="text-arang-500">Saat tes suara dari kamar sebelah</span>
                  <span className="font-bold text-arang-900 tabular-nums">{p.db_tes} dB</span>
                </div>
                <Batang nilai={p.db_tes} />
                {beda != null && (
                  <p className="mt-2 text-micro text-arang-500">
                    Selisih {beda} dB{kataSelisihDb(beda) && <>: <b className="text-arang-900">{kataSelisihDb(beda)?.toLowerCase()}</b></>}. Makin kecil, makin sedikit suara tetangga yang tembus.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-small text-arang-500">
                Tes desibel: <BelumDicatat />
              </p>
            )}
            <dl className="divide-y divide-biru-100 border-t border-biru-100">
              <Baris label="Material tembok">{p.material_tembok}</Baris>
              <Baris label="Diukur di">{p.kamar_diukur}</Baris>
              <Baris label="Menghadap jalan raya">{p.hadap_jalan_raya == null ? null : p.hadap_jalan_raya ? "Ya" : "Tidak"}</Baris>
              <Baris label="Sumber bising">{p.sumber_bising.length ? p.sumber_bising.join(", ") : "Tidak ada yang menonjol"}</Baris>
            </dl>
            <p className="text-micro text-arang-500">
              Satu kali tes di satu kamar pada jam survei. Kamar lain, lantai lain, atau jam ramai bisa berbeda; angka ini bukan pengukuran akustik laboratorium.{" "}
              <Link href="/cara-kami-menilai#batas" className="font-bold text-biru-600 hover:underline">Batas pengukuran</Link>
            </p>
          </div>
        </AccordionItem>
      </Accordion>
    </Blok>
  );
}

// One score at a glance: the number on its 1–5 scale, the rubric word and
// one sentence of what it means in practice. Missing data says so; it is
// never shown as 0.
function KartuKondisi({ judul, nilai, kata, baik, arti }: { judul: string; nilai: number | null; kata: string | null; baik: boolean; arti: string }) {
  return (
    <section aria-label={judul} className="rounded-2xl border border-biru-100 bg-putih p-4">
      <h3 className="text-small font-bold text-arang-900">
        {judul} <span className="font-medium text-arang-500">(1–5, makin tinggi makin baik)</span>
      </h3>
      {nilai == null ? (
        <p className="mt-1 text-h2 text-arang-500">Belum dinilai</p>
      ) : (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-h1 text-arang-900 tabular-nums">
            {formatSkala(nilai)}
            <span className="text-small font-medium text-arang-500">/5</span>
          </span>
          {kata && <span className={cn("text-body font-bold", baik ? "text-daun-700" : "text-arang-900")}>{kata}</span>}
        </p>
      )}
      <p className="mt-1 text-small text-arang-900">{arti}</p>
    </section>
  );
}

function Batang({ nilai }: { nilai: number }) {
  const persen = Math.min(100, Math.max(0, ((nilai - 30) / 50) * 100));
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-biru-100" aria-hidden="true">
      <div className="h-full rounded-full bg-biru-500" style={{ width: `${persen}%` }} />
    </div>
  );
}
