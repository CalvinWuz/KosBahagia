import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { faktaBiayaArea } from "./fakta.ts";
import type { Json } from "../supabase/types.ts";

// A room row as the search returns it; only the cost fields matter here.
const kamar = (harga: number, ubah: Record<string, unknown> = {}): { kamar: Json } => ({
  kamar: {
    id: `k${harga}`, kos_id: "k", nama: "Standar", ukuran: null, harga_bulanan: harga, harga_tahunan: null, durasi_minimal: 1,
    deposit: null, deposit_kembali: null, model_listrik: "termasuk", estimasi_listrik: null, boleh_ac: false, biaya_ac: null,
    biaya_air: null, laundry: "tidak_ada", biaya_laundry: null, parkir_motor: false, biaya_parkir_motor: null, parkir_mobil: false,
    biaya_parkir_mobil: null, biaya_lain: [], kamar_tersedia: 1, total_kamar: 1, total_bulanan: harga, kamar_mandi_dalam: false,
    bayar_dimuka_bulan: 1, biaya_sekali: [], ketentuan_deposit: null, harga_dikonfirmasi_pada: null, total_lengkap: true, total_estimasi: false,
    ...ubah,
  } as Json,
});

describe("fakta biaya area", () => {
  it("medians the totals that are complete or estimated", () => {
    const f = faktaBiayaArea([kamar(1_000_000), kamar(1_200_000, { model_listrik: "token", estimasi_listrik: 150_000 }), kamar(2_000_000)]);
    assert.deepEqual(f, { median: 1_350_000, min: 1_000_000, max: 2_000_000, dihitung: 3, estimasi: 1, belumLengkap: 0 });
  });

  it("keeps a total with an unknown fee out of the median and the range, and counts it", () => {
    const sementara = kamar(500_000, { model_listrik: "token", estimasi_listrik: null });
    const f = faktaBiayaArea([kamar(1_000_000), kamar(1_400_000), sementara]);
    assert.equal(f.min, 1_000_000);
    assert.equal(f.median, 1_200_000);
    assert.equal(f.dihitung, 2);
    assert.equal(f.belumLengkap, 1);
  });

  it("says nothing when no total is complete", () => {
    const f = faktaBiayaArea([kamar(800_000, { model_listrik: "meteran", estimasi_listrik: null }), { kamar: null }]);
    assert.deepEqual(f, { median: null, min: null, max: null, dihitung: 0, estimasi: 0, belumLengkap: 1 });
  });
});
