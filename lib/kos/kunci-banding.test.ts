import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MAKS_TAUTAN_SIMPANAN, bacaKunciBanding, bacaKunciKos, hrefBanding, tulisKunciBanding, tulisKunciKos } from "./kunci-banding.ts";

const AC = "9fc119f1-e95d-4f52-a43a-866a24f2be59";
const STD = "cbc1c5cc-20b6-4bb0-a585-628dd38ae5c8";

describe("kunci banding", () => {
  it("keeps the room type through a round trip (reload, shared link)", () => {
    const k = bacaKunciBanding(`kost-anggrek-cakra:${AC},kos-putri-melati`);
    assert.deepEqual(k, [
      { kos: "kost-anggrek-cakra", kamar: AC },
      { kos: "kos-putri-melati", kamar: null },
    ]);
    assert.equal(tulisKunciBanding(k), `kost-anggrek-cakra:${AC},kos-putri-melati`);
    assert.equal(hrefBanding(k), `/banding?kos=kost-anggrek-cakra:${AC},kos-putri-melati`);
  });
  it("reads links from before room types existed", () => {
    assert.deepEqual(bacaKunciBanding("a,b"), [{ kos: "a", kamar: null }, { kos: "b", kamar: null }]);
  });
  it("two room types of one kos are two candidates; exact duplicates collapse", () => {
    const k = bacaKunciBanding(`x:${AC},x:${STD},x:${AC}`);
    assert.equal(k.length, 2);
  });
  it("keeps at most three and drops malformed entries", () => {
    assert.equal(bacaKunciBanding("a,b,c,d").length, 3);
    assert.deepEqual(bacaKunciBanding("<script>,a:bukan-uuid,b"), [{ kos: "a", kamar: null }, { kos: "b", kamar: null }]);
  });
});

describe("tautan bagikan simpanan", () => {
  it("carries the saved room type, and old slug-only links still read", () => {
    const tautan = tulisKunciKos([
      { kos: "griya-kemanggisan", kamar: AC },
      { kos: "kos-putri-melati", kamar: null },
    ]);
    assert.equal(tautan, `griya-kemanggisan:${AC},kos-putri-melati`);
    assert.deepEqual(bacaKunciKos(tautan, MAKS_TAUTAN_SIMPANAN), [
      { kos: "griya-kemanggisan", kamar: AC },
      { kos: "kos-putri-melati", kamar: null },
    ]);
    assert.deepEqual(bacaKunciKos("griya-kemanggisan,kos-putri-melati", MAKS_TAUTAN_SIMPANAN).map((k) => k.kamar), [null, null]);
  });
  it("is not cut to three like the compare list, but has its own limit", () => {
    const banyak = Array.from({ length: 25 }, (_, i) => `kos-${i}`).join(",");
    assert.equal(bacaKunciKos(banyak, MAKS_TAUTAN_SIMPANAN).length, MAKS_TAUTAN_SIMPANAN);
    assert.equal(bacaKunciKos("a,b,c,d", MAKS_TAUTAN_SIMPANAN).length, 4);
  });
});
