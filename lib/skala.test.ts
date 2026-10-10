import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { artiKedap, chipKebersihan, chipKedap, kataKebersihan, kataKedap, kataSelisihDb, keteranganKebersihan, keteranganKedap, SKALA_KEBERSIHAN, SKALA_KEDAP } from "./skala.ts";

describe("kataKebersihan", () => {
  it("maps the rubric thresholds", () => {
    assert.equal(kataKebersihan(5), "Sangat bersih");
    assert.equal(kataKebersihan(4.5), "Sangat bersih");
    assert.equal(kataKebersihan(4.4), "Bersih");
    assert.equal(kataKebersihan(3), "Cukup");
    assert.equal(kataKebersihan(2.9), "Kurang");
    assert.equal(kataKebersihan(1), "Kurang");
  });
  it("never invents a word for missing data", () => {
    assert.equal(kataKebersihan(null), null);
    assert.equal(kataKebersihan(undefined), null);
    assert.equal(kataKebersihan(Number.NaN), null);
  });
});

describe("kataKedap", () => {
  it("maps 1–5 to three words", () => {
    assert.equal(kataKedap(4), "Kedap suara");
    assert.equal(kataKedap(3.5), "Cukup kedap");
    assert.equal(kataKedap(2), "Berisik");
  });
});

describe("card chips use the same words as the detail page", () => {
  it("kebersihan 5 is Sangat bersih everywhere, 4 is Bersih, below 4 no chip", () => {
    assert.equal(chipKebersihan(5), "Sangat bersih");
    assert.equal(chipKebersihan(4), "Bersih");
    assert.equal(chipKebersihan(3.9), null);
  });
  it("kedap: 4+ is a good chip, a measured low score says Berisik, the middle says nothing", () => {
    assert.deepEqual(chipKedap(4), { kata: "Kedap suara", baik: true });
    assert.deepEqual(chipKedap(1), { kata: "Berisik", baik: false });
    assert.equal(chipKedap(3), null);
    assert.equal(chipKedap(null), null);
  });
});

describe("kataSelisihDb", () => {
  it("bigger difference = more sound gets through", () => {
    assert.equal(kataSelisihDb(32), "Tembus jelas");
    assert.equal(kataSelisihDb(20), "Terdengar samar");
    assert.equal(kataSelisihDb(8), "Hampir tidak terdengar");
    assert.equal(kataSelisihDb(null), null);
  });
});

describe("artiKedap", () => {
  it("says what the number means, higher = holds back more sound", () => {
    assert.equal(artiKedap(5), "suara kamar sebelah nyaris tidak terdengar");
    assert.equal(artiKedap(4), "suara kamar sebelah nyaris tidak terdengar");
    assert.equal(artiKedap(3), "suara kamar sebelah terdengar samar");
    assert.equal(artiKedap(1), "obrolan kamar sebelah ikut terdengar");
    assert.equal(artiKedap(null), null);
  });
  it("agrees with the kedap word on every step", () => {
    for (const n of [1, 2, 2.5, 3, 3.5, 4, 4.5, 5]) {
      const kata = kataKedap(n);
      const arti = artiKedap(n) ?? "";
      if (kata === "Kedap suara") assert.match(arti, /nyaris tidak/);
      if (kata === "Cukup kedap") assert.match(arti, /samar/);
      if (kata === "Berisik") assert.match(arti, /ikut terdengar/);
    }
  });
});

describe("keterangan tingkat", () => {
  it("comes from the same step as the word, and never invents one for missing data", () => {
    for (const n of [1, 2.9, 3, 3.9, 4, 4.4, 4.5, 5]) {
      const kata = kataKebersihan(n);
      assert.equal(keteranganKebersihan(n), SKALA_KEBERSIHAN.find((t) => t.kata === kata)?.keterangan);
    }
    for (const n of [1, 2, 3, 4, 5]) {
      const kata = kataKedap(n);
      assert.equal(keteranganKedap(n), SKALA_KEDAP.find((t) => t.kata === kata)?.keterangan);
    }
    assert.equal(keteranganKebersihan(null), null);
    assert.equal(keteranganKedap(undefined), null);
  });
});
