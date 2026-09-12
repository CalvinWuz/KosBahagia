// Compares the Postgres view `kos_skor` with lib/scoring.ts on every live
// seeded kos. Run with the local Supabase stack up:
//
//   npm run cek:skor-db
//
// Exits non-zero on the first mismatch. This is the guard against the two
// implementations drifting apart.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { hitungSkorBahagia, type SkorInput } from "../lib/scoring.ts";

const projectId = /^project_id\s*=\s*"([^"]+)"/m.exec(readFileSync("supabase/config.toml", "utf8"))?.[1];
if (!projectId) throw new Error("project_id tidak ditemukan di supabase/config.toml");

const sql = `
with termurah as (
  select distinct on (kos_id) kos_id, harga_bulanan, total_bulanan
  from tipe_kamar order by kos_id, total_bulanan, harga_bulanan
),
fas as (
  select kf.kos_id, count(*)::int as n
  from kos_fasilitas kf join fasilitas f on f.id = kf.fasilitas_id
  where f.bisa_difilter group by kf.kos_id
),
dasar as (
  select k.id as kos_id, t.harga_bulanan, t.total_bulanan,
         coalesce(fs.n, 0) as n_fasilitas, t.total_bulanan / 250000 as ember
  from kos k join termurah t on t.kos_id = k.id
  left join fas fs on fs.kos_id = k.id
  where k.status = 'tayang'
)
select json_agg(json_build_object(
  'slug', k.slug,
  'input', json_build_object(
    'skor_kamar_mandi', p.skor_kamar_mandi, 'skor_dapur', p.skor_dapur,
    'skor_koridor', p.skor_koridor, 'skor_kedap', p.skor_kedap,
    'harga_bulanan', d.harga_bulanan, 'total_bulanan', d.total_bulanan,
    'jumlah_fasilitas', d.n_fasilitas,
    'fasilitas_sebaya', (select coalesce(json_agg(d2.n_fasilitas), '[]'::json)
                         from dasar d2 where d2.ember = d.ember and d2.kos_id <> d.kos_id),
    'sekitar', case when s.kos_id is null then null else json_build_object(
      'landmark_menit_jalan', s.landmark_menit_jalan, 'penerangan', s.penerangan,
      'jumlah_amenitas', (s.minimarket is not null)::int + (s.warung is not null)::int
                       + (s.laundry is not null)::int + (s.transit is not null)::int) end),
  'db', (select row_to_json(v) from kos_skor v where v.kos_id = d.kos_id)
) order by k.slug)
from dasar d
join kos k on k.id = d.kos_id
left join kos_penilaian p on p.kos_id = d.kos_id
left join kos_sekitar s on s.kos_id = d.kos_id;`;

type Baris = {
  slug: string;
  input: SkorInput;
  db: { skor: string | null; kebersihan: string | null; kedap: string | null; transparansi: string; fasilitas: string; sekitar: string | null };
};

const raw = execFileSync("docker", ["exec", "-i", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-d", "postgres", "-At", "-c", sql], { encoding: "utf8" });
const baris: Baris[] = JSON.parse(raw.trim());

const angka = (x: string | null) => (x === null ? null : Number(x));
let beda = 0;
for (const r of baris) {
  const ts = hitungSkorBahagia(r.input);
  const pasangan: Array<[string, number | null, number | null]> = [
    ["skor", ts.skor, angka(r.db.skor)],
    ["kebersihan", ts.komponen.kebersihan, angka(r.db.kebersihan)],
    ["kedap", ts.komponen.kedap, angka(r.db.kedap)],
    ["transparansi", ts.komponen.transparansi, angka(r.db.transparansi)],
    ["fasilitas", ts.komponen.fasilitas, angka(r.db.fasilitas)],
    ["sekitar", ts.komponen.sekitar, angka(r.db.sekitar)],
  ];
  for (const [nama, a, b] of pasangan) {
    const sama = a === b || (a !== null && b !== null && Math.abs(a - b) < 0.011);
    if (!sama) {
      beda++;
      console.log(`✖ ${r.slug} · ${nama}: ts=${a} db=${b}`);
    }
  }
}
const dinilai = baris.filter((r) => r.db.skor !== null).length;
console.log(`${baris.length} kos tayang dibandingkan · ${dinilai} punya skor · ${baris.length - dinilai} "Belum dinilai" · ${beda} beda`);
process.exit(beda ? 1 : 0);
