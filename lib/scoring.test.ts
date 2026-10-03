import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cekTransparansi,
  hitungSkorBahagia,
  skorFasilitas,
  skorJalanKaki,
  skorTransparansi,
  type KamarTransparansi,
  type SkorInput,
} from "./scoring.ts";

const SEKARANG = new Date("2026-10-03T00:00:00Z");

/** A room type that passes all four disclosure checks. */
const kamarJelas: KamarTransparansi = {
  harga_bulanan: 1_200_000,
  model_listrik: "flat",
  estimasi_listrik: 150_000,
  biaya_air: null,
  boleh_ac: false,
  biaya_ac: null,
  biaya_lain: [{ nama: "Sampah", jumlah: 20_000 }],
  parkir_motor: false,
  biaya_parkir_motor: null,
  parkir_mobil: false,
  biaya_parkir_mobil: null,
  laundry: "tidak_ada",
  biaya_laundry: null,
  bayar_dimuka_bulan: 1,
  deposit: 500_000,
  deposit_kembali: "ya",
  ketentuan_deposit: "Kembali penuh 7 hari setelah keluar.",
  biaya_sekali: [],
  harga_dikonfirmasi_pada: "2026-09-20T00:00:00Z",
};
/** Same room, deposit terms not recorded: 3 of 4 checks. */
const kamarTigaPerempat: KamarTransparansi = { ...kamarJelas, ketentuan_deposit: null };

const lengkap: SkorInput = {
  skor_kamar_mandi: 4,
  skor_dapur: 3,
  skor_koridor: 5,
  skor_kedap: 4,
  kamar: [kamarTigaPerempat],
  sekarang: SEKARANG,
  jumlah_fasilitas: 6,
  fasilitas_sebaya: [2, 4, 8],
  sekitar: { landmark_menit_jalan: 7, penerangan: 4, jumlah_amenitas: 3 },
};

describe("hitungSkorBahagia", () => {
  it("all-max input scores 10.0 with every component at 5", () => {
    const hasil = hitungSkorBahagia({
      skor_kamar_mandi: 5,
      skor_dapur: 5,
      skor_koridor: 5,
      skor_kedap: 5,
      kamar: [kamarJelas],
      sekarang: SEKARANG,
      jumlah_fasilitas: 9,
      fasilitas_sebaya: [1, 2, 3],
      sekitar: { landmark_menit_jalan: 3, penerangan: 5, jumlah_amenitas: 4 },
    });
    assert.equal(hasil.skor, 10);
    assert.deepEqual(hasil.komponen, {
      kebersihan: 5,
      kedap: 5,
      transparansi: 5,
      fasilitas: 5, // most facilities in the bucket
      sekitar: 5,
    });
  });

  it("all-null rubric returns null, never a guessed number", () => {
    const hasil = hitungSkorBahagia({
      skor_kamar_mandi: null,
      skor_dapur: null,
      skor_koridor: null,
      skor_kedap: null,
      kamar: [{ ...kamarJelas, bayar_dimuka_bulan: null, harga_dikonfirmasi_pada: "2026-01-01T00:00:00Z" }],
      sekarang: SEKARANG,
      jumlah_fasilitas: 0,
      fasilitas_sebaya: [],
      sekitar: null,
    });
    assert.equal(hasil.skor, null);
    assert.equal(hasil.komponen.kebersihan, null);
    assert.equal(hasil.komponen.kedap, null);
    assert.equal(hasil.komponen.sekitar, null);
    // Components that only need price data are still reported.
    assert.equal(hasil.komponen.transparansi, 2.5);
    assert.equal(hasil.komponen.fasilitas, 3);
  });

  it("computes the documented example", () => {
    const hasil = hitungSkorBahagia(lengkap);
    // kebersihan 4, kedap 4, transparansi 3 of 4 checks = 3.75,
    // fasilitas: 2 of 3 peers below → 2/3 → 3.67,
    // sekitar: mean(4, 4, 4) = 4
    assert.deepEqual(hasil.komponen, {
      kebersihan: 4,
      kedap: 4,
      transparansi: 3.75,
      fasilitas: 3.67,
      sekitar: 4,
    });
    // 10 × (0.3×0.8 + 0.2×0.8 + 0.2×0.75 + 0.15×0.734 + 0.15×0.8) = 7.80
    assert.equal(hasil.skor, 7.8);
  });

  it("kebersihan uses the mean of two when one cleanliness score is null", () => {
    const hasil = hitungSkorBahagia({ ...lengkap, skor_dapur: null });
    assert.equal(hasil.komponen.kebersihan, 4.5);
    assert.equal(hasil.skor, 8.1);
  });

  it("kebersihan with only one score is null and voids the total", () => {
    const hasil = hitungSkorBahagia({
      ...lengkap,
      skor_dapur: null,
      skor_koridor: null,
    });
    assert.equal(hasil.komponen.kebersihan, null);
    assert.equal(hasil.skor, null);
  });

  it("missing kedap voids the total even with full cleanliness", () => {
    const hasil = hitungSkorBahagia({ ...lengkap, skor_kedap: null });
    assert.equal(hasil.komponen.kebersihan, 4);
    assert.equal(hasil.skor, null);
  });

  it("missing sekitar drops its weight instead of guessing", () => {
    const hasil = hitungSkorBahagia({ ...lengkap, sekitar: null });
    assert.equal(hasil.komponen.sekitar, null);
    // 10 × (0.24 + 0.16 + 0.15 + 0.1101) / 0.85 = 7.77
    assert.equal(hasil.skor, 7.8);
  });

  it("sekitar averages whatever parts were measured", () => {
    const hasil = hitungSkorBahagia({
      ...lengkap,
      sekitar: { landmark_menit_jalan: null, penerangan: null, jumlah_amenitas: 1 },
    });
    assert.equal(hasil.komponen.sekitar, 2);
  });

  it("rounds the total to one decimal and components to two", () => {
    const hasil = hitungSkorBahagia({ ...lengkap, skor_koridor: 4 });
    assert.equal(hasil.komponen.kebersihan, 3.67);
    assert.equal(hasil.skor, 7.6);
  });
});

