import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { kelebihanKekurangan, type BahanRingkasan } from "./ringkasan.ts";
import type { TipeKamar } from "../biaya.ts";

const kamar = {
  id: "ac", kos_id: "k", nama: "AC + kamar mandi dalam", ukuran: "3×4 m", harga_bulanan: 1_900_000, harga_tahunan: null,
  durasi_minimal: 1, deposit: 1_450_000, deposit_kembali: "sebagian", model_listrik: "flat", estimasi_listrik: 125_000,
  boleh_ac: true, biaya_ac: 100_000, biaya_air: 45_000, laundry: "tidak_ada", biaya_laundry: null, parkir_motor: false,
  biaya_parkir_motor: null, parkir_mobil: false, biaya_parkir_mobil: null, biaya_lain: [{ nama: "Sampah", jumlah: 25_000 }],
  kamar_tersedia: 0, total_kamar: 6, total_bulanan: 2_195_000, kamar_mandi_dalam: true, bayar_dimuka_bulan: 1,
  biaya_sekali: [], ketentuan_deposit: null, harga_dikonfirmasi_pada: null, total_lengkap: true, total_estimasi: false,
} as TipeKamar;

const anggrekCakra: BahanRingkasan = {
  kebersihan: 5,
  transparansi: 3.75,
  penilaian: { skor_kedap: 1, material_tembok: "gypsum" },
  aturan: { jam_malam: null },
  sekitar: { landmark_nama: "BINUS University Kampus Anggrek", landmark_menit_jalan: 12 },
  redFlags: 0,
  kamar,
  status: { status: "penuh", tersedia: 0, total: 6, dikonfirmasiPada: null, label: "Penuh", rincian: "", waktu: "" },
};

describe("kelebihanKekurangan", () => {
  it("states the measured noise problem and the full room, not a contradiction", () => {
    const r = kelebihanKekurangan(anggrekCakra);
    assert.deepEqual(r.kekurangan, ["Tipe kamar ini sedang penuh", "Berisik saat tes suara (1/5, tembok gypsum)"]);
    assert.equal(r.kelebihan[0], "Sangat bersih (kebersihan 5/5)");
    assert.ok(!r.kelebihan.some((k) => /kedap/i.test(k)));
  });
  it("puts safety red flags first and caps both lists at three", () => {
    const r = kelebihanKekurangan({ ...anggrekCakra, redFlags: 2, aturan: { jam_malam: "22:00:00" }, kamar: { ...kamar, kamar_mandi_dalam: false } });
    assert.equal(r.kekurangan[0], "2 catatan keselamatan dari surveyor");
    assert.equal(r.kekurangan.length, 3);
  });
  it("an unrecorded bathroom is neither a plus nor a minus", () => {
    const r = kelebihanKekurangan({ ...anggrekCakra, status: null, kamar: { ...kamar, kamar_mandi_dalam: null } });
    assert.ok(!r.kelebihan.some((k) => /kamar mandi/i.test(k)));
    assert.ok(!r.kekurangan.some((k) => /kamar mandi/i.test(k)));
  });
  it("names unknown fees as a drawback", () => {
    const r = kelebihanKekurangan({ ...anggrekCakra, status: null, penilaian: null, kamar: { ...kamar, model_listrik: "meteran", estimasi_listrik: null } });
    assert.deepEqual(r.kekurangan, ["Biaya listrik belum diketahui"]);
  });
});
