// Generates the dummy photo library for the seed with Gemini ("Nano Banana"),
// resizes to the sizes the app serves, and writes public/dummy/manifest.json
// (file, size, blurhash) that supabase/seed/generate.ts reads.
//
//   GEMINI_API_KEY=... node scripts/foto-dummy.mjs            # generate what is missing
//   node scripts/foto-dummy.mjs --manifest                      # only rebuild the manifest
//   node scripts/foto-dummy.mjs --only kamar,koridor            # a subset of categories
//
// The key is read from the environment or ~/.claude/skills/.env. Files that
// already exist are skipped, so the script can be re-run after a rate limit.
// These are placeholders: cek:rilis still blocks a release while /dummy/ is
// in use.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KELUAR = join(ROOT, "public", "dummy");
const MODEL = process.env.FOTO_DUMMY_MODEL ?? "gemini-2.5-flash-image";
const JEDA_MS = Number(process.env.FOTO_DUMMY_JEDA_MS ?? 7000);

const DASAR =
  "Photograph taken on a mid-range smartphone, natural daylight, realistic and slightly imperfect, " +
  "of an Indonesian kos-kosan (rented room boarding house) in a dense Jakarta neighbourhood. " +
  "No people, no text, no signage with words, no logos, no watermark.";

/** kategori → variants. Names are stable: the seed picks by index. */
const KATEGORI = {
  "tampak-depan": [
    "two-storey kos building seen from a narrow alley, white walls, orange clay tile roof, black iron gate, motorbikes parked in front",
    "kos building front with a green gate, small front yard with potted plants, ceramic tile terrace",
    "three-storey modern minimalist kos, grey and white facade, brown wooden gate, shoe rack by the door",
    "older kos house with a white fence, veranda with plastic chairs, bougainvillea over the wall",
    "kos exclusive building with a small lobby and a lift door visible, glass front, tidy",
    "kos entrance in a gang (narrow alley), house number plate without letters, laundry line visible upstairs",
  ],
  kamar: [
    "small 3x3 m kos room, single bed with plain sheets, ceiling fan, wooden wardrobe, window with curtain, ceramic floor",
    "kos room with a wall-mounted air conditioner, spring bed, small study desk and chair, white walls, a window",
    "tidy kos room for female tenants, pastel bedsheet, wardrobe, mirror, folded prayer mat on a shelf",
    "simple kos room, mattress on a bed frame, plastic wardrobe, fan on a stand, tiled floor, window to the corridor",
    "kos room with AC and private bathroom door visible, desk lamp, mini fridge, neutral colours",
    "kos room with a bunk-free single bed, wooden desk, bookshelf, window with morning light",
    "corner kos room, two windows, ceiling fan, wardrobe, bed with a blue blanket, ceramic floor",
    "premium kos room, queen bed, AC, TV bracket, wardrobe, curtains, warm light, very clean",
  ],
  "kamar-mandi": [
    "private kos bathroom, white ceramic tiles, squat-free sitting toilet, shower head, small mirror, bucket and dipper",
    "shared kos bathroom in a corridor, ceramic tiles, plastic bucket and dipper, shower, tidy",
    "modern kos bathroom, grey tiles, water heater shower, glass partition, small sink",
    "simple kos bathroom with a squat toilet, blue tiles, bucket, clean",
  ],
  koridor: [
    "kos corridor with numbered room doors, ceramic floor, shoe racks outside each door, daylight from the end",
    "upstairs kos corridor with a railing, potted plants, drying rack, doors on one side",
    "narrow kos corridor, wooden doors, fluorescent light, ceramic tile floor, clean",
    "kos corridor in a modern building, grey doors with numbers, bright, CCTV camera in the corner",
  ],
  dapur: [
    "shared kos kitchen, two-burner gas stove, rice cooker, dish rack, ceramic wall tiles, window",
    "small communal kitchen in a kos, kitchen counter with a dispenser and microwave, tidy",
    "outdoor-ish shared kitchen under a roof, gas stove, sink, plastic cabinets, cooking utensils on hooks",
  ],
  parkir: [
    "kos motorbike parking area under a canopy, six motorbikes parked neatly, concrete floor",
    "kos front yard used for motorbike parking, tiled floor, gate, one bicycle",
    "covered parking area of a kos with space for one car and motorbikes, CCTV camera",
  ],
  "ruang-tamu": [
    "kos guest room (ruang tamu) with a simple sofa, low table, tiled floor, wall clock, window",
    "small living area in a kos with plastic chairs and a table, television, plants",
    "kos common area with a wooden bench, shoe rack, bulletin board without readable text",
  ],
  jemuran: [
    "kos rooftop laundry drying area, clothes lines with hangers, blue sky, water tank",
    "kos backyard drying area with a metal drying rack, washing machine under a roof",
  ],
  "patokan-gang": [
    "entrance of a narrow residential alley (gang) in Jakarta, small warung with a blue awning, parked motorbikes",
    "alley entrance beside a small mosque with a green dome, morning light",
    "corner of a residential street with a large banyan tree and an ojek (motorbike taxi) waiting spot",
  ],
  "patokan-minimarket": [
    "small neighbourhood minimarket storefront, glass doors, generic red and white awning without any text, motorbikes in front",
    "minimarket at the corner of a street, bright signage area left blank, evening light",
  ],
  "360-kamar": [
    "equirectangular 360-degree panorama of a small kos room: bed, wardrobe, desk, window, door, ceiling fan, ceramic floor; seamless left-right edge",
    "equirectangular 360-degree panorama of a kos room with AC, spring bed, desk, wardrobe, curtain; seamless left-right edge",
  ],
  "360-koridor": ["equirectangular 360-degree panorama of a kos corridor with numbered doors, ceramic floor, shoe racks; seamless left-right edge"],
  "360-dapur": ["equirectangular 360-degree panorama of a shared kos kitchen: gas stove, sink, dish rack, dispenser, window; seamless left-right edge"],
};

