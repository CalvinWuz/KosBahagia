import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  bacaCariParams,
  bacaRupiah,
  hrefCari,
  jumlahFilterAktif,
  tampilRupiahInput,
  tanpaFilter,
  toggleTipe,
  validasiRentangHarga,
} from "./cari-params.ts";

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

describe("tipe kos, multi-pilih", () => {
  it("round-trips several types in a stable order", () => {
    const href = hrefCari({ area: "binus-kemanggisan", tipe: ["campur", "putra"] });
    assert.equal(href, "/cari?area=binus-kemanggisan&tipe=putra,campur");
    assert.deepEqual(bacaCariParams(new URLSearchParams(href.split("?")[1])).tipe, ["putra", "campur"]);
  });
  it("still reads the old single-type URL", () => {
    assert.deepEqual(bacaCariParams(new URLSearchParams("tipe=putra")).tipe, ["putra"]);
    assert.deepEqual(bacaCariParams({ tipe: "putri" }).tipe, ["putri"]);
  });
  it("reads %2C, repeated keys and Next.js array params alike", () => {
    assert.deepEqual(bacaCariParams(new URLSearchParams("tipe=putra%2Ccampur")).tipe, ["putra", "campur"]);
    assert.deepEqual(bacaCariParams(new URLSearchParams("tipe=campur&tipe=putra")).tipe, ["putra", "campur"]);
    assert.deepEqual(bacaCariParams({ tipe: ["campur", "putri"] }).tipe, ["putri", "campur"]);
  });
  it("drops duplicates and unknown values without an error", () => {
    assert.deepEqual(bacaCariParams(new URLSearchParams("tipe=campur,putra,campur,PUTRA")).tipe, ["putra", "campur"]);
    assert.deepEqual(bacaCariParams(new URLSearchParams("tipe=putra,asrama,")).tipe, ["putra"]);
    assert.equal(bacaCariParams(new URLSearchParams("tipe=asrama")).tipe, undefined);
    assert.equal(bacaCariParams(new URLSearchParams("tipe=")).tipe, undefined);
    assert.equal(hrefCari({ tipe: [] }), "/cari");
  });
  it("tapping an active type removes only that type", () => {
    const p = { area: "palmerah", tipe: ["putra", "campur"] as const };
    assert.deepEqual(toggleTipe({ ...p, tipe: [...p.tipe] }, "putra").tipe, ["campur"]);
    assert.deepEqual(toggleTipe({ area: "palmerah", tipe: ["campur"] }, "putri").tipe, ["putri", "campur"]);
    assert.deepEqual(toggleTipe({ tipe: ["campur"] }, "campur").tipe, []);
  });
  it("keeps location, radius, text, price, sort and view next to the types", () => {
    const awal = "q=melati&area=binus-kemanggisan&radius=2000&harga_max=1500000&tipe=putri,campur&urut=termurah&tampil=peta";
    const p = bacaCariParams(new URLSearchParams(awal));
    assert.equal(hrefCari(p), `/cari?${awal}`);
  });
  it("a filter change resets the page", () => {
    const p = bacaCariParams(new URLSearchParams("tipe=putra&hal=3"));
    assert.equal(p.hal, 3);
    assert.equal(hrefCari({ ...toggleTipe(p, "campur"), hal: 1 }), "/cari?tipe=putra,campur");
  });
});

describe("fasilitas", () => {
  it("each facility is written once", () => {
    const p = bacaCariParams(new URLSearchParams("fasilitas=ac,kamar-mandi-dalam,ac"));
    assert.deepEqual(p.fasilitas, ["ac", "kamar-mandi-dalam"]);
    assert.equal(hrefCari({ fasilitas: ["wifi", "wifi"] }), "/cari?fasilitas=wifi");
  });
});

describe("jumlahFilterAktif", () => {
  it("counts requirements, not values", () => {
    assert.equal(jumlahFilterAktif({}), 0);
    assert.equal(jumlahFilterAktif({ tipe: ["putra", "campur"] }), 1, "the type group is one requirement");
    assert.equal(jumlahFilterAktif({ harga_min: 1_000_000, harga_max: 1_500_000 }), 1, "a price range is one requirement");
    assert.equal(jumlahFilterAktif({ fasilitas: ["ac", "kamar-mandi-dalam"] }), 2, "every facility is its own requirement");
    assert.equal(jumlahFilterAktif({ tipe: ["putri"], harga_max: 1_500_000, fasilitas: ["kamar-mandi-dalam"], tanpa_jam_malam: true }), 4);
  });
  it("sort, view and place are not filters", () => {
    assert.equal(jumlahFilterAktif({ area: "palmerah", urut: "termurah", tampil: "peta", q: "melati", radius: 2000 }), 0);
  });
});

describe("tanpaFilter", () => {
  it("clears every filter and keeps where and how", () => {
    const p = bacaCariParams(new URLSearchParams("area=palmerah&radius=3000&urut=skor&tampil=peta&tipe=putra,campur&harga_max=1500000&fasilitas=ac&hewan=1"));
    assert.equal(hrefCari(tanpaFilter(p)), "/cari?area=palmerah&radius=3000&urut=skor&tampil=peta");
    assert.equal(jumlahFilterAktif(tanpaFilter(p)), 0);
  });
});
