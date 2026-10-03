import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { kamarAcuan, kamarDariUrl, statusKamar } from "./kamar.ts";

const SEKARANG = new Date("2026-10-03T00:00:00Z");
const hariLalu = (n: number) => new Date(SEKARANG.getTime() - n * 86_400_000).toISOString();

describe("statusKamar", () => {
  it("a free room confirmed recently is Tersedia", () => {
    const s = statusKamar({ kamar_tersedia: 4, total_kamar: 5 }, hariLalu(3), SEKARANG);
    assert.equal(s.status, "tersedia");
    assert.equal(s.rincian, "4 dari 5 kamar kosong");
  });
  it("no free room confirmed recently is Penuh", () => {
    assert.equal(statusKamar({ kamar_tersedia: 0, total_kamar: 6 }, hariLalu(3), SEKARANG).status, "penuh");
  });
  it("an old confirmation is Belum dikonfirmasi, whatever the stored number says", () => {
    const s = statusKamar({ kamar_tersedia: 2, total_kamar: 5 }, hariLalu(41), SEKARANG);
    assert.equal(s.status, "belum_dikonfirmasi");
    assert.equal(s.label, "Belum dikonfirmasi");
    assert.equal(s.rincian, "Terakhir tercatat 2 kamar kosong");
  });
  it("never confirmed is Belum dikonfirmasi", () => {
    assert.equal(statusKamar({ kamar_tersedia: 3, total_kamar: 3 }, null, SEKARANG).status, "belum_dikonfirmasi");
  });
  it("states the confirmation date", () => {
    assert.match(statusKamar({ kamar_tersedia: 1, total_kamar: 2 }, "2026-09-30T05:00:00Z", SEKARANG).waktu, /30 September 2026/);
  });
});

describe("kamarAcuan", () => {
  const standar = { id: "a", kamar_tersedia: 4, total_bulanan: 1_645_000, harga_bulanan: 1_450_000, total_lengkap: true };
  const ac = { id: "b", kamar_tersedia: 0, total_bulanan: 2_195_000, harga_bulanan: 1_900_000, total_lengkap: true };

  it("prefers the cheapest room that still has space", () => {
    const murahPenuh = { ...standar, id: "c", kamar_tersedia: 0, total_bulanan: 1_200_000 };
    assert.equal(kamarAcuan([ac, murahPenuh, standar])?.id, "a");
  });
  it("falls back to the cheapest room when every room is full", () => {
    assert.equal(kamarAcuan([ac, { ...standar, kamar_tersedia: 0 }])?.id, "a");
  });
  it("prefers a complete total over a cheaper-looking incomplete one", () => {
    const takLengkap = { ...standar, id: "d", total_bulanan: 1_000_000, total_lengkap: false };
    assert.equal(kamarAcuan([takLengkap, standar])?.id, "a");
  });
  it("is null without rooms", () => {
    assert.equal(kamarAcuan([]), null);
  });
});

describe("kamarDariUrl", () => {
  it("only accepts a room type of this kos", () => {
    const daftar = [{ id: "a" }, { id: "b" }];
    assert.equal(kamarDariUrl(daftar, "b")?.id, "b");
    assert.equal(kamarDariUrl(daftar, "z"), null);
    assert.equal(kamarDariUrl(daftar, null), null);
  });
});