describe("skorTransparansi", () => {
  it("is 5 when all four disclosure checks pass", () => {
    assert.equal(skorTransparansi([kamarJelas], SEKARANG), 5);
  });
  it("is 0 when none pass, however small the extras are", () => {
    const kabur: KamarTransparansi = {
      ...kamarJelas,
      model_listrik: "token",
      estimasi_listrik: null,
      bayar_dimuka_bulan: null,
      ketentuan_deposit: null,
      harga_dikonfirmasi_pada: null,
    };
    assert.equal(skorTransparansi([kabur], SEKARANG), 0);
  });
  it("does not reward or punish a large share of extra fees by itself", () => {
    const mahal = { ...kamarJelas, biaya_lain: [{ nama: "Iuran", jumlah: 900_000 }] };
    assert.equal(skorTransparansi([mahal], SEKARANG), 5);
  });
  it("averages over room types", () => {
    const separuh = { ...kamarJelas, bayar_dimuka_bulan: null, harga_dikonfirmasi_pada: "2026-01-01T00:00:00Z" };
    assert.equal(skorTransparansi([kamarJelas, separuh], SEKARANG), 3.75);
  });
  it("is 0 without room types", () => {
    assert.equal(skorTransparansi([], SEKARANG), 0);
  });
});

describe("cekTransparansi", () => {
  it("no deposit needs no deposit terms", () => {
    assert.equal(cekTransparansi({ ...kamarJelas, deposit: 0, deposit_kembali: null, ketentuan_deposit: null }, SEKARANG).masuk, true);
  });
  it("a one-off fee without an amount fails the entry-cost check", () => {
    assert.equal(cekTransparansi({ ...kamarJelas, biaya_sekali: [{ nama: "Administrasi", jumlah: null }] }, SEKARANG).masuk, false);
  });
  it("an optional extra without an amount does not make the monthly total unclear", () => {
    assert.equal(cekTransparansi({ ...kamarJelas, biaya_lain: [{ nama: "Galon", jumlah: null, wajib: false }] }, SEKARANG).bulanan, true);
  });
  it("prices checked more than 90 days ago fail the recency check", () => {
    assert.equal(cekTransparansi({ ...kamarJelas, harga_dikonfirmasi_pada: "2026-07-01T00:00:00Z" }, SEKARANG).baru, false);
  });
});

describe("skorFasilitas", () => {
  it("is 3 when alone in the bucket", () => {
    assert.equal(skorFasilitas(4, []), 3);
  });
  it("is 5 above every peer and 1 below every peer", () => {
    assert.equal(skorFasilitas(9, [1, 2, 3]), 5);
    assert.equal(skorFasilitas(0, [1, 2, 3]), 1);
  });
  it("puts a middle rank at 3", () => {
    assert.equal(skorFasilitas(2, [1, 3]), 3);
  });
  it("splits ties at the midpoint", () => {
    assert.equal(skorFasilitas(3, [3, 3, 3]), 3);
  });
});

describe("skorJalanKaki", () => {
  it("maps minutes to 1–5 with null passthrough", () => {
    assert.equal(skorJalanKaki(null), null);
    assert.equal(skorJalanKaki(5), 5);
    assert.equal(skorJalanKaki(10), 4);
    assert.equal(skorJalanKaki(15), 3);
    assert.equal(skorJalanKaki(20), 2);
    assert.equal(skorJalanKaki(21), 1);
  });
});
