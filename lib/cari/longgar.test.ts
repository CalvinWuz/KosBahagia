import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CariParams } from "../cari-params.ts";
import type { KlienCari } from "./ambil.ts";
import { kandidatLonggar, saranLonggar } from "./longgar.ts";

// A fake search over a tiny fixture: the counts come from the arguments the
// real helper sends, so this checks candidate building and ranking, not SQL.
type Kos = { tipe: "putra" | "putri" | "campur"; total: number; km: boolean; ac: boolean };
const DATA: Kos[] = [
  { tipe: "putri", total: 1_400_000, km: false, ac: false },
  { tipe: "putri", total: 1_900_000, km: true, ac: true },
  { tipe: "campur", total: 1_700_000, km: true, ac: false },
  { tipe: "putra", total: 1_200_000, km: false, ac: false },
  { tipe: "putra", total: 2_400_000, km: true, ac: true },
];

const klien: KlienCari = {
  rpc(_fn: string, args: Record<string, unknown>) {
    const tipe = args.p_tipe as string[] | undefined;
    const fas = (args.p_fasilitas as string[] | undefined) ?? [];
    const max = args.p_harga_max as number | undefined;
    const cocok = DATA.filter(
      (k) =>
        (!tipe?.length || tipe.includes(k.tipe)) &&
        (max == null || k.total <= max) &&
        (!fas.includes("kamar-mandi-dalam") || k.km) &&
        (!fas.includes("ac") || k.ac),
    );
    const data = cocok.length ? [{ total_count: cocok.length }] : [];
    return Promise.resolve({ data, error: null });
  },
} as unknown as KlienCari;

const PUSAT = { lat: -6.2, lng: 106.78, radius: 3000, nama: "Palmerah" };
const NAMA = { "kamar-mandi-dalam": "Kamar mandi dalam", ac: "AC" };

describe("saranLonggar", () => {
  it("offers one relaxation per choice, each facility on its own", () => {
    const p: CariParams = { tipe: ["putri"], harga_max: 1_500_000, fasilitas: ["kamar-mandi-dalam", "ac"] };
    const label = kandidatLonggar(p, NAMA).map((k) => k.label);
    assert.deepEqual(label, [
      "Longgarkan harga ke Rp1.900.000",
      "Hapus batas harga maksimal",
      "Tampilkan semua tipe kos",
      "Hapus syarat kamar mandi dalam",
      "Hapus syarat AC",
      "Hapus semua syarat fasilitas",
    ]);
  });

  it("returns only relaxations with results, most results first, with valid counts", async () => {
    const p: CariParams = { tipe: ["putri"], harga_max: 1_500_000, fasilitas: ["kamar-mandi-dalam"] };
    const saran = await saranLonggar(klien, p, PUSAT, NAMA);
    assert.deepEqual(
      saran.map((s) => [s.label, s.jumlah]),
      [
        ["Longgarkan harga ke Rp1.900.000", 1],
        ["Hapus batas harga maksimal", 1],
        ["Hapus syarat kamar mandi dalam", 1],
      ],
    );
    // The relaxed search keeps every other choice.
    assert.deepEqual(saran[2].params, { tipe: ["putri"], harga_max: 1_500_000, fasilitas: [] });
  });

  it("nothing to relax, nothing suggested", async () => {
    assert.deepEqual(await saranLonggar(klien, {}, PUSAT), []);
  });
});
