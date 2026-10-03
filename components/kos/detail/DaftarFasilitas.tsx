import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { IconCheck, IconClose } from "@/components/ui/Icon";
import type { Fasilitas, TipeKamar } from "@/lib/kos/detail";
import { Blok } from "./bagian";

// Block 6: grouped kamar / bersama. What the kos has is a compact grid;
// what it lacks is still information, so it stays one tap away instead of
// being struck through one line at a time. Room-level items follow the
// selected type.
export function DaftarFasilitas({ semua, dimiliki, kamar }: { semua: Fasilitas[]; dimiliki: string[]; kamar: TipeKamar | null }) {
  const set = new Set(dimiliki);
  // Room-type specifics override the kos-level flag.
  const ada = (f: Fasilitas) => {
    if (f.slug === "ac" && kamar) return kamar.boleh_ac;
    if (f.slug === "kamar-mandi-dalam" && kamar && kamar.kamar_mandi_dalam != null) return kamar.kamar_mandi_dalam;
    if (f.slug === "parkir-motor" && kamar) return kamar.parkir_motor;
    if (f.slug === "parkir-mobil" && kamar) return kamar.parkir_mobil;
    return set.has(f.slug);
  };
  const kelompok = [
    { judul: "Di kamar", isi: semua.filter((f) => f.kategori === "kamar") },
    { judul: "Bersama", isi: semua.filter((f) => f.kategori === "bersama") },
  ];
  const tidakAda = semua.filter((f) => !ada(f));

  return (
    <Blok id="fasilitas" judul="Fasilitas" keterangan={kamar ? `Untuk kamar ${kamar.nama}.` : undefined}>
      <div className="flex flex-col gap-5">
        {kelompok.map((g) => {
          const punya = g.isi.filter(ada);
          return (
            <div key={g.judul}>
              <h3 className="mb-2 text-small font-bold text-arang-900">
                {g.judul} <span className="font-medium text-arang-500 tabular-nums">({punya.length})</span>
              </h3>
              {punya.length === 0 ? (
                <p className="text-small text-arang-500">Tidak ada yang tercatat.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                  {punya.map((f) => (
                    <li key={f.slug} className="flex items-center gap-2 text-small text-arang-900">
                      <IconCheck className="size-4 shrink-0 text-daun-700" />
                      <span>{f.nama}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {tidakAda.length > 0 && (
          <Accordion>
            <AccordionItem title={`Tidak tersedia (${tidakAda.length})`}>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-3">
                {tidakAda.map((f) => (
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
