import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hitungBiaya, hitungUangMasuk, komponenSingkat, labelTotal, type KamarUangMasuk } from "./biaya.ts";

const dasar: KamarUangMasuk = {
  harga_bulanan: 1_250_000,
  model_listrik: "termasuk",
  estimasi_listrik: null,
  biaya_air: null,
  boleh_ac: false,
  biaya_ac: null,
  biaya_lain: [{ nama: "Iuran keamanan", jumlah: 15_000 }],
  parkir_motor: true,
  biaya_parkir_motor: 50_000,
  parkir_mobil: false,
  biaya_parkir_mobil: null,
  laundry: "berbayar",
  biaya_laundry: 7_000,
  deposit: 1_250_000,
  deposit_kembali: "tidak",
  ketentuan_deposit: "Tidak dikembalikan saat keluar.",
  bayar_dimuka_bulan: 1,
  biaya_sekali: [],
  durasi_minimal: 1,
};

describe("hitungBiaya", () => {
  it("Cikampek Asri: rent + security fee, nothing else counted", () => {
    const b = hitungBiaya(dasar);
    assert.equal(b.total, 1_265_000);
    assert.equal(b.lengkap, true);
    assert.equal(b.estimasi, false);
    assert.equal(labelTotal(b), "Total per bulan");
    assert.deepEqual(komponenSingkat(b), ["iuran keamanan"]);
  });

  it("optional spend (parking, laundry, optional extras) stays out of the total", () => {
    const b = hitungBiaya({ ...dasar, biaya_lain: [{ nama: "Iuran keamanan", jumlah: 15_000 }, { nama: "Galon", jumlah: 40_000, wajib: false }] });
    assert.equal(b.total, 1_265_000);
    assert.deepEqual(b.opsional.map((o) => o.nama), ["Parkir motor", "Laundry", "Galon"]);
  });

  it("token electricity makes the total an estimate", () => {
    const b = hitungBiaya({ ...dasar, model_listrik: "token", estimasi_listrik: 180_000 });
    assert.equal(b.total, 1_445_000);
    assert.equal(b.estimasi, true);
    assert.equal(labelTotal(b), "Estimasi total per bulan");
    assert.equal(b.bulanan.find((x) => x.nama === "Listrik")?.sifat, "pemakaian");
    assert.deepEqual(komponenSingkat(b), ["listrik (estimasi)", "iuran keamanan"]);
  });

  it("keeps acronyms readable in the short list", () => {
    const b = hitungBiaya({ ...dasar, boleh_ac: true, biaya_ac: 100_000, biaya_lain: [{ nama: "WiFi", jumlah: 75_000 }] });
    assert.deepEqual(komponenSingkat(b), ["AC", "WiFi"]);
  });

  it("flat electricity is a fixed fee, not an estimate", () => {
    const b = hitungBiaya({ ...dasar, model_listrik: "flat", estimasi_listrik: 125_000 });
    assert.equal(b.estimasi, false);
    assert.equal(b.bulanan.find((x) => x.nama === "Listrik")?.sifat, "tetap");
  });

  it("an unknown electricity amount is not free: total incomplete, item named", () => {
    const b = hitungBiaya({ ...dasar, model_listrik: "meteran", estimasi_listrik: null });
    assert.equal(b.total, 1_265_000); // known parts only, as the database stores it
    assert.equal(b.lengkap, false);
    assert.deepEqual(b.belumDiketahui, ["Listrik"]);
    assert.equal(labelTotal(b), "Total sementara");
  });

  it("an unknown mandatory fee is listed, not summed as 0", () => {
    const b = hitungBiaya({ ...dasar, biaya_lain: [{ nama: "Sampah", jumlah: null }] });
    assert.equal(b.lengkap, false);
    assert.deepEqual(b.belumDiketahui, ["Sampah"]);
  });

  it("water and AC with no amount are included, not unknown", () => {
    const b = hitungBiaya({ ...dasar, boleh_ac: true, biaya_ac: null });
    assert.equal(b.bulanan.find((x) => x.nama === "Air")?.sifat, "termasuk");
    assert.equal(b.bulanan.find((x) => x.nama === "Biaya AC")?.sifat, "termasuk");
    assert.equal(b.lengkap, true);
  });

  it("reports the non-rent share as information", () => {
    const b = hitungBiaya({ ...dasar, harga_bulanan: 800_000, biaya_lain: [{ nama: "WiFi", jumlah: 200_000 }] });
    assert.equal(b.porsiTambahan, 0.2);
  });
});

describe("hitungUangMasuk", () => {
  it("adds one month up front, the deposit and one-off fees once each", () => {
    const u = hitungUangMasuk({ ...dasar, biaya_sekali: [{ nama: "Biaya administrasi", jumlah: 100_000 }] });
    assert.equal(u.bayarDimuka, 1_265_000);
    assert.equal(u.total, 1_265_000 + 1_250_000 + 100_000);
    assert.equal(u.lengkap, true);
  });

  it("months up front multiply the monthly total, not the deposit", () => {
    const u = hitungUangMasuk({ ...dasar, bayar_dimuka_bulan: 3 });
    assert.equal(u.bayarDimuka, 3 * 1_265_000);
    assert.equal(u.total, 3 * 1_265_000 + 1_250_000);
  });

  it("minimum stay is reported separately from months paid up front", () => {
    const u = hitungUangMasuk({ ...dasar, durasi_minimal: 6, bayar_dimuka_bulan: 1 });
    assert.equal(u.durasiMinimal, 6);
    assert.equal(u.bulanDimuka, 1);
    assert.equal(u.bayarDimuka, 1_265_000);
  });

  it("unknown months up front: counts one month and says the sum is incomplete", () => {
    const u = hitungUangMasuk({ ...dasar, bayar_dimuka_bulan: null });
    assert.equal(u.bulanDimuka, null);
    assert.equal(u.total, 1_265_000 + 1_250_000);
    assert.equal(u.lengkap, false);
    assert.deepEqual(u.belumDiketahui, ["berapa bulan sewa dibayar di muka"]);
  });

  it("an admin fee without an amount is named, not counted as 0", () => {
    const u = hitungUangMasuk({ ...dasar, biaya_sekali: [{ nama: "Biaya administrasi", jumlah: null }] });
    assert.equal(u.lengkap, false);
    assert.deepEqual(u.belumDiketahui, ["biaya administrasi"]);
  });

  it("no deposit means no deposit terms are expected", () => {
    const u = hitungUangMasuk({ ...dasar, deposit: 0, deposit_kembali: null, ketentuan_deposit: null });
    assert.equal(u.deposit, 0);
    assert.equal(u.depositKembali, null);
    assert.equal(u.total, 1_265_000);
  });

  it("an estimated monthly total makes the move-in sum an estimate", () => {
    const u = hitungUangMasuk({ ...dasar, model_listrik: "token", estimasi_listrik: 150_000 });
    assert.equal(u.estimasi, true);
  });
});
