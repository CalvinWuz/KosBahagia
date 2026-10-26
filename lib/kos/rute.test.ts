import { test } from "node:test";
import assert from "node:assert/strict";
import { bacaRute } from "./rute.ts";

const jalur = {
  titik: [[106.78248, -6.20163], [106.782559, -6.200923], [106.785007, -6.200691], [106.78556, -6.201971]],
  jarak_m: 600,
  menit: { jalan_kaki: 7, motor: 3, mobil: 4, sepeda: "x" },
  jalan: [{ nama: "Jl. KH Syahdan", dari: 1, ke: 2 }, { nama: "Rusak", dari: 2, ke: 9 }],
};

test("bacaRute: keeps the street route, its times and its street names", () => {
  const r = bacaRute({ landmark: { nama: "BINUS", ikon: "kampus" }, langkah: [{ teks: "Belok kanan", ikon: "belok-kanan", titik: 1 }, { teks: "Sampai", ikon: "tujuan", titik: 3 }], jalur });
  assert.ok(r?.jalur);
  assert.equal(r.jalur.titik.length, 4);
  assert.equal(r.jalur.jarak_m, 600);
  assert.deepEqual(r.jalur.menit, { jalan_kaki: 7, motor: 3, mobil: 4 });
  assert.deepEqual(r.jalur.jalan, [{ nama: "Jl. KH Syahdan", dari: 1, ke: 2 }]);
  assert.deepEqual(r.langkah.map((l) => l.titik), [1, 3]);
});

test("bacaRute: without a usable street route the steps lose their points, not their text", () => {
  const r = bacaRute({ langkah: [{ teks: "Belok kanan", ikon: "belok-kanan", titik: 1 }], jalur: { titik: [[1, 2]] } });
  assert.equal(r?.jalur, undefined);
  assert.deepEqual(r?.langkah, [{ teks: "Belok kanan", ikon: "belok-kanan" }]);
});

test("bacaRute: a step pointing past the route keeps its text", () => {
  const r = bacaRute({ langkah: [{ teks: "Sampai", ikon: "tujuan", titik: 12, foto_id: "f1" }], jalur });
  assert.deepEqual(r?.langkah, [{ teks: "Sampai", ikon: "tujuan", foto_id: "f1" }]);
});
