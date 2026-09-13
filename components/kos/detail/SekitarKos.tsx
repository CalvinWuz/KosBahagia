import type { Sekitar } from "@/lib/kos/detail";
import { formatJarak, formatRupiah } from "@/lib/format";
import { Baris, BelumDicatat, Blok, Skala } from "./bagian";

const AKSES: Record<string, string> = {
  motor: "Gang muat motor",
  mobil: "Mobil bisa sampai depan",
  jalan_kaki: "Hanya bisa jalan kaki",
};
type Tempat = { nama?: string; jarak_m?: number; harga_per_kg?: number; harga?: string; jenis?: string } | null;

function tempat(t: unknown): Tempat {
  return t && typeof t === "object" ? (t as Tempat) : null;
}

// Block 9.
export function SekitarKos({ sekitar }: { sekitar: Sekitar | null }) {
  if (!sekitar) {
    return (
      <Blok id="sekitar" judul="Sekitar">
        <BelumDicatat />
      </Blok>
    );
  }
  const s = sekitar;
  const minimarket = tempat(s.minimarket);
  const warung = tempat(s.warung);
  const laundry = tempat(s.laundry);
  const transit = tempat(s.transit);
  const isi = (t: Tempat, tambahan?: string) =>
    t ? (
      <>
        <span className="block font-bold">{t.nama ?? "Ada"}</span>
        {t.jarak_m != null && <span className="block">{formatJarak(t.jarak_m)}{tambahan ? `, ${tambahan}` : ""}</span>}
      </>
    ) : (
      "Tidak ada yang dekat"
    );
  return (
    <Blok id="sekitar" judul="Sekitar">
      <dl className="divide-y divide-biru-100 rounded-2xl border border-biru-100 bg-putih px-4">
        <Baris label="Minimarket">{isi(minimarket)}</Baris>
        <Baris label="Warung makan">{isi(warung, warung?.harga)}</Baris>
        <Baris label="Laundry">{isi(laundry, laundry?.harga_per_kg ? `${formatRupiah(laundry.harga_per_kg)}/kg` : undefined)}</Baris>
        <Baris label="Transportasi umum">
          {transit ? (
            <>
              <span className="block font-bold">{[transit.jenis, transit.nama].filter(Boolean).join(" ")}</span>
              {transit.jarak_m != null && <span className="block">{formatJarak(transit.jarak_m)}</span>}
            </>
          ) : (
            "Tidak ada yang dekat"
          )}
        </Baris>
        <Baris label="Akses gang">{AKSES[s.akses] ?? s.akses}</Baris>
        <Baris label="Rawan banjir">{s.rawan_banjir == null ? null : s.rawan_banjir ? "Ya, pernah banjir" : "Tidak"}</Baris>
      </dl>
      <div className="mt-3 rounded-2xl border border-biru-100 bg-putih px-4 py-3">
        <Skala nilai={s.penerangan} label="Penerangan jalan malam hari" />
      </div>
    </Blok>
  );
}
