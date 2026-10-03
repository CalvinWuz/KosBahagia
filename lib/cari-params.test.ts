import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bacaCariParams, bacaRupiah, hrefCari, tampilRupiahInput, validasiRentangHarga } from "./cari-params.ts";

describe("bacaRupiah", () => {
  it("reads what people type", () => {
    assert.deepEqual(bacaRupiah("1500000"), { nilai: 1_500_000 });
    assert.deepEqual(bacaRupiah("1.500.000"), { nilai: 1_500_000 });
    assert.deepEqual(bacaRupiah("Rp 1.500.000"), { nilai: 1_500_000 });
    assert.deepEqual(bacaRupiah("1,5 jt"), { nilai: 1_500_000 });
    assert.deepEqual(bacaRupiah("1.25jt"), { nilai: 1_250_000 });
    assert.deepEqual(bacaRupiah("850rb"), { nilai: 850_000 });
  });
  it("empty and zero mean no limit", () => {
    assert.deepEqual(bacaRupiah(""), {});
    assert.deepEqual(bacaRupiah("   "), {});
    assert.deepEqual(bacaRupiah("0"), {});
  });
  it("negative and non-numeric input are errors, not 'no limit'", () => {
    assert.ok(bacaRupiah("-500000").galat);
    assert.ok(bacaRupiah("satu juta").galat);
    assert.ok(bacaRupiah("1.50.0").galat);
  });
  it("caps absurd values", () => {
    assert.ok(bacaRupiah("900000000").galat);
  });
  it("formats an input value with separators", () => {
    assert.equal(tampilRupiahInput(2_000_000), "2.000.000");
    assert.equal(tampilRupiahInput(undefined), "");
  });
});

describe("validasiRentangHarga", () => {
  it("minimum above maximum is an input error on the minimum field", () => {
    const g = validasiRentangHarga(2_000_000, 1_500_000);
    assert.equal(g?.kolom, "harga_min");
    assert.match(g?.pesan ?? "", /Rp2\.000\.000/);
  });
  it("equal values and open ends are valid", () => {
    assert.equal(validasiRentangHarga(1_500_000, 1_500_000), null);
    assert.equal(validasiRentangHarga(undefined, 1_500_000), null);
    assert.equal(validasiRentangHarga(2_000_000, undefined), null);
  });
  it("an invalid range survives the URL so the page can explain it", () => {
    const p = bacaCariParams(new URLSearchParams("harga_min=2000000&harga_max=1500000"));
    assert.equal(p.harga_min, 2_000_000);
    assert.equal(p.harga_max, 1_500_000);
    assert.ok(validasiRentangHarga(p.harga_min, p.harga_max));
    assert.equal(hrefCari(p), "/cari?harga_min=2000000&harga_max=1500000");
  });
});
