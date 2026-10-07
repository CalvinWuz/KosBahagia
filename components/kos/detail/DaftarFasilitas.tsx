import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { IconCheck, IconClose } from "@/components/ui/Icon";
import { formatRupiah } from "@/lib/format";
import { hitungBiaya, type ItemBiaya } from "@/lib/biaya";
import type { Fasilitas, TipeKamar } from "@/lib/kos/detail";
import { Blok } from "./bagian";

// Facilities recorded per room type (follow the selected room).
const PER_KAMAR = new Set(["kamar-mandi-dalam", "ac", "parkir-motor", "parkir-mobil"]);

type Isi = { f: Fasilitas; catatan?: string | null };

// Block 6, grouped by where the data comes from so a shared facility never
// reads as something every room has:
//   Di kamar <tipe>          recorded for the selected room type
//   Di kamar (dicatat per kos)  room facilities recorded for the kos as a whole
//   Dipakai bersama          shared by everyone in the kos
//   Tidak ada di tipe ini    a room-level "no"
//   Belum dicatat            a room-level unknown
//   Tidak tercatat saat survei  absent from the kos record (folded; the data
//                            cannot tell "none" from "not noted", so it says so)
// Where a facility has its own cost (AC, WiFi, parking), the cost is named
// next to it: "ada WiFi" is never presented as "WiFi gratis".
export function DaftarFasilitas({ semua, dimiliki, kamar }: { semua: Fasilitas[]; dimiliki: string[]; kamar: TipeKamar | null }) {
  const set = new Set(dimiliki);
  const biaya = kamar ? hitungBiaya(kamar) : null;

  /** true / false from the room record, null = room-level but not recorded, undefined = kos-level. */
  const diKamar = (f: Fasilitas): boolean | null | undefined => {
    if (!kamar || !PER_KAMAR.has(f.slug)) return undefined;
    if (f.slug === "ac") return kamar.boleh_ac;
    if (f.slug === "kamar-mandi-dalam") return kamar.kamar_mandi_dalam;
    if (f.slug === "parkir-motor") return kamar.parkir_motor;
    return kamar.parkir_mobil;
  };

  const cariBiaya = (pola: RegExp): ItemBiaya | undefined =>
    biaya ? [...biaya.bulanan, ...biaya.opsional].find((b) => pola.test(b.nama)) : undefined;
  const catatanBiaya = (f: Fasilitas): string | null => {
    const b =
      f.slug === "ac" ? cariBiaya(/^Biaya AC$/)
      : f.slug === "wifi" ? cariBiaya(/wi-?fi|internet/i)
      : f.slug === "parkir-motor" ? cariBiaya(/^Parkir motor$/)
      : f.slug === "parkir-mobil" ? cariBiaya(/^Parkir mobil$/)
      : undefined;
    if (!b) return null;
    if (b.sifat === "termasuk") return "tanpa biaya tambahan";
    if (b.sifat === "belum_diketahui") return "biayanya belum diketahui";
    if (b.sifat === "opsional") return b.jumlah ? `${formatRupiah(b.jumlah)}/bln kalau dipakai` : "gratis";
    return b.jumlah != null ? `${formatRupiah(b.jumlah)}/bln, masuk total` : null;
  };

  const isi = (f: Fasilitas): Isi => ({ f, catatan: catatanBiaya(f) });
  const kamarYa = semua.filter((f) => f.kategori === "kamar" && diKamar(f) === true).map(isi);
  const kamarKos = semua.filter((f) => f.kategori === "kamar" && diKamar(f) === undefined && set.has(f.slug)).map(isi);
  const bersama = semua.filter((f) => f.kategori !== "kamar" && (diKamar(f) === true || (diKamar(f) === undefined && set.has(f.slug)))).map(isi);
  const tidakDiKamar = semua.filter((f) => diKamar(f) === false);
  const belumDicatat = semua.filter((f) => diKamar(f) === null);
  const tidakTercatat = semua.filter((f) => diKamar(f) === undefined && !set.has(f.slug));

  const kelompok = [
    // An empty room-level group says nothing the "Tidak termasuk" list below does not.
    { judul: kamar ? `Di kamar ${kamar.nama}` : "Di kamar", keterangan: kamar ? "Dicatat untuk tipe kamar ini." : undefined, isi: kamarYa, wajib: tidakDiKamar.length === 0 },
    { judul: "Di kamar, dicatat per kos", keterangan: "Belum dicatat per tipe kamar.", isi: kamarKos, wajib: false },
    { judul: "Dipakai bersama", keterangan: "Untuk semua penghuni, bukan milik satu kamar.", isi: bersama, wajib: true },
  ];

  return (
    <Blok id="fasilitas" judul="Fasilitas" keterangan={kamar ? `Untuk kamar ${kamar.nama}. Ganti tipe kamar di Ringkasan untuk melihat yang berbeda.` : undefined}>
      <div className="flex flex-col gap-5">
        {kelompok.map((g) =>
          g.isi.length === 0 && !g.wajib ? null : (
            <div key={g.judul}>
              <h3 className="text-small font-bold text-arang-900">
                {g.judul} <span className="font-medium text-arang-500 tabular-nums">({g.isi.length})</span>
              </h3>
              {g.keterangan && <p className="text-micro text-arang-500">{g.keterangan}</p>}
              {g.isi.length === 0 ? (
                <p className="mt-2 text-small text-arang-500">Tidak ada yang tercatat.</p>
              ) : (
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                  {g.isi.map(({ f, catatan }) => (
                    <li key={f.slug} className="flex items-start gap-2 text-small text-arang-900">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-daun-700" />
                      <span>
                        {f.nama}
                        {catatan && <span className="block text-micro text-arang-500">{catatan}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ),
        )}

        {(tidakDiKamar.length > 0 || belumDicatat.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {tidakDiKamar.length > 0 && (
              <div>
                <h3 className="text-small font-bold text-arang-900">Tidak termasuk untuk tipe kamar ini</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {tidakDiKamar.map((f) => (
                    <li key={f.slug} className="flex items-center gap-2 text-small text-arang-900">
                      <IconClose className="size-4 shrink-0 text-arang-500" />
                      {f.nama}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {belumDicatat.length > 0 && (
              <div>
                <h3 className="text-small font-bold text-arang-900">Belum dicatat untuk tipe kamar ini</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {belumDicatat.map((f) => (
                    <li key={f.slug} className="text-small text-arang-500">{f.nama}: tanyakan ke pemilik</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {tidakTercatat.length > 0 && (
          <Accordion>
            <AccordionItem title={`Lihat fasilitas yang tidak tercatat (${tidakTercatat.length})`} ringkasan="Tidak kami temukan atau tidak tercatat saat survei">
              <p className="mb-2 text-small text-arang-500">Belum tentu tidak ada sama sekali. Kalau salah satunya penting buatmu, tanyakan ke pemilik.</p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                {tidakTercatat.map((f) => (
                  <li key={f.slug} className="flex items-center gap-2 text-small text-arang-500">
                    <IconClose className="size-4 shrink-0 text-arang-500/60" />
                    <span>{f.nama}</span>
                  </li>
                ))}
              </ul>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </Blok>
  );
}
