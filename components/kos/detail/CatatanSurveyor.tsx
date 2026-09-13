import { IconCheck } from "@/components/ui/Icon";
import type { Catatan } from "@/lib/kos/detail";
import { BelumDicatat, Blok } from "./bagian";

function tanggal(iso: string | null): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

// Block 10. Red flags come first, in a panel that cannot be collapsed and
// looks the same for every tier.
export function CatatanSurveyor({ catatan, surveyor, disurveiPada }: { catatan: Catatan | null; surveyor: string | null; disurveiPada: string | null }) {
  const redFlags = catatan?.red_flags ?? [];
  return (
    <Blok id="catatan" judul="Catatan surveyor" keterangan={surveyor ? `Ditulis oleh ${surveyor}${disurveiPada ? `, survei ${tanggal(disurveiPada)}` : ""}` : undefined}>
      {redFlags.length > 0 && (
        <div role="alert" className="mb-4 rounded-2xl border border-merah-700/30 bg-merah-100 p-4">
          <h3 className="text-body font-bold text-merah-700">Perlu kamu tahu sebelum memutuskan</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {redFlags.map((r) => (
              <li key={r} className="flex gap-2 text-small text-merah-700">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-merah-700" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!catatan ? (
        <BelumDicatat />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-biru-100 bg-putih p-4">
            <h3 className="text-small font-bold text-daun-700">Yang bagus</h3>
            {catatan.hal_baik.length ? (
              <ul className="mt-2 flex flex-col gap-2">
                {catatan.hal_baik.map((h) => (
                  <li key={h} className="flex gap-2 text-small text-arang-900">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-daun-700" />
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <BelumDicatat className="mt-2 block" />
            )}
          </div>
          <div className="rounded-2xl border border-biru-100 bg-putih p-4">
            <h3 className="text-small font-bold text-arang-900">Yang perlu kamu tahu</h3>
            {catatan.perlu_diketahui.length ? (
              <ul className="mt-2 flex flex-col gap-2">
                {catatan.perlu_diketahui.map((h) => (
                  <li key={h} className="flex gap-2 text-small text-arang-900">
                    <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-arang-500/10 text-micro font-bold text-arang-500">!</span>
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <BelumDicatat className="mt-2 block" />
            )}
          </div>
          <div className="sm:col-span-2">
            <h3 className="text-small font-bold text-arang-900">Kesan terhadap pemilik</h3>
            <p className="mt-1 text-small text-arang-900">{catatan.kesan_pemilik ?? <BelumDicatat />}</p>
          </div>
        </div>
      )}
    </Blok>
  );
}
