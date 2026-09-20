import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { kataKebersihan, kataKedap, kataSelisihDb } from "./skala.ts";

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
    assert.equal(kataKedap(4), "Kedap");
    assert.equal(kataKedap(3.5), "Lumayan");
    assert.equal(kataKedap(2), "Berisik");
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
