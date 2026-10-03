import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRupiah, formatRupiahRingkas, formatTanggal } from "./format.ts";

/** Reads a short or full rupiah string back to a number. */
function baca(s: string): number {
  const jt = /^Rp([\d,]+) jt$/.exec(s);
  if (jt) return Math.round(Number(jt[1].replace(",", ".")) * 1_000_000);
  const rb = /^Rp([\d.]+) rb$/.exec(s);
  if (rb) return Number(rb[1].replace(/\./g, "")) * 1_000;
  return Number(s.replace(/^Rp/, "").replace(/\./g, ""));
}

describe("formatRupiahRingkas", () => {
  it("keeps enough precision: 1.250.000 is Rp1,25 jt, not Rp1,3 jt", () => {
    assert.equal(formatRupiahRingkas(1_250_000), "Rp1,25 jt");
    assert.equal(formatRupiahRingkas(1_200_000), "Rp1,2 jt");
    assert.equal(formatRupiahRingkas(2_000_000), "Rp2 jt");
    assert.equal(formatRupiahRingkas(850_000), "Rp850 rb");
  });

  it("writes amounts the short form cannot state exactly in full", () => {
    assert.equal(formatRupiahRingkas(1_255_000), "Rp1.255.000");
    assert.equal(formatRupiahRingkas(865_500), "Rp865.500");
  });

  it("never changes the amount, so a short rent can never exceed its total", () => {
    for (let sewa = 500_000; sewa <= 3_000_000; sewa += 5_000) {
      const total = sewa + 15_000;
      const ringkas = formatRupiahRingkas(sewa);
      assert.equal(baca(ringkas), sewa, ringkas);
      assert.ok(baca(ringkas) <= baca(formatRupiah(total)));
    }
  });
});

describe("formatTanggal", () => {
  it("writes an Indonesian long date and tolerates missing values", () => {
    assert.equal(formatTanggal("2026-09-21T03:00:00Z"), "21 September 2026");
    assert.equal(formatTanggal(null), "");
    assert.equal(formatTanggal("bukan tanggal"), "");
  });
});
