import type { ReactNode } from "react";
import type { Sekitar, TipeKamar } from "@/lib/kos/detail";
import { formatJarak, formatRupiah, formatTanggal } from "@/lib/format";
import { PenandaDemo } from "@/components/ui/PenandaDemo";
import { BelumDicatat, Blok, Skala } from "./bagian";

const AKSES: Record<string, string> = {
  motor: "Gang muat motor",
  mobil: "Mobil bisa sampai depan",
  jalan_kaki: "Hanya bisa jalan kaki",
};

// What kos_sekitar holds for a place: name and distance from the kos, plus a
// recorded price for some (warung: one meal, laundry: per kg). Nothing else
// is invented: no opening hours, no coordinates, no walking times.
type Tempat = { nama?: string; jarak_m?: number; harga_per_kg?: number; harga_makan?: number; jenis?: string };

function tempat(t: unknown): Tempat | null {
  return t && typeof t === "object" && !Array.isArray(t) ? (t as Tempat) : null;
}

function Baris({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 py-2">
      <dt className="text-small text-arang-500">{label}</dt>
      <dd className="text-right text-small text-arang-900">{children}</dd>
    </div>
  );
}

function Kelompok({ judul, children, tambahan }: { judul: string; children: ReactNode; tambahan?: ReactNode }) {
  return (
    <section aria-label={judul} className="rounded-2xl border border-biru-100 bg-putih px-4 py-3">
      <h3 className="text-small font-bold text-arang-900">{judul}</h3>
      {tambahan}
      <dl className="divide-y divide-biru-100">{children}</dl>
    </section>
  );
}

/** Name, distance and the recorded price, or "Belum kami catat" — never "none nearby" without data. */
function Tempatnya({ t, harga }: { t: Tempat | null; harga?: string | null }) {
  if (!t) return <BelumDicatat />;
  return (
    <>
      <span className="block font-bold">{t.nama ?? "Nama belum dicatat"}</span>
      <span className="block text-arang-500">
        {t.jarak_m != null ? `${formatJarak(t.jarak_m)} dari kos` : "Jarak belum dicatat"}
        {harga ? `, ${harga}` : ""}
      </span>
    </>
  );
}

const LAUNDRY_KOS: Record<string, string> = { termasuk: "Termasuk sewa", tidak_ada: "Tidak ada" };

// Block 9: the neighbourhood by daily need. Distances are from the kos, as
// recorded by the surveyor; a missing record says "Belum kami catat".
export function SekitarKos({ sekitar, kamar, disurveiPada }: { sekitar: Sekitar | null; kamar: TipeKamar | null; disurveiPada: string | null }) {
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
  const laundryKos = kamar
    ? kamar.laundry === "berbayar"
      ? kamar.biaya_laundry
        ? `${formatRupiah(kamar.biaya_laundry)}/kg`
        : "Berbayar, tarif belum dicatat"
      : (LAUNDRY_KOS[kamar.laundry] ?? null)
    : null;

  return (
    <Blok
      id="sekitar"
      judul="Sekitar"
      keterangan={`Jarak dari kos, dicatat surveyor${disurveiPada ? ` saat survei ${formatTanggal(disurveiPada)}` : ""}. Nama tempat dan harga bisa berubah.`}
    >
      <PenandaDemo className="-mt-1 mb-3" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Kelompok judul="Kebutuhan harian">
          <Baris label="Minimarket"><Tempatnya t={minimarket} /></Baris>
        </Kelompok>
        <Kelompok judul="Makan">
          <Baris label="Warung makan">
            <Tempatnya t={warung} harga={warung?.harga_makan ? `sekali makan sekitar ${formatRupiah(warung.harga_makan)}` : null} />
          </Baris>
        </Kelompok>
        <Kelompok judul="Laundry">
          <Baris label="Laundry terdekat">
            <Tempatnya t={laundry} harga={laundry?.harga_per_kg ? `${formatRupiah(laundry.harga_per_kg)}/kg` : null} />
          </Baris>
          {kamar && (
            <Baris label="Laundry di kos">
              {laundryKos ?? <BelumDicatat />}
              <span className="block text-micro text-arang-500">untuk tipe {kamar.nama}</span>
            </Baris>
          )}
        </Kelompok>
        <Kelompok judul="Transportasi">
          <Baris label="Transportasi umum">
            {transit ? (
              <>
                <span className="block font-bold">{[transit.jenis, transit.nama].filter(Boolean).join(" ") || "Nama belum dicatat"}</span>
                <span className="block text-arang-500">{transit.jarak_m != null ? `${formatJarak(transit.jarak_m)} dari kos` : "Jarak belum dicatat"}</span>
              </>
            ) : (
              <BelumDicatat />
            )}
          </Baris>
          <Baris label="Akses gang">{AKSES[s.akses] ?? s.akses}</Baris>
        </Kelompok>
        <div className="sm:col-span-2">
          <Kelompok
            judul="Lingkungan"
            tambahan={
              <div className="border-b border-biru-100 py-2">
                <Skala nilai={s.penerangan} label="Penerangan jalan malam hari" />
              </div>
            }
          >
            <Baris label="Banjir">
              {s.rawan_banjir == null ? <BelumDicatat /> : s.rawan_banjir ? "Pernah banjir, menurut catatan survei" : "Tidak rawan banjir, menurut catatan survei"}
            </Baris>
          </Kelompok>
        </div>
      </div>
    </Blok>
  );
}
