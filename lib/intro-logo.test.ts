import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hitungGerak, targetLayak } from "./intro-logo.ts";

describe("intro logo: target di header", () => {
  it("accepts a visible header mark and rejects hidden or off-screen ones", () => {
    assert.equal(targetLayak({ left: 16, top: 52, width: 32, height: 32 }, 390, 844), true);
    // display: none (phones on /cari and /kos): zero size
    assert.equal(targetLayak({ left: 0, top: 0, width: 0, height: 0 }, 390, 844), false);
    // scrolled away above the viewport
    assert.equal(targetLayak({ left: 16, top: -40, width: 32, height: 32 }, 390, 844), false);
    // wider than the screen
    assert.equal(targetLayak({ left: 380, top: 10, width: 32, height: 32 }, 390, 844), false);
    assert.equal(targetLayak(null, 390, 844), false);
  });

  it("moves the overlay mark centre to centre and scales it to the header mark", () => {
    // 96 px mark in the middle of a 390 × 844 phone → 32 px mark at (16, 70)
    const g = hitungGerak({ left: 147, top: 374, width: 96, height: 96 }, { left: 16, top: 70, width: 32, height: 32 });
    assert.deepEqual(g, { dx: -163, dy: -336, skala: 1 / 3 });
    // where the scaled mark lands
    const tengahX = 147 + 48 + g.dx;
    const tengahY = 374 + 48 + g.dy;
    assert.equal(tengahX, 32);
    assert.equal(tengahY, 86);
    assert.equal(96 * g.skala, 32);
  });
});
