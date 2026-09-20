// Draws the dummy photo library as flat illustrations (no AI, no network)
// in the same visual language as the homepage hero, then rasterises them
// with sharp into public/dummy/*.webp. Run scripts/foto-dummy.mjs --manifest
// afterwards (or let this script do it) so the seed can pick them up.
//
//   node scripts/foto-dummy-ilustrasi.mjs
//
// Colours come from app/globals.css tokens so the pictures stay on-brand.
// Same file names as the AI variant of the script, so the seed does not care
// which one produced them.

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const KELUAR = join(ROOT, "public", "dummy");

// ---- tokens
const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
const warna = (nama) => {
  const m = css.match(new RegExp(`--color-${nama}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --color-${nama} tidak ada`);
  return m[1];
};
const C = {
  biru600: warna("biru-600"),
  biru500: warna("biru-500"),
  biru100: warna("biru-100"),
  daun500: warna("daun-500"),
  daun100: warna("daun-100"),
  daun700: warna("daun-700"),
  merah500: warna("merah-500"),
  arang900: warna("arang-900"),
  arang500: warna("arang-500"),
  kertas: warna("kertas-50"),
  putih: warna("putih"),
  kayu100: warna("kayu-100"),
  kayu500: warna("kayu-500"),
  langit: warna("langit-100"),
};
// A muted terracotta for roofs, derived from the wood tokens (not a UI colour).
const GENTENG = "#d9a184";
const GENTENG_TUA = "#b97b5c";

// ---- primitives (all in a 400×300 space, y down)
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const rrect = (x, y, w, h, r, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const circle = (cx, cy, r, fill, extra = "") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
const path = (d, fill = "none", extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, w = 2, extra = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const g = (inner, extra = "") => `<g ${extra}>${inner.join("")}</g>`;

/** Small deterministic PRNG so each variant is stable. */
function acak(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lantaiUbin = (y, h, warnaUbin = C.kayu100, garis = C.kayu500, lebarUbin = 40) => {
  const out = [rect(0, y, 400, h, warnaUbin)];
  for (let x = 0; x <= 400; x += lebarUbin) out.push(line(x, y, x, y + h, garis, 1, 'stroke-opacity="0.35"'));
  for (let yy = y; yy <= y + h; yy += lebarUbin * 0.7) out.push(line(0, yy, 400, yy, garis, 1, 'stroke-opacity="0.35"'));
  out.push(line(0, y, 400, y, garis, 1.5, 'stroke-opacity="0.5"'));
  return out.join("");
};

const dindingKeramik = (x, y, w, h, warnaDasar = C.putih, garis = C.biru100, ukuran = 24) => {
  const out = [rect(x, y, w, h, warnaDasar)];
  for (let xx = x; xx <= x + w; xx += ukuran) out.push(line(xx, y, xx, y + h, garis, 1.2));
  for (let yy = y; yy <= y + h; yy += ukuran) out.push(line(x, yy, x + w, yy, garis, 1.2));
  return out.join("");
};

const jendela = (x, y, w, h, opsi = {}) => {
  const { tirai = true, warnaTirai = C.biru500 } = opsi;
  const out = [
    rrect(x, y, w, h, 5, C.putih),
    rrect(x + 5, y + 5, w - 10, h - 10, 3, C.biru100),
    path(`M${x + 5} ${y + h * 0.6}c${w * 0.15}-${h * 0.12} ${w * 0.32}-${h * 0.1} ${w * 0.48}-${h * 0.02}s${w * 0.3} ${h * 0.08} ${w * 0.42}-${h * 0.06}v${h * 0.36}h-${w - 10}z`, C.biru500, 'fill-opacity="0.22"'),
    circle(x + w * 0.72, y + h * 0.28, h * 0.1, C.putih),
    line(x + w / 2, y + 5, x + w / 2, y + h - 5, C.putih, 3),
    line(x + 5, y + h * 0.45, x + w - 5, y + h * 0.45, C.putih, 3),
  ];
  if (tirai) out.push(path(`M${x - 12} ${y - 6}h22v${h + 12}h-22c8-16 8-32 0-48s-8-32 0-48z`, warnaTirai, 'fill-opacity="0.85"'));
  return out.join("");
};

const kasur = (x, y, w, warnaSelimut = C.biru500, opsi = {}) => {
  const { bantal = C.biru100 } = opsi;
  return [
    rrect(x + 6, y - 14, w - 12, 14, 4, C.biru600),
    rrect(x, y, w, 42, 8, C.putih),
    rrect(x, y, w, 42, 8, "none", `stroke="${C.biru100}" stroke-width="1.5"`),
    rrect(x + 12, y + 6, w * 0.28, 18, 5, bantal),
    rrect(x + w * 0.4, y + 8, w * 0.6 - 6, 34, 7, warnaSelimut, 'fill-opacity="0.9"'),
    line(x + w * 0.48, y + 18, x + w * 0.9, y + 18, C.putih, 2, 'stroke-opacity="0.5"'),
    line(x + w * 0.48, y + 28, x + w * 0.75, y + 28, C.putih, 2, 'stroke-opacity="0.5"'),
    rrect(x + 6, y + 40, 10, 16, 2, C.biru600),
    rrect(x + w - 16, y + 40, 10, 16, 2, C.biru600),
  ].join("");
};

const lemari = (x, y, w, h, warnaKayu = C.kayu500) =>
  [
    rrect(x, y, w, h, 4, warnaKayu),
    rrect(x + 4, y + 4, w / 2 - 6, h - 8, 2, C.kayu100, 'fill-opacity="0.5"'),
    rrect(x + w / 2 + 2, y + 4, w / 2 - 6, h - 8, 2, C.kayu100, 'fill-opacity="0.5"'),
    circle(x + w / 2 - 6, y + h / 2, 2.2, C.arang900),
    circle(x + w / 2 + 6, y + h / 2, 2.2, C.arang900),
  ].join("");

const meja = (x, y, w, opsi = {}) => {
  const { laptop = true, lampu = true } = opsi;
  const out = [rrect(x, y, w, 8, 3, C.kayu500), rect(x + 6, y + 8, 6, 34, C.kayu500), rect(x + w - 12, y + 8, 6, 34, C.kayu500)];
  if (laptop) out.push(rrect(x + w * 0.25, y - 20, 30, 20, 3, C.arang900), rrect(x + w * 0.25 + 3, y - 17, 24, 14, 2, C.biru100));
  if (lampu) out.push(line(x + w - 22, y, x + w - 22, y - 18, C.arang900, 2), path(`M${x + w - 30} ${y - 18}h16l-4-10h-8z`, C.arang900), circle(x + w - 22, y - 28, 3, C.putih));
  return out.join("");
};

const tanaman = (x, y, skala = 1) =>
  g(
    [
      path(`M-9 0h18l-2-22h-14z`, C.kayu500),
      path(`M0-22c-2-14-14-20-22-16 4 10 12 14 22 16zM0-22c2-16 14-22 22-18-4 10-12 16-22 18zM0-22c-8-6-6-20 0-26 6 6 8 20 0 26z`, C.daun500),
    ],
    `transform="translate(${x} ${y}) scale(${skala})"`,
  );

const kipas = (cx, cy) => [circle(cx, cy, 6, C.arang900), path(`M${cx - 30} ${cy - 3}h24v6h-24zM${cx + 6} ${cy - 3}h24v6h-24z`, C.arang500), line(cx, cy - 30, cx, cy - 6, C.arang900, 3)].join("");
const ac = (x, y) => [rrect(x, y, 80, 22, 6, C.putih, `stroke="${C.biru100}" stroke-width="1.5"`), line(x + 8, y + 16, x + 72, y + 16, C.biru100, 2), circle(x + 70, y + 7, 2, C.daun500)].join("");

const pintu = (x, y, w, h, warnaPintu = C.kayu500, nomor = true) => {
  const out = [rrect(x, y, w, h, 3, warnaPintu), rrect(x + 5, y + 6, w - 10, h * 0.42, 2, C.kayu100, 'fill-opacity="0.35"'), circle(x + w - 7, y + h * 0.55, 2.4, C.arang900)];
  if (nomor) out.push(rrect(x + w / 2 - 8, y + 14, 16, 8, 2, C.putih));
  return out.join("");
};

const rakSepatu = (x, y) => [rrect(x, y, 30, 12, 2, C.kayu500), rrect(x + 4, y - 6, 9, 6, 2, C.biru500), rrect(x + 16, y - 6, 9, 6, 2, C.arang900)].join("");

const motor = (x, y, warnaBodi = C.biru500, skala = 1) =>
  g(
    [
      circle(-20, 10, 9, C.arang900),
      circle(-20, 10, 4, C.arang500),
      circle(20, 10, 9, C.arang900),
      circle(20, 10, 4, C.arang500),
      path(`M-20 4l8-14h18l6 10 8 4v6h-40z`, warnaBodi),
      path(`M-14-10h16l3-4h-8z`, C.arang900),
      rrect(-4, -6, 14, 6, 3, C.arang900),
      line(6, -12, 12, -18, C.arang900, 2),
    ],
    `transform="translate(${x} ${y}) scale(${skala})"`,
  );

const ember = (x, y, warnaEmber = C.biru500) => [path(`M${x - 12} ${y - 22}h24l-3 26h-18z`, warnaEmber), path(`M${x - 12} ${y - 22}c4-10 20-10 24 0`, "none", `stroke="${C.arang900}" stroke-width="2"`), rrect(x + 14, y - 6, 12, 6, 2, C.daun500), line(x + 26, y - 3, x + 40, y - 12, C.daun500, 3)].join("");

const awan = (x, y, skala = 1) => g([circle(0, 0, 14, C.putih), circle(16, -4, 18, C.putih), circle(34, 2, 13, C.putih), rect(-10, 0, 56, 14, C.putih)], `transform="translate(${x} ${y}) scale(${skala})"`);

const langit = (jam = "siang") => {
  const atas = jam === "sore" ? "#f6d9c2" : C.langit;
  return [rect(0, 0, 400, 300, atas), awan(50, 40, 0.8), awan(250, 30, 1), awan(330, 70, 0.6)].join("");
};

// ---- scenes
function kamar(v) {
  const r = acak(100 + v);
  const warnaSelimut = [C.biru500, C.daun500, C.biru600, C.kayu500][v % 4];
  const adaAC = v % 2 === 1;
  const putri = v === 2;
  const out = [rect(0, 0, 400, 300, putri ? "#fbeef2" : C.langit), lantaiUbin(212, 88)];
  out.push(jendela(232, 40, 120, 100, { tirai: true, warnaTirai: putri ? "#e59ab3" : C.biru500 }));
  if (v % 3 === 0) out.push(rrect(80, 62, 70, 52, 4, C.putih), rrect(86, 68, 58, 40, 2, C.daun100), path("M90 106l16-18 12 12 9-9 15 15z", C.daun500, 'fill-opacity="0.8"'), circle(128, 78, 4, C.putih));
  if (adaAC) out.push(ac(60, 40));
  else out.push(kipas(200, 42));
  out.push(kasur(30, 158, 190, warnaSelimut, { bantal: putri ? "#f6c9d6" : C.biru100 }));
  out.push(lemari(300, 120, 70, 100, [C.kayu500, C.arang500, C.kayu500, C.biru600][v % 4]));
  if (v !== 3) out.push(meja(226, 176, 66, { laptop: r() > 0.3, lampu: true }));
  if (v === 4) out.push(rrect(236, 122, 52, 90, 3, C.putih, `stroke="${C.biru100}" stroke-width="1.5"`), circle(246, 168, 2, C.arang900));
  out.push(tanaman(386, 214, 0.7));
  if (v === 7) out.push(rrect(120, 44, 60, 36, 3, C.arang900), rrect(124, 48, 52, 28, 2, C.biru100));
  return out.join("");
}

function kamarMandi(v) {
  const out = [dindingKeramik(0, 0, 400, 300, C.putih, v === 3 ? "#cfe3f7" : C.biru100, v === 2 ? 34 : 24), lantaiUbin(220, 80, v === 2 ? "#e3e8ee" : C.biru100, C.arang500, 30)];
  // shower
  out.push(line(300, 40, 300, 80, C.arang500, 4), path("M286 80h28v8h-28z", C.arang500), ...Array.from({ length: 5 }, (_, i) => line(288 + i * 6, 92, 286 + i * 6, 130, C.biru500, 2, 'stroke-opacity="0.6"')));
  if (v === 2) out.push(rect(240, 60, 4, 160, C.arang500, 'fill-opacity="0.6"'), rect(240, 60, 150, 160, C.biru100, 'fill-opacity="0.35"'));
  // toilet
  if (v === 3) out.push(rrect(60, 190, 70, 30, 6, C.putih, `stroke="${C.arang500}" stroke-width="2"`), rrect(78, 200, 34, 10, 5, C.biru100));
  else out.push(rrect(60, 150, 40, 40, 6, C.putih, `stroke="${C.arang500}" stroke-width="2"`), rrect(52, 186, 70, 26, 10, C.putih, `stroke="${C.arang500}" stroke-width="2"`), rrect(64, 192, 46, 12, 6, C.biru100));
  // sink + mirror
  if (v !== 3) out.push(rrect(160, 50, 60, 70, 4, C.biru100, `stroke="${C.arang500}" stroke-width="2"`), rrect(150, 150, 80, 18, 6, C.putih, `stroke="${C.arang500}" stroke-width="2"`), line(190, 168, 190, 220, C.arang500, 4));
  // bucket & dipper
  out.push(ember(330, 218, [C.biru500, C.daun500, C.merah500, C.biru600][v % 4]));
  if (v === 2) out.push(rrect(30, 40, 24, 40, 4, C.arang900), circle(42, 60, 4, C.merah500));
  return out.join("");
}

function koridor(v) {
  const out = [rect(0, 0, 400, 300, v === 3 ? "#eef2f6" : C.langit)];
  // perspective floor
  out.push(path("M0 300L120 190h160L400 300z", C.kayu100), path("M0 300L120 190h160L400 300z", "none", `stroke="${C.kayu500}" stroke-width="1.5" stroke-opacity="0.6"`));
  for (let i = 1; i < 6; i++) out.push(line(120 - i * 20, 190 + i * 18.5, 280 + i * 20, 190 + i * 18.5, C.kayu500, 1, 'stroke-opacity="0.35"'));
  // left wall with doors
  out.push(path("M0 0L120 60v130L0 300z", C.putih), path("M0 0L120 60v130L0 300z", "none", `stroke="${C.biru100}" stroke-width="1.5"`));
  const warnaPintu = [C.kayu500, C.kayu500, C.biru600, C.arang500][v];
  out.push(path("M18 70L58 88v100L18 108z", warnaPintu), rrect(34, 96, 10, 6, 1, C.putih), circle(52, 140, 2.4, C.arang900));
  out.push(path("M74 96L100 108v70L74 84z", warnaPintu), rrect(84, 108, 8, 5, 1, C.putih), circle(96, 142, 2, C.arang900));
  // right wall
  out.push(path("M400 0L280 60v130L400 300z", v === 1 ? C.langit : C.kertas));
  if (v === 1) out.push(...Array.from({ length: 6 }, (_, i) => line(290 + i * 18, 150 - i * 6, 290 + i * 18, 210 + i * 8, C.arang500, 3)), line(288, 150, 398, 118, C.arang500, 4));
  else out.push(path("M330 70L370 50v90l-40 10z", C.biru100), line(350, 60, 350, 145, C.putih, 3));
  // end wall with light
  out.push(rect(120, 60, 160, 130, C.putih), rrect(180, 92, 40, 70, 3, C.biru100), rrect(150, 40, 100, 10, 5, v === 2 ? "#fff3c4" : C.putih, `stroke="${C.biru100}" stroke-width="1.5"`));
  // shoe racks & plants
  out.push(rakSepatu(30, 214), rakSepatu(84, 200));
  if (v === 1) out.push(tanaman(300, 232, 0.8));
  if (v === 3) out.push(circle(272, 66, 5, C.arang900), circle(272, 66, 2, C.merah500));
  return out.join("");
}

function dapur(v) {
  const out = [dindingKeramik(0, 0, 400, 300, C.putih, C.biru100, 28), lantaiUbin(226, 74, C.kayu100, C.kayu500, 36)];
  out.push(jendela(250, 40, 110, 80, { tirai: false }));
  // counter
  out.push(rrect(20, 150, 360, 12, 3, C.kayu500), rect(20, 162, 360, 66, C.kertas), ...Array.from({ length: 6 }, (_, i) => rrect(26 + i * 60, 168, 52, 54, 3, [C.biru500, C.kayu500, C.daun500][v % 3], 'fill-opacity="0.85"')));
  // stove
  out.push(rrect(60, 132, 90, 18, 3, C.arang900), circle(82, 141, 8, C.arang500), circle(126, 141, 8, C.arang500), rrect(70, 108, 30, 22, 4, C.arang500), rrect(110, 116, 36, 12, 4, C.biru600));
  // sink
  out.push(rrect(200, 136, 70, 14, 4, C.biru100, `stroke="${C.arang500}" stroke-width="1.5"`), path("M236 136v-22h14", "none", `stroke="${C.arang500}" stroke-width="3" stroke-linecap="round"`));
  // dish rack / dispenser
  if (v !== 1) out.push(rrect(290, 120, 60, 30, 3, C.putih, `stroke="${C.arang500}" stroke-width="1.5"`), ...Array.from({ length: 5 }, (_, i) => circle(300 + i * 12, 130, 6, C.biru100, `stroke="${C.arang500}" stroke-width="1"`)));
  else out.push(rrect(300, 90, 40, 60, 5, C.biru500, 'fill-opacity="0.9"'), rrect(306, 94, 28, 18, 3, C.biru100), rrect(290, 120, 4, 30, 1, C.arang500));
  // rice cooker
  out.push(rrect(160, 126, 30, 24, 8, C.putih, `stroke="${C.arang500}" stroke-width="1.5"`), rrect(168, 122, 14, 6, 3, C.arang500));
  // hooks
  if (v === 2) out.push(...Array.from({ length: 4 }, (_, i) => [line(40 + i * 24, 60, 40 + i * 24, 78, C.arang500, 2), circle(40 + i * 24, 86, 7, C.arang500)].join("")));
  return out.join("");
}

function parkir(v) {
  const out = [langit(), rect(0, 190, 400, 110, "#d9dde3"), ...Array.from({ length: 4 }, (_, i) => line(0, 212 + i * 24, 400, 212 + i * 24, C.putih, 2, 'stroke-opacity="0.5"'))];
  // canopy
  out.push(path("M20 110h360l20 30H0z", C.biru600), rect(30, 140, 6, 60, C.arang500), rect(364, 140, 6, 60, C.arang500), rect(196, 140, 6, 60, C.arang500));
  // gate / wall behind
  out.push(rect(0, 140, 400, 52, C.kertas), ...Array.from({ length: 14 }, (_, i) => line(20 + i * 28, 140, 20 + i * 28, 192, C.arang500, 2, 'stroke-opacity="0.5"')));
  const warna = [C.biru500, C.arang900, C.merah500, C.daun500, C.biru600, C.kayu500];
  const n = v === 1 ? 3 : 6;
  for (let i = 0; i < n; i++) out.push(motor(60 + i * 56, 232 + (i % 2) * 10, warna[(i + v) % warna.length], 1.1));
  if (v === 2) out.push(rrect(280, 176, 100, 50, 10, C.putih, `stroke="${C.arang500}" stroke-width="2"`), circle(300, 226, 10, C.arang900), circle(360, 226, 10, C.arang900), rrect(296, 160, 60, 20, 8, C.biru100), circle(384, 128, 5, C.arang900), circle(384, 128, 2, C.merah500));
  if (v === 1) out.push(circle(330, 250, 12, C.arang900, `stroke="${C.putih}" stroke-width="2"`), circle(362, 250, 12, C.arang900, `stroke="${C.putih}" stroke-width="2"`), path("M330 250l14-22h20l-2 22", "none", `stroke="${C.daun500}" stroke-width="3"`));
  out.push(tanaman(24, 196, 0.8));
  return out.join("");
}

function ruangTamu(v) {
  const out = [rect(0, 0, 400, 300, v === 1 ? "#f3f1ea" : C.langit), lantaiUbin(212, 88)];
  out.push(jendela(40, 50, 100, 90, { tirai: true, warnaTirai: [C.biru500, C.daun500, C.kayu500][v] }));
  // sofa / chairs
  if (v === 1) out.push(...[0, 1, 2].map((i) => [rrect(60 + i * 60, 170, 40, 40, 6, C.biru500), rrect(60 + i * 60, 150, 40, 24, 5, C.biru600)].join("")));
  else out.push(rrect(50, 150, 160, 30, 8, [C.biru600, C.kayu500, C.daun700][v]), rrect(40, 178, 180, 34, 8, [C.biru500, C.kayu500, C.daun500][v]), rrect(56, 156, 60, 20, 5, C.biru100), rrect(134, 156, 60, 20, 5, C.biru100));
  // table
  out.push(rrect(80, 226, 110, 8, 3, C.kayu500), rect(88, 234, 6, 26, C.kayu500), rect(176, 234, 6, 26, C.kayu500));
  // tv / clock / board
  if (v === 0) out.push(circle(300, 70, 22, C.putih, `stroke="${C.arang900}" stroke-width="3"`), line(300, 70, 300, 56, C.arang900, 2), line(300, 70, 310, 76, C.arang900, 2));
  if (v === 1) out.push(rrect(250, 60, 110, 66, 4, C.arang900), rrect(256, 66, 98, 54, 2, C.biru100), rrect(290, 126, 30, 6, 2, C.arang500));
  if (v === 2) out.push(rrect(240, 50, 130, 90, 4, C.kayu500), rect(248, 58, 114, 74, C.kertas), ...[0, 1, 2, 3].map((i) => rrect(256 + (i % 2) * 54, 66 + Math.floor(i / 2) * 32, 44, 24, 2, [C.biru100, C.daun100, "#fde9c9", C.biru100][i])), rakSepatu(300, 200));
  out.push(tanaman(360, 214, 1));
  return out.join("");
}

function jemuran(v) {
  const out = [langit(v === 1 ? "sore" : "siang")];
  if (v === 0) {
    out.push(rect(0, 200, 400, 100, "#cfd6de"), ...Array.from({ length: 10 }, (_, i) => line(i * 44, 200, i * 44, 300, C.arang500, 1, 'stroke-opacity="0.3"')));
    out.push(rect(0, 180, 400, 20, C.kertas), rrect(320, 100, 50, 80, 8, C.biru600), rrect(326, 94, 38, 12, 4, C.arang500));
    out.push(rect(40, 110, 6, 90, C.arang500), rect(280, 110, 6, 90, C.arang500), line(43, 120, 283, 120, C.arang900, 2), line(43, 150, 283, 150, C.arang900, 2));
    const baju = [C.biru500, C.merah500, C.putih, C.daun500, C.kayu500, C.biru100];
    for (let i = 0; i < 6; i++) out.push(path(`M${60 + i * 36} 122l-6 6v20h22v-20l-6-6z`, baju[i]));
    for (let i = 0; i < 5; i++) out.push(rrect(70 + i * 40, 152, 14, 26, 3, baju[(i + 2) % 6]));
  } else {
    out.push(rect(0, 200, 400, 100, C.kayu100), path("M0 60h260v18H0z", C.biru600), rect(20, 78, 6, 122, C.arang500), rect(240, 78, 6, 122, C.arang500));
    out.push(rrect(280, 140, 70, 60, 6, C.putih, `stroke="${C.arang500}" stroke-width="2"`), circle(315, 172, 18, C.biru100, `stroke="${C.arang500}" stroke-width="2"`), circle(315, 172, 10, C.biru500, 'fill-opacity="0.4"'));
    out.push(...[0, 1, 2].map((i) => line(40, 110 + i * 26, 226, 110 + i * 26, C.arang900, 2)));
    const baju = [C.biru500, C.daun500, C.putih, C.merah500, C.biru100];
    for (let i = 0; i < 5; i++) out.push(rrect(50 + i * 36, 112, 18, 28, 3, baju[i]), rrect(60 + i * 36, 140, 14, 22, 3, baju[(i + 3) % 5]));
    out.push(tanaman(380, 200, 0.9));
  }
  return out.join("");
}

function tampakDepan(v) {
  const lantai = [2, 2, 3, 1, 3, 2][v];
  const warnaGerbang = [C.arang900, C.daun500, C.kayu500, C.putih, C.biru600, C.arang900][v];
  const warnaDinding = [C.putih, C.kertas, "#e6e9ee", C.putih, C.biru100, C.putih][v];
  const out = [langit(), rect(0, 220, 400, 80, "#d9dde3"), line(0, 258, 400, 258, C.putih, 2, 'stroke-opacity="0.5"')];
  const tinggiLantai = 54;
  const dasar = 220;
  const atapY = dasar - lantai * tinggiLantai;
  out.push(rect(60, atapY, 280, lantai * tinggiLantai, warnaDinding));
  // roof
  if (v === 4 || v === 2) out.push(rect(52, atapY - 10, 296, 12, C.arang500));
  else out.push(path(`M44 ${atapY + 2}L200 ${atapY - 42}L356 ${atapY + 2}z`, GENTENG), ...Array.from({ length: 6 }, (_, i) => line(70 + i * 44, atapY - 2 - i * 0, 200, atapY - 40, GENTENG_TUA, 1, 'stroke-opacity="0.35"')));
  // windows per floor
  for (let l = 0; l < lantai; l++) {
    const y = atapY + 10 + l * tinggiLantai;
    const kolom = l === lantai - 1 ? [80, 250] : [80, 165, 250];
    for (const x of kolom) out.push(rrect(x, y, 50, 32, 3, C.biru100, `stroke="${C.arang500}" stroke-width="1.5"`), line(x + 25, y, x + 25, y + 32, C.putih, 2));
    if (l < lantai - 1) out.push(rect(60, y + 40, 280, 4, C.arang500, 'fill-opacity="0.35"'));
  }
  // door (ground floor middle) & gate
  out.push(rrect(176, dasar - 46, 48, 46, 3, warnaGerbang === C.putih ? C.kayu500 : warnaGerbang), rrect(184, dasar - 40, 32, 18, 2, C.biru100, 'fill-opacity="0.7"'));
  if (v === 4) out.push(rect(60, dasar - 46, 280, 46, C.biru100, 'fill-opacity="0.6"'), rrect(176, dasar - 46, 48, 46, 2, C.arang500), line(200, dasar - 46, 200, dasar, C.putih, 2));
  // fence
  out.push(rect(0, 196, 400, 24, C.kertas), ...Array.from({ length: 24 }, (_, i) => line(8 + i * 17, 196, 8 + i * 17, 220, warnaGerbang, 3)), line(0, 200, 400, 200, warnaGerbang, 3));
  // plants & motorbikes
  out.push(tanaman(30, 220, 0.9), tanaman(372, 220, 0.9));
  if (v !== 3) out.push(motor(120, 250, C.biru500, 1), motor(280, 254, C.arang900, 1));
  if (v === 3) out.push(rrect(90, 206, 30, 14, 3, C.merah500, 'fill-opacity="0.8"'), rrect(140, 206, 30, 14, 3, C.merah500, 'fill-opacity="0.8"'), ...[0, 1, 2, 3].map((i) => circle(90 + i * 22, 200 + (i % 2) * 6, 7, "#e59ab3")));
  if (v === 5) out.push(line(70, atapY + 6, 200, atapY + 6, C.arang900, 1.5), ...[0, 1, 2, 3].map((i) => rrect(84 + i * 30, atapY + 8, 12, 18, 2, [C.biru500, C.putih, C.daun500, C.merah500][i])));
  return out.join("");
}

function patokanGang(v) {
  const out = [langit(), rect(0, 220, 400, 80, "#d9dde3")];
  // walls of the alley
  out.push(rect(0, 90, 120, 130, C.putih), rect(280, 90, 120, 130, C.kertas), rect(120, 150, 160, 70, "#c9cfd7"), ...Array.from({ length: 4 }, (_, i) => line(120, 168 + i * 14, 280, 168 + i * 14, C.putih, 1.5, 'stroke-opacity="0.4"')));
  out.push(path("M0 90L120 90L120 60z", C.arang500, 'fill-opacity="0.15"'));
  if (v === 0) {
    // warung with blue awning
    out.push(rect(20, 130, 90, 90, C.kayu100), path("M10 130h110l-8-22H18z", C.biru500), ...Array.from({ length: 7 }, (_, i) => line(18 + i * 16, 108, 18 + i * 16, 130, C.putih, 2, 'stroke-opacity="0.6"')), rrect(36, 150, 58, 24, 3, C.putih), ...[0, 1, 2].map((i) => rrect(40 + i * 18, 156, 14, 12, 2, [C.merah500, C.daun500, C.biru500][i])));
    out.push(motor(330, 236, C.arang900, 1.05));
  }
  if (v === 1) {
    out.push(rect(290, 130, 100, 90, C.putih), path("M300 130c0-50 80-50 80 0", C.daun500), path("M330 220v-40a10 10 0 0 1 20 0v40", C.biru100), rect(372, 60, 10, 160, C.putih, `stroke="${C.arang500}" stroke-width="1.5"`), path("M370 60l7-16 7 16z", C.daun500));
  }
  if (v === 2) {
    out.push(rect(320, 120, 14, 100, "#8b6b4a"), path("M327 130c-50-20-50-80 0-90 50 10 50 70 0 90z", C.daun500), path("M327 130c-30-20-30-60 0-70 30 10 30 50 0 70z", C.daun700, 'fill-opacity="0.35"'));
    out.push(motor(60, 236, C.biru500, 1.05), motor(120, 240, C.merah500, 1.05));
  }
  out.push(tanaman(140, 220, 0.7), circle(60, 60, 14, C.putih, 'fill-opacity="0.9"'));
  return out.join("");
}

function patokanMinimarket(v) {
  const out = [langit(v === 1 ? "sore" : "siang"), rect(0, 220, 400, 80, "#d9dde3")];
  out.push(rect(40, 110, 320, 110, C.putih), rect(40, 96, 320, 14, C.arang900));
  // striped awning
  for (let i = 0; i < 16; i++) out.push(rect(40 + i * 20, 118, 20, 22, i % 2 ? C.merah500 : C.putih));
  out.push(path("M40 140h320l6 6H34z", C.arang500));
  // glass doors and shelves
  out.push(rrect(150, 150, 100, 70, 3, C.biru100, `stroke="${C.arang500}" stroke-width="2"`), line(200, 150, 200, 220, C.arang500, 2));
  out.push(rrect(56, 150, 80, 60, 3, C.biru100, `stroke="${C.arang500}" stroke-width="2"`), rrect(264, 150, 80, 60, 3, C.biru100, `stroke="${C.arang500}" stroke-width="2"`));
  for (const x of [56, 264]) for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) out.push(rrect(x + 6 + i * 14, 156 + r * 18, 10, 12, 1, [C.merah500, C.biru500, C.daun500, C.kayu500][(i + r) % 4]));
  out.push(motor(300, 250, C.biru500, 1), motor(350, 254, C.arang900, 1));
  if (v === 1) out.push(circle(80, 60, 18, "#f7c96f"));
  return out.join("");
}

// Panoramas: a 2:1 strip that unwraps the four walls of a room. Not a true
// equirectangular projection, but the viewer wraps it around the eye well
// enough for a placeholder tour.
function panorama(jenis, v) {
  const W = 800;
  const H = 400;
  const out = [rect(0, 0, W, 140, C.langit), rect(0, 140, W, 160, C.putih), rect(0, 300, W, 100, C.kayu100)];
  for (let x = 0; x <= W; x += 50) out.push(line(x, 300, x, 400, C.kayu500, 1, 'stroke-opacity="0.35"'));
  for (let y = 300; y <= 400; y += 34) out.push(line(0, y, W, y, C.kayu500, 1, 'stroke-opacity="0.35"'));
  out.push(line(0, 140, W, 140, C.biru100, 3), line(0, 300, W, 300, C.kayu500, 2));
  if (jenis === "kamar") {
    out.push(jendela(90, 160, 110, 100, { tirai: true, warnaTirai: v ? C.daun500 : C.biru500 }));
    out.push(kasur(240, 262, 200, v ? C.daun500 : C.biru500));
    out.push(lemari(480, 190, 80, 110));
    out.push(meja(590, 256, 80));
    out.push(pintu(700, 180, 60, 120, C.kayu500, false));
    out.push(v ? ac(300, 150) : kipas(400, 60), tanaman(760, 300, 0.8));
  } else if (jenis === "koridor") {
    for (let i = 0; i < 6; i++) out.push(pintu(40 + i * 130, 180, 56, 120, i % 2 ? C.kayu500 : C.biru600), rakSepatu(102 + i * 130, 288));
    out.push(rrect(300, 150, 120, 8, 4, "#fff3c4"), tanaman(730, 300, 0.9));
  } else {
    out.push(dindingKeramik(0, 140, W, 160, C.putih, C.biru100, 28));
    out.push(rrect(40, 240, 400, 10, 3, C.kayu500), rect(40, 250, 400, 50, C.kertas), ...Array.from({ length: 7 }, (_, i) => rrect(46 + i * 56, 254, 48, 42, 3, C.biru500, 'fill-opacity="0.85"')));
    out.push(rrect(90, 224, 90, 18, 3, C.arang900), circle(112, 233, 8, C.arang500), circle(156, 233, 8, C.arang500));
    out.push(rrect(240, 228, 70, 14, 4, C.biru100, `stroke="${C.arang500}" stroke-width="1.5"`), path("M276 228v-22h14", "none", `stroke="${C.arang500}" stroke-width="3"`));
    out.push(jendela(520, 160, 120, 80, { tirai: false }), rrect(690, 170, 60, 80, 5, C.biru500, 'fill-opacity="0.9"'), tanaman(780, 300, 0.8));
  }
  return { svg: out.join(""), W, H };
}

const KATEGORI = {
  "tampak-depan": [0, 1, 2, 3, 4, 5].map((v) => () => tampakDepan(v)),
  kamar: [0, 1, 2, 3, 4, 5, 6, 7].map((v) => () => kamar(v)),
  "kamar-mandi": [0, 1, 2, 3].map((v) => () => kamarMandi(v)),
  koridor: [0, 1, 2, 3].map((v) => () => koridor(v)),
  dapur: [0, 1, 2].map((v) => () => dapur(v)),
  parkir: [0, 1, 2].map((v) => () => parkir(v)),
  "ruang-tamu": [0, 1, 2].map((v) => () => ruangTamu(v)),
  jemuran: [0, 1].map((v) => () => jemuran(v)),
  "patokan-gang": [0, 1, 2].map((v) => () => patokanGang(v)),
  "patokan-minimarket": [0, 1].map((v) => () => patokanMinimarket(v)),
  "360-kamar": [0, 1].map((v) => () => panorama("kamar", v)),
  "360-koridor": [0].map((v) => () => panorama("koridor", v)),
  "360-dapur": [0].map((v) => () => panorama("dapur", v)),
};

async function tulis(nama, isi, panoramaKah) {
  const W = panoramaKah ? isi.W : 400;
  const H = panoramaKah ? isi.H : 300;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${panoramaKah ? 4096 : 1600}" height="${panoramaKah ? 2048 : 1200}">${panoramaKah ? isi.svg : isi}</svg>`;
  const buf = Buffer.from(svg);
  await sharp(buf).webp({ quality: 80 }).toFile(join(KELUAR, `${nama}.webp`));
  if (panoramaKah) await sharp(buf).resize(2048, 1024).webp({ quality: 72 }).toFile(join(KELUAR, `${nama}-preview.webp`));
}

async function main() {
  mkdirSync(KELUAR, { recursive: true });
  let n = 0;
  for (const [kategori, varian] of Object.entries(KATEGORI)) {
    for (let i = 0; i < varian.length; i++) {
      const nama = `${kategori}-${i + 1}`;
      await tulis(nama, varian[i](), kategori.startsWith("360-"));
      n++;
    }
  }
  console.log(`${n} ilustrasi ditulis ke public/dummy`);
  execFileSync(process.execPath, [join(ROOT, "scripts", "foto-dummy.mjs"), "--manifest"], { stdio: "inherit" });
  void existsSync;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
