// MapLibre GL ≥ 6 ships its worker as a separate ES module that must be
// served from the same origin (a bundler cannot resolve it from
// import.meta.url). Copy the worker + its shared chunk into public/ so
// PetaHasil can point setWorkerUrl() at them. Runs before dev and build.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = dirname(require.resolve("maplibre-gl/package.json")) + "/dist";
const tujuan = join(process.cwd(), "public", "maplibre");
mkdirSync(tujuan, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, f), join(tujuan, f));
}
console.log(`maplibre worker → ${tujuan}`);
