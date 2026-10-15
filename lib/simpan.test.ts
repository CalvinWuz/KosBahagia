import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

// A tiny in-memory localStorage/window so the store runs under node:test.
// `rusak` makes it behave like a browser that refuses storage.
const isi = new Map<string, string>();
const rusak = { baca: false, tulis: false };
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => {
      if (rusak.baca) throw new Error("SecurityError");
      return isi.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (rusak.tulis) throw new Error("QuotaExceededError");
      isi.set(k, v);
    },
    removeItem: (k: string) => void isi.delete(k),
  },
  window: { addEventListener() {}, removeEventListener() {} },
});

const { bacaBanding, bacaSimpan, hapusBanding, tambahBanding, toggleSimpan, tersimpanPermanen } = await import("./simpan.ts");

beforeEach(() => {
  isi.clear();
  rusak.baca = false;
  rusak.tulis = false;
});

describe("simpanan dan banding di perangkat ini", () => {
  it("reads entries saved by older builds (bare ids, no room type)", () => {
    isi.set("kb:banding", JSON.stringify(["id-lama", { id: "id-2", slug: "kos-2", nama: "Kos 2" }]));
    isi.set("kb:simpan", JSON.stringify(["id-lama"]));
    assert.deepEqual(bacaBanding().map((b) => [b.id, b.kamarId]), [["id-lama", null], ["id-2", null]]);
    assert.equal(bacaSimpan()[0].kamarId, null);
  });

  it("keeps the room type of a compare candidate across a reload", () => {
    tambahBanding({ id: "k1", slug: "kost-anggrek-cakra", nama: "Kost Anggrek Cakra", kamarId: "ac", kamarNama: "AC + kamar mandi dalam" });
    const dariDisk = JSON.parse(isi.get("kb:banding") ?? "[]");
    assert.equal(dariDisk[0].kamarId, "ac");
    assert.equal(bacaBanding()[0].kamarNama, "AC + kamar mandi dalam");
  });

  it("two room types of one kos are separate candidates; max three", () => {
    assert.equal(tambahBanding({ id: "k1", slug: "a", nama: "A", kamarId: "std" }), true);
    assert.equal(tambahBanding({ id: "k1", slug: "a", nama: "A", kamarId: "ac" }), true);
    assert.equal(tambahBanding({ id: "k1", slug: "a", nama: "A", kamarId: "ac" }), true);
    assert.equal(bacaBanding().length, 2);
    tambahBanding({ id: "k2", slug: "b", nama: "B" });
    assert.equal(tambahBanding({ id: "k3", slug: "c", nama: "C" }), false);
    hapusBanding({ id: "k1", kamarId: "std" });
    assert.deepEqual(bacaBanding().map((b) => `${b.id}:${b.kamarId}`), ["k1:ac", "k2:null"]);
  });

  it("save and unsave persist (what survives a reload is what is on disk)", () => {
    toggleSimpan({ id: "k1", slug: "a", nama: "A", kamarId: "ac", total_bulanan: 2_195_000, kamar_tersedia: 0 });
    assert.equal(JSON.parse(isi.get("kb:simpan") ?? "[]")[0].kamarId, "ac");
    toggleSimpan({ id: "k1", slug: "a", nama: "A" });
    assert.deepEqual(JSON.parse(isi.get("kb:simpan") ?? "[]"), []);
  });
});

describe("browser yang menolak penyimpanan", () => {
  it("a refused write stays in this tab instead of being undone by the old list on disk", () => {
    assert.deepEqual(bacaSimpan(), []);
    rusak.tulis = true;
    toggleSimpan({ id: "k1", slug: "a", nama: "A" });
    // Re-reading must not bring back the (empty) disk copy.
    assert.deepEqual(bacaSimpan().map((s) => s.id), ["k1"]);
    assert.equal(tersimpanPermanen("simpan"), false);
    assert.equal(isi.has("kb:simpan"), false);

    // Once the browser accepts writes again, the whole list is stored.
    rusak.tulis = false;
    toggleSimpan({ id: "k2", slug: "b", nama: "B" });
    assert.equal(tersimpanPermanen("simpan"), true);
    assert.deepEqual(JSON.parse(isi.get("kb:simpan") ?? "[]").map((s: { id: string }) => s.id), ["k2", "k1"]);
  });

  it("storage that cannot even be read still gives a working list for this tab", () => {
    assert.deepEqual(bacaBanding(), []);
    rusak.baca = true;
    rusak.tulis = true;
    assert.deepEqual(bacaBanding(), []);
    assert.equal(tambahBanding({ id: "k1", slug: "a", nama: "A", kamarId: "ac" }), true);
    assert.equal(bacaBanding().length, 1);
    assert.equal(tersimpanPermanen("banding"), false);

    rusak.baca = false;
    rusak.tulis = false;
    tambahBanding({ id: "k2", slug: "b", nama: "B" });
    assert.equal(tersimpanPermanen("banding"), true);
    assert.deepEqual(JSON.parse(isi.get("kb:banding") ?? "[]").map((b: { id: string }) => b.id), ["k1", "k2"]);
  });
});
