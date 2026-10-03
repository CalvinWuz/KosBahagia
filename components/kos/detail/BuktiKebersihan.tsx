import Link from "next/link";
import type { Penilaian } from "@/lib/kos/detail";
import { PenandaDemo } from "@/components/ui/PenandaDemo";
import { formatTanggal } from "@/lib/format";
import { kataKebersihan, kataKedap, kataSelisihDb, skorKebersihanRata } from "@/lib/skala";
import { Baris, BelumDicatat, Blok, Skala } from "./bagian";
import { ArtiSkala } from "./ArtiSkala";

const PEMBERSIH: Record<string, string> = {
  petugas: "Petugas kebersihan",
  pemilik: "Pemilik sendiri",
  penghuni: "Penghuni bergantian",
};

// Block 5: evidence, not just a number. Measured values only; the
// surveyor's impressions live in "Catatan surveyor". The word next to a
// number comes from lib/skala and is only shown where the scale defines it:
// once for the cleanliness average (the same word the card and the score
// use) and once for soundproofing; the three areas show their raw 1–5.
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
  return (
    <Blok id="kebersihan" judul="Kebersihan & kedap suara" keterangan={`Hasil ukur di lokasi${disurveiPada ? ` saat survei ${formatTanggal(disurveiPada)}` : ""}, dengan rubrik tetap.`}>
      <p className="-mt-1 mb-3 flex flex-wrap items-center gap-2 text-small"><ArtiSkala /><PenandaDemo /></p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-small font-bold text-arang-900">
            Kebersihan{rata != null && <span className="font-medium text-arang-500">: rata-rata {String(rata).replace(".", ",")}/5, {kataKebersihan(rata)?.toLowerCase()}</span>}
          </h3>
          <Skala nilai={p.skor_kamar_mandi} label="Kamar mandi" />
          <Skala nilai={p.skor_dapur} label="Dapur bersama" />
          <Skala nilai={p.skor_koridor} label="Koridor" />
          <dl className="divide-y divide-biru-100 border-t border-biru-100">
            <Baris label="Yang membersihkan">{p.pembersih ? (PEMBERSIH[p.pembersih] ?? p.pembersih) : null}</Baris>
            <Baris label="Frekuensi bersih-bersih">{p.frekuensi_bersih}</Baris>
            <Baris label="Sampah diangkut">{p.frekuensi_sampah}</Baris>
          </dl>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-small font-bold text-arang-900">Kedap suara</h3>
          <Skala nilai={p.skor_kedap} label="Kedap suara" kata={kataKedap(p.skor_kedap)} />
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
            <Baris label="Diukur di">{p.kamar_diukur}</Baris>
            <Baris label="Material tembok">{p.material_tembok}</Baris>
            <Baris label="Menghadap jalan raya">{p.hadap_jalan_raya == null ? null : p.hadap_jalan_raya ? "Ya" : "Tidak"}</Baris>
            <Baris label="Sumber bising">{p.sumber_bising.length ? p.sumber_bising.join(", ") : "Tidak ada yang menonjol"}</Baris>
          </dl>
          <p className="text-micro text-arang-500">
            Satu kali tes di satu kamar pada jam survei. Kamar lain, lantai lain, atau jam ramai bisa berbeda; angka ini bukan pengukuran akustik laboratorium.{" "}
            <Link href="/cara-kami-menilai#batas" className="font-bold text-biru-600 hover:underline">Batas pengukuran</Link>
          </p>
        </div>
      </div>
    </Blok>
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
