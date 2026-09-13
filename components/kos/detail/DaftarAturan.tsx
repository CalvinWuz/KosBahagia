import type { Aturan } from "@/lib/kos/detail";
import { Baris, BelumDicatat, Blok } from "./bagian";

const TAMU: Record<string, string> = { boleh: "Boleh sampai ke kamar", ruang_tamu: "Hanya di ruang tamu", tidak: "Tidak menerima tamu" };
const PASANGAN: Record<string, string> = { boleh: "Boleh", tidak: "Tidak boleh", surat_nikah: "Boleh dengan surat nikah" };
const MEROKOK: Record<string, string> = { kamar: "Boleh di kamar", luar: "Di luar saja", dilarang: "Dilarang" };
const yaTidak = (v: boolean) => (v ? "Boleh" : "Tidak boleh");

// Block 7.
export function DaftarAturan({ aturan }: { aturan: Aturan | null }) {
  if (!aturan) {
    return (
      <Blok id="aturan" judul="Aturan">
        <BelumDicatat />
      </Blok>
    );
  }
  const a = aturan;
  const jam = a.jam_malam ? `Pukul ${a.jam_malam.slice(0, 5).replace(":", ".")}` : "Tidak ada jam malam";
  return (
    <Blok id="aturan" judul="Aturan">
      <dl className="divide-y divide-biru-100 rounded-2xl border border-biru-100 bg-putih px-4">
        <Baris label="Jam malam">{jam}</Baris>
        <Baris label="Tamu">{TAMU[a.tamu]}</Baris>
        <Baris label="Tamu lawan jenis">{TAMU[a.lawan_jenis]}</Baris>
        <Baris label="Pasangan">{PASANGAN[a.pasangan]}</Baris>
        <Baris label="Bawa anak">{yaTidak(a.anak)}</Baris>
        <Baris label="Hewan peliharaan">{yaTidak(a.hewan)}</Baris>
        <Baris label="Masak di kamar">{yaTidak(a.masak_di_kamar)}</Baris>
        <Baris label="Merokok">{MEROKOK[a.merokok]}</Baris>
        <Baris label="Mayoritas penghuni">{a.mayoritas_penghuni}</Baris>
        <Baris label="Suasana">{a.suasana}</Baris>
      </dl>
    </Blok>
  );
}