const PANORAMA = (k) => k.startsWith("360-");

function bacaKunci() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  // Last real-looking value wins, so a leftover placeholder line is harmless.
  let kunci = null;
  for (const f of [join(homedir(), ".claude", "skills", ".env"), join(homedir(), ".claude", ".env")]) {
    if (!existsSync(f)) continue;
    for (const baris of readFileSync(f, "utf8").split("\n")) {
      const m = baris.match(/^\s*GEMINI_API_KEY\s*=\s*"?([^"\s]+)"?/);
      if (m && !/KUNCI|your|xxx/i.test(m[1])) kunci = m[1];
    }
  }
  return kunci;
}

async function minta(kunci, prompt, rasio) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: rasio } },
  };
  for (let coba = 0; coba < 4; coba++) {
    const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": kunci, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.status === 429 || res.status >= 500) {
      const tunggu = 20_000 * (coba + 1);
      console.log(`  ${res.status}, tunggu ${tunggu / 1000}s…`);
      await new Promise((r) => setTimeout(r, tunggu));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
    if (!part) throw new Error(`tidak ada gambar: ${JSON.stringify(json).slice(0, 300)}`);
    return Buffer.from(part.inlineData.data, "base64");
  }
  throw new Error("menyerah setelah 4 percobaan");
}

