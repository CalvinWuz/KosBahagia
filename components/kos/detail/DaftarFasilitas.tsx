import { IconCheck, IconClose } from "@/components/ui/Icon";
import type { Fasilitas, TipeKamar } from "@/lib/kos/detail";
import { cn } from "@/lib/cn";
import { Blok } from "./bagian";

// Block 6: grouped kamar / bersama. Absence is information, so what the kos
// lacks stays visible in grey. Room-level items follow the selected type.
export function DaftarFasilitas({ semua, dimiliki, kamar }: { semua: Fasilitas[]; dimiliki: string[]; kamar: TipeKamar | null }) {
  const set = new Set(dimiliki);
  // Room-type specifics override the kos-level flag.
  const ada = (f: Fasilitas) => {
    if (f.slug === "ac" && kamar) return kamar.boleh_ac;
    if (f.slug === "parkir-motor" && kamar) return kamar.parkir_motor;
    if (f.slug === "parkir-mobil" && kamar) return kamar.parkir_mobil;
    return set.has(f.slug);
  };
  const kelompok = [
    { judul: "Di kamar", isi: semua.filter((f) => f.kategori === "kamar") },
    { judul: "Bersama", isi: semua.filter((f) => f.kategori === "bersama") },
  ];
  return (
    <Blok id="fasilitas" judul="Fasilitas" keterangan={kamar ? `Untuk kamar ${kamar.nama}. Yang abu-abu tidak tersedia.` : "Yang abu-abu tidak tersedia."}>
      <div className="grid gap-5 sm:grid-cols-2">
        {kelompok.map((g) => (
          <div key={g.judul}>
            <h3 className="mb-2 text-small font-bold text-arang-900">{g.judul}</h3>
            <ul className="flex flex-col gap-1.5">
              {g.isi.map((f) => {
                const punya = ada(f);
                return (
                  <li key={f.slug} className={cn("flex items-center gap-2 text-small", punya ? "text-arang-900" : "text-arang-500 line-through decoration-arang-500/40")}>
                    {punya ? <IconCheck className="size-4 shrink-0 text-daun-700" /> : <IconClose className="size-4 shrink-0 text-arang-500/60" />}
                    <span>{f.nama}</span>
                    {!punya && <span className="sr-only">tidak tersedia</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Blok>
  );
}
