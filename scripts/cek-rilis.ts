// Launch gate. Fails (exit 1) while the database still looks like a seed:
// placeholder photos, too few live listings, or a live kos without a named
// surveyor. Run against the production database before announcing:
//
//   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… npm run cek:rilis

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types.ts";

const MIN_KOS_RILIS = 30;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi.");
  process.exit(2);
}
const db = createClient<Database>(url, key);

const masalah: string[] = [];
const { data: kos, error } = await db.from("kos").select("slug, surveyor, disurvei_pada, tier").eq("status", "tayang");
if (error) {
  console.error("Gagal membaca kos:", error.message);
  process.exit(2);
}
const tayang = kos ?? [];
if (tayang.length < MIN_KOS_RILIS) masalah.push(`Baru ${tayang.length} kos tayang; minimal ${MIN_KOS_RILIS} sebelum diumumkan.`);
const tanpaSurveyor = tayang.filter((k) => !k.surveyor || !k.disurvei_pada);
if (tanpaSurveyor.length) masalah.push(`${tanpaSurveyor.length} kos tayang tanpa nama surveyor/tanggal survei: ${tanpaSurveyor.slice(0, 5).map((k) => k.slug).join(", ")}`);

const { data: media } = await db.from("kos_media").select("url").limit(2000);
const placeholder = (media ?? []).filter((m) => /picsum\.photos|placeholder|example\.com|^\/dummy\//i.test(m.url));
if (placeholder.length) masalah.push(`${placeholder.length} foto masih placeholder (picsum/dummy).`);

const { data: area } = await db.from("area").select("slug, deskripsi");
const tanpaDeskripsi = (area ?? []).filter((a) => !a.deskripsi || a.deskripsi.length < 80);
if (tanpaDeskripsi.length) masalah.push(`Area tanpa deskripsi tulisan tangan yang layak: ${tanpaDeskripsi.map((a) => a.slug).join(", ")}`);

if (masalah.length) {
  console.error("BELUM SIAP RILIS:");
  for (const m of masalah) console.error(" -", m);
  process.exit(1);
}
console.log(`Siap rilis: ${tayang.length} kos tayang, semua bersurveyor, tidak ada foto placeholder.`);