// ---- BlurHash encoder (https://blurha.sh, MIT), enough for 4x3 components.
const ABJAD = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~";
const enc83 = (n, len) => {
  let s = "";
  for (let i = 1; i <= len; i++) s += ABJAD[Math.floor(n / 83 ** (len - i)) % 83];
  return s;
};
const keLinear = (v) => {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
};
const keSRGB = (v) => {
  const x = Math.max(0, Math.min(1, v));
  return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055) * 255);
};
const tanda = (v, e) => (v < 0 ? -1 : 1) * Math.abs(v) ** e;
function blurhash(pixels, w, h, cx = 4, cy = 3) {
  const faktor = [];
  for (let y = 0; y < cy; y++)
    for (let x = 0; x < cx; x++) {
      const norm = x === 0 && y === 0 ? 1 : 2;
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const basis = norm * Math.cos((Math.PI * x * i) / w) * Math.cos((Math.PI * y * j) / h);
          const o = 3 * (j * w + i);
          r += basis * keLinear(pixels[o]);
          g += basis * keLinear(pixels[o + 1]);
          b += basis * keLinear(pixels[o + 2]);
        }
      const n = w * h;
      faktor.push([r / n, g / n, b / n]);
    }
  const dc = faktor[0];
  const ac = faktor.slice(1);
  let hash = enc83((cx - 1) + (cy - 1) * 9, 1);
  const maks = ac.length ? Math.max(...ac.flat().map(Math.abs)) : 1;
  const kuant = Math.max(0, Math.min(82, Math.floor(maks * 166 - 0.5)));
  const maksNyata = (kuant + 1) / 166;
  hash += enc83(kuant, 1);
  hash += enc83((keSRGB(dc[0]) << 16) + (keSRGB(dc[1]) << 8) + keSRGB(dc[2]), 4);
  for (const [r, g, b] of ac) {
    const q = (v) => Math.max(0, Math.min(18, Math.floor(tanda(v / maksNyata, 0.5) * 9 + 9.5)));
    hash += enc83(q(r) * 19 * 19 + q(g) * 19 + q(b), 2);
  }
  return hash;
}

async function simpan(buf, nama, panorama) {
  mkdirSync(KELUAR, { recursive: true });
  const lebar = panorama ? 4096 : 1600;
  const tinggi = panorama ? 2048 : 1200;
  const img = sharp(buf).resize(lebar, tinggi, { fit: panorama ? "fill" : "cover" });
  await img.clone().webp({ quality: 78 }).toFile(join(KELUAR, `${nama}.webp`));
  if (panorama) await sharp(buf).resize(2048, 1024, { fit: "fill" }).webp({ quality: 72 }).toFile(join(KELUAR, `${nama}-preview.webp`));
  return { lebar, tinggi };
}

async function manifest() {
  const daftar = [];
  for (const [kategori, varian] of Object.entries(KATEGORI)) {
    for (let i = 0; i < varian.length; i++) {
      const nama = `${kategori}-${i + 1}`;
      const f = join(KELUAR, `${nama}.webp`);
      if (!existsSync(f)) continue;
      const meta = await sharp(f).metadata();
      const kecil = await sharp(f).resize(32, 24, { fit: "fill" }).removeAlpha().raw().toBuffer();
      daftar.push({
        id: nama,
        kategori,
        url: `/dummy/${nama}.webp`,
        preview_url: PANORAMA(kategori) ? `/dummy/${nama}-preview.webp` : undefined,
        lebar: meta.width,
        tinggi: meta.height,
        blurhash: blurhash(kecil, 32, 24),
      });
    }
  }
  writeFileSync(join(KELUAR, "manifest.json"), JSON.stringify(daftar, null, 2) + "\n");
  console.log(`manifest: ${daftar.length} foto`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--manifest")) return manifest();
  const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
  const kunci = bacaKunci();
  if (!kunci) {
    console.error("GEMINI_API_KEY tidak ditemukan (env atau ~/.claude/skills/.env).");
    process.exit(1);
  }
  let dibuat = 0;
  for (const [kategori, varian] of Object.entries(KATEGORI)) {
    if (only && !only.includes(kategori)) continue;
    for (let i = 0; i < varian.length; i++) {
      const nama = `${kategori}-${i + 1}`;
      if (existsSync(join(KELUAR, `${nama}.webp`))) continue;
      const panorama = PANORAMA(kategori);
      const prompt = `${DASAR} ${varian[i]}${panorama ? ". Full 360 equirectangular projection, 2:1, horizon centred." : ""}`;
      process.stdout.write(`${nama} … `);
      try {
        const buf = await minta(kunci, prompt, panorama ? "16:9" : "4:3");
        const { lebar, tinggi } = await simpan(buf, nama, panorama);
        console.log(`ok ${lebar}×${tinggi}`);
        dibuat++;
      } catch (e) {
        console.log(`gagal: ${e.message}`);
      }
      await new Promise((r) => setTimeout(r, JEDA_MS));
    }
  }
  console.log(`selesai: ${dibuat} foto baru`);
  await manifest();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
