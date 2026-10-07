import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bacaCariParams, hrefCari, jumlahFilterAktif } from "../cari-params.ts";
import { daftarFilterAktif, ringkasanFilterAktif } from "./filter-aktif.ts";

const NAMA = { "kamar-mandi-dalam": "Kamar mandi dalam", ac: "AC" };

describe("daftarFilterAktif", () => {
  it("one chip per ticked type; removing one keeps the others", () => {
    const p = bacaCariParams(new URLSearchParams("area=palmerah&tipe=putra,campur"));
    const daftar = daftarFilterAktif(p, NAMA);
    assert.deepEqual(daftar.map((f) => f.label), ["Kos putra", "Kos campur"]);
    const putra = daftar.find((f) => f.id === "tipe-putra");
    assert.ok(putra);
    assert.equal(hrefCari(putra.hapus(p)), "/cari?area=palmerah&tipe=campur");
  });

  it("the chip count by group matches the Filter badge", () => {
    const p = bacaCariParams(new URLSearchParams("tipe=putri,campur&harga_min=1000000&harga_max=1500000&fasilitas=kamar-mandi-dalam,ac&kedap=4&tanpa_jam_malam=1"));
    const daftar = daftarFilterAktif(p, NAMA);
    assert.equal(new Set(daftar.map((f) => f.grup)).size, jumlahFilterAktif(p));
    assert.equal(jumlahFilterAktif(p), 6);
  });

  it("states what each chip means", () => {
    const label = (qs: string) => daftarFilterAktif(bacaCariParams(new URLSearchParams(qs)), NAMA).map((f) => f.label);
    assert.deepEqual(label("harga_max=1500000"), ["Total ≤ Rp1.500.000"]);
    assert.deepEqual(label("harga_min=1000000"), ["Total ≥ Rp1.000.000"]);
    assert.deepEqual(label("harga_min=1000000&harga_max=1500000"), ["Total Rp1.000.000–Rp1.500.000"]);
    assert.deepEqual(label("fasilitas=kamar-mandi-dalam,water-heater"), ["Kamar mandi dalam", "Water heater"]);
    assert.deepEqual(label("kebersihan=4.5&kedap=3"), ["Kebersihan 4,5+ (sangat bersih)", "Kedap suara 3+ (cukup kedap)"]);
    assert.deepEqual(label("kedap=4"), ["Kedap suara 4+"]);
    assert.deepEqual(label("dekat_minimarket=1&tanpa_jam_malam=1"), ["Tanpa jam malam", "Minimarket ≤ 300 m"]);
  });

  it("removing a facility chip removes only that facility", () => {
    const p = bacaCariParams(new URLSearchParams("fasilitas=ac,kamar-mandi-dalam"));
    const km = daftarFilterAktif(p, NAMA).find((f) => f.id === "fasilitas-kamar-mandi-dalam");
    assert.ok(km);
    assert.deepEqual(km.hapus(p).fasilitas, ["ac"]);
  });

  it("the summary names every type even though they count once", () => {
    const p = bacaCariParams(new URLSearchParams("tipe=putra,campur&harga_max=1500000"));
    assert.equal(ringkasanFilterAktif(daftarFilterAktif(p)), "2 filter aktif: Total ≤ Rp1.500.000, Kos putra, Kos campur.");
    assert.equal(ringkasanFilterAktif([]), "Tanpa filter.");
  });
});
