// 360° pipeline: from the Insta360 equirectangular export, make the 2048 px
// preview and the 6144 px full version, then print the kos_media row to
// paste (or the wrangler commands to push both files to R2).
//
//   node scripts/proses-360.mjs ./insta360/kamar.jpg --titik kamar --slug kos-putri-melati
//
// Output: ./insta360/kamar-2048.jpg, ./insta360/kamar-6144.jpg and a JSON
// snippet for `tur`. Upload with:
//   wrangler r2 object put kosbahagia-media/360/<slug>/<titik>-2048.jpg --file …
//   wrangler r2 object put kosbahagia-media/360/<slug>/<titik>-6144.jpg --file …
// sharp is a devDependency; it replaces exporting sizes by hand from Insta360 Studio.

import { statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const sumber = args.find((a) => !a.startsWith("--"));
const opsi = (nama, fallback) => {
  const i = args.indexOf(`--${nama}`);
  return i >= 0 ? args[i + 1] : fallback;
};
if (!sumber) {
  console.error("Pakai: node scripts/proses-360.mjs <equirect.jpg> --titik kamar --slug <kos-slug>");
  process.exit(1);
}
const titik = opsi("titik", basename(sumber, extname(sumber)));
const slug = opsi("slug", "kos");
const bucket = opsi("bucket", "https://media.kosbahagia.com");

const meta = await sharp(sumber).metadata();
if (!meta.width || !meta.height || Math.abs(meta.width / meta.height - 2) > 0.05) {
  console.error(`Bukan equirectangular 2:1 (${meta.width}×${meta.height}).`);
  process.exit(1);
}

const dir = dirname(sumber);
const keluaran = {};
for (const lebar of [2048, 6144]) {
  const tujuan = join(dir, `${titik}-${lebar}.jpg`);
  await sharp(sumber)
    .resize({ width: Math.min(lebar, meta.width), withoutEnlargement: true })
    .jpeg({ quality: lebar === 2048 ? 72 : 80, progressive: true, mozjpeg: true })
    .toFile(tujuan);
  keluaran[lebar] = { file: tujuan, bytes: statSync(tujuan).size };
  console.log(`${lebar} px → ${tujuan} (${(keluaran[lebar].bytes / 1e6).toFixed(1)} MB)`);
}

const url = (lebar) => `${bucket}/360/${slug}/${titik}-${lebar}.jpg`;
console.log("\nkos_media row (jenis = foto360):");
console.log(
  JSON.stringify(
    {
      url: url(6144),
      lebar: Math.min(6144, meta.width),
      tinggi: Math.round(Math.min(6144, meta.width) / 2),
      keterangan: `Tur 360° ${titik}`,
      tur: { titik, preview_url: url(2048), ukuran_bytes: keluaran[6144].bytes, hotspot: [] },
    },
    null,
    2,
  ),
);
