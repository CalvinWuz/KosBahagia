import type { Penilaian } from "@/lib/kos/detail";
import { kataKebersihan, kataKedap, kataSelisihDb } from "@/lib/skala";
import { Baris, BelumDicatat, Blok, Skala } from "./bagian";
import { ArtiSkala } from "./ArtiSkala";

const PEMBERSIH: Record<string, string> = {
  petugas: "Petugas kebersihan",
  pemilik: "Pemilik sendiri",
  penghuni: "Penghuni bergantian",
};

// Block 5: evidence, not just a number.
export function BuktiKebersihan({ penilaian }: { penilaian: Penilaian | null }) {
  if (!penilaian) {
    return (
      <Blok id="kebersihan" judul="Kebersihan & kedap suara">
        <BelumDicatat />
      </Blok>
    );
  }
  const p = penilaian;
  const beda = p.db_ambient != null && p.db_tes != null ? p.db_tes - p.db_ambient : null;
  return (
    <Blok id="kebersihan" judul="Kebersihan & kedap suara" keterangan="Dinilai di lokasi dengan rubrik tetap dan desibel meter.">
      <p className="-mt-1 mb-3 text-small"><ArtiSkala /></p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-small font-bold text-arang-900">Kebersihan</h3>
          <Skala nilai={p.skor_kamar_mandi} label="Kamar mandi" kata={kataKebersihan(p.skor_kamar_mandi)} />
          <Skala nilai={p.skor_dapur} label="Dapur" kata={kataKebersihan(p.skor_dapur)} />
          <Skala nilai={p.skor_koridor} label="Koridor" kata={kataKebersihan(p.skor_koridor)} />
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
            <Baris label="Material tembok">{p.material_tembok}</Baris>
            <Baris label="Menghadap jalan raya">{p.hadap_jalan_raya == null ? null : p.hadap_jalan_raya ? "Ya" : "Tidak"}</Baris>
            <Baris label="Sumber bising">{p.sumber_bising.length ? p.sumber_bising.join(", ") : "Tidak ada yang menonjol"}</Baris>
          </dl>
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
