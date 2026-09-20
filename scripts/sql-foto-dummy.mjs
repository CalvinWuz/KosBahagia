// Emits UPDATE statements that point an already-seeded database (the cloud
// project) at the dummy photo library, without re-running the whole seed.
// Media ids in 01_seed.sql are deterministic, so the regenerated seed and
// the live rows share ids.
//
//   node supabase/seed/generate.ts            # with public/dummy/manifest.json present
//   node scripts/sql-foto-dummy.mjs > /tmp/foto-dummy.sql
//   npx supabase db query --linked -f /tmp/foto-dummy.sql

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sql = readFileSync(join(ROOT, "supabase", "seed", "01_seed.sql"), "utf8");
const blok = sql.match(/insert into kos_media \(id, kos_id, jenis, url, keterangan, urutan, lebar, tinggi, blurhash, tur\) values\n([\s\S]*?);\n/);
if (!blok) throw new Error("blok kos_media tidak ditemukan");

const baris = blok[1].split(",\n");
const out = ["begin;"];
let n = 0;
for (const b of baris) {
  // ('id', 'kos_id', 'jenis', 'url', 'keterangan', urutan, lebar, tinggi, 'blurhash', tur)
  const m = b.match(/^\s*\('([^']+)', '[^']+', '([^']+)', '([^']+)', (?:'(?:[^']|'')*'|null), \d+, (\d+), (\d+), '([^']+)', (null|'[\s\S]*'(?:::jsonb)?)\)$/);
  if (!m) throw new Error(`baris tidak terbaca: ${b.slice(0, 120)}`);
  const [, id, , url, lebar, tinggi, blurhash, tur] = m;
  if (!url.startsWith("/dummy/")) continue;
  out.push(`update kos_media set url = '${url}', lebar = ${lebar}, tinggi = ${tinggi}, blurhash = '${blurhash}', tur = ${tur} where id = '${id}';`);
  n++;
}
out.push("commit;");
process.stdout.write(out.join("\n") + "\n");
process.stderr.write(`${n} baris kos_media diarahkan ke /dummy\n`);
