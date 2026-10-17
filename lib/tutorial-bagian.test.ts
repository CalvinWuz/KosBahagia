import { beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

// In-memory localStorage and <html> so the module runs under node:test.
// `rusak` makes storage behave like a browser that refuses it.
const isi = new Map<string, string>();
const rusak = { baca: false, tulis: false };
const html = { dataset: {} as Record<string, string> };
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
  document: { documentElement: html },
});

const t = await import("./tutorial-bagian.ts");

beforeEach(() => {
  isi.clear();
  rusak.baca = false;
  rusak.tulis = false;
  html.dataset = {};
  t.lupakanStatus(t.KELOMPOK);
});

describe("preferensi tutorial", () => {
  it("reads only known groups and statuses; corrupt or foreign data is no data", () => {
    assert.deepEqual(t.bacaPreferensi('{"pencarian":"selesai","detail":"aneh","x":"ditutup"}'), { pencarian: "selesai" });
    assert.deepEqual(t.bacaPreferensi("{rusak"), {});
    assert.deepEqual(t.bacaPreferensi("[1,2]"), {});
    assert.deepEqual(t.bacaPreferensi(null), {});
  });

  it("a status only moves up: reopening or losing a target never undoes 'selesai'", () => {
    let p = t.naikkanStatus({}, "detail", "ditawarkan");
    p = t.naikkanStatus(p, "detail", "selesai");
    p = t.naikkanStatus(p, "detail", "ditutup");
    p = t.naikkanStatus(p, "detail", "ditawarkan");
    assert.equal(p.detail, "selesai");
  });

  it("offers once per group, and not to someone who closed the v1 guide (except on the owner surface)", () => {
    assert.equal(t.layakDitawarkan({}, "pencarian", false), true);
    assert.equal(t.layakDitawarkan({ pencarian: "ditawarkan" }, "pencarian", false), false);
    assert.equal(t.layakDitawarkan({}, "pencarian", true), false);
    assert.equal(t.layakDitawarkan({}, "mitra-ringkasan", true), true);
  });
});

describe("penyimpanan", () => {
  it("records statuses per group without touching other keys", () => {
    isi.set("kb:simpan", "[1]");
    t.catatStatus("simpanan", "ditawarkan");
    t.catatStatus("simpanan", "selesai");
    t.catatStatus("banding", "ditutup");
    assert.deepEqual(JSON.parse(isi.get(t.KUNCI_TUTORIAL) ?? "{}"), { simpanan: "selesai", banding: "ditutup" });
    assert.equal(isi.get("kb:simpan"), "[1]");
  });

  it("works from memory when storage refuses, without throwing", () => {
    rusak.baca = true;
    rusak.tulis = true;
    assert.deepEqual(t.preferensi(), {});
    t.catatStatus("detail", "ditutup");
    assert.equal(t.preferensi().detail, "ditutup");
    assert.equal(isi.has(t.KUNCI_TUTORIAL), false);
  });

  it("'Tawarkan lagi' forgets only the given groups and updates <html>", () => {
    t.catatStatus("pencarian", "selesai");
    t.catatStatus("mitra-ringkasan", "ditutup");
    t.tandaiDiHalaman("pencarian");
    t.tandaiDiHalaman("mitra-ringkasan");
    t.lupakanStatus(t.KELOMPOK_PENCARI);
    assert.deepEqual(t.preferensi(), { "mitra-ringkasan": "ditutup" });
    assert.equal(html.dataset.tutorial, "mitra-ringkasan");
  });
});

describe("skrip sebelum paint", () => {
  const jalankan = () => new Function(t.SKRIP_TUTORIAL)();

  it("lists the groups that have a status on <html data-tutorial>", () => {
    isi.set(t.KUNCI_TUTORIAL, JSON.stringify({ pencarian: "ditawarkan", detail: "selesai" }));
    jalankan();
    assert.equal(html.dataset.tutorial, "pencarian detail");
  });

  it("never throws on corrupt data or blocked storage", () => {
    isi.set(t.KUNCI_TUTORIAL, "{rusak");
    assert.doesNotThrow(jalankan);
    assert.equal(html.dataset.tutorial, undefined);
    rusak.baca = true;
    assert.doesNotThrow(jalankan);
    isi.set(t.KUNCI_TUTORIAL, JSON.stringify({ '"><x': "a", "ok-kelompok": 3 }));
    rusak.baca = false;
    jalankan();
    assert.equal(html.dataset.tutorial, undefined);
  });
});
