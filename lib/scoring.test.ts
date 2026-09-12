import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  hitungSkorBahagia,
  skorFasilitas,
  skorJalanKaki,
  skorTransparansi,
  type SkorInput,
} from "./scoring.ts";

const lengkap: SkorInput = {
  skor_kamar_mandi: 4,
  skor_dapur: 3,
  skor_koridor: 5,
  skor_kedap: 4,
  harga_bulanan: 1_200_000,
  total_bulanan: 1_550_000,
  jumlah_fasilitas: 6,
  fasilitas_sebaya: [2, 4, 6, 8],
  sekitar: { landmark_menit_jalan: 7, penerangan: 4, jumlah_amenitas: 3 },
};

describe("hitungSkorBahagia", () => {
  it("all-max input scores 10.0 with every component at 5", () => {
    const hasil = hitungSkorBahagia({
      skor_kamar_mandi: 5,
      skor_dapur: 5,
      skor_koridor: 5,
      skor_kedap: 5,
      harga_bulanan: 1_000_000,
      total_bulanan: 1_000_000,
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
      harga_bulanan: 900_000,
      total_bulanan: 1_000_000,
      jumlah_fasilitas: 0,
      fasilitas_sebaya: [],
      sekitar: null,
    });
    assert.equal(hasil.skor, null);
    assert.equal(hasil.komponen.kebersihan, null);
    assert.equal(hasil.komponen.kedap, null);
    assert.equal(hasil.komponen.sekitar, null);
    // Components that only need price data are still reported.
    assert.equal(hasil.komponen.transparansi, 3.57);
    assert.equal(hasil.komponen.fasilitas, 3);
  });

  it("computes the documented example", () => {
    const hasil = hitungSkorBahagia(lengkap);
    // kebersihan 4, kedap 4, transparansi 5(1 − (0.2258/0.35)) = 1.77,
    // fasilitas: 2 peers below, 1 tie → (2 + 0.5)/4 = 0.625 → 3.5,
    // sekitar: mean(4, 4, 4) = 4
    assert.deepEqual(hasil.komponen, {
      kebersihan: 4,
      kedap: 4,
      transparansi: 1.77,
      fasilitas: 3.5,
      sekitar: 4,
    });
    // 10 × (0.3×0.8 + 0.2×0.8 + 0.2×0.354 + 0.15×0.7 + 0.15×0.8) = 6.96
    assert.equal(hasil.skor, 7);
  });

  it("kebersihan uses the mean of two when one cleanliness score is null", () => {
    const hasil = hitungSkorBahagia({ ...lengkap, skor_dapur: null });
    assert.equal(hasil.komponen.kebersihan, 4.5);
    assert.equal(hasil.skor, 7.3);
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
    // 10 × (0.24 + 0.16 + 0.0708 + 0.105) / 0.85 = 6.77
    assert.equal(hasil.skor, 6.8);
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
    assert.equal(hasil.skor, 6.8);
  });
});

describe("skorTransparansi", () => {
  it("is 5 when nothing is hidden and 0 at 35 % or more", () => {
    assert.equal(skorTransparansi(1_000_000, 1_000_000), 5);
    assert.equal(skorTransparansi(650_000, 1_000_000), 0);
    assert.equal(skorTransparansi(500_000, 1_000_000), 0);
  });
  it("is linear in between", () => {
    assert.equal(skorTransparansi(825_000, 1_000_000), 2.5);
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
