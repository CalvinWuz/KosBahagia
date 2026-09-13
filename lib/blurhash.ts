// Minimal BlurHash decoder (https://blurha.sh) — pure TS, ~70 lines, so we
// need no dependency for a 32×32 placeholder. Returns RGBA pixels.

const ALFABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~";

function base83(s: string): number {
  let n = 0;
  for (const c of s) n = n * 83 + ALFABET.indexOf(c);
  return n;
}
function keLinear(v: number): number {
  const x = v / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function keSrgb(v: number): number {
  const x = Math.max(0, Math.min(1, v));
  return Math.round((x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255);
}
function tanda(v: number, e: number) {
  return (v < 0 ? -1 : 1) * Math.pow(Math.abs(v), e);
}

export function validBlurhash(hash: string | null | undefined): hash is string {
  if (!hash || hash.length < 6) return false;
  const ukuran = base83(hash[0]);
  const nx = (ukuran % 9) + 1;
  const ny = Math.floor(ukuran / 9) + 1;
  return hash.length === 4 + 2 * nx * ny;
}

export function decodeBlurhash(hash: string, lebar: number, tinggi: number, punch = 1): Uint8ClampedArray<ArrayBuffer> {
  const ukuran = base83(hash[0]);
  const nx = (ukuran % 9) + 1;
  const ny = Math.floor(ukuran / 9) + 1;
  const maks = ((base83(hash[1]) + 1) / 166) * punch;

  const warna: Array<[number, number, number]> = [];
  for (let i = 0; i < nx * ny; i++) {
    if (i === 0) {
      const v = base83(hash.slice(2, 6));
      warna.push([keLinear(v >> 16), keLinear((v >> 8) & 255), keLinear(v & 255)]);
    } else {
      const v = base83(hash.slice(4 + i * 2, 6 + i * 2));
      warna.push([
        tanda((Math.floor(v / (19 * 19)) - 9) / 9, 2) * maks,
        tanda((Math.floor(v / 19) % 19 - 9) / 9, 2) * maks,
        tanda(((v % 19) - 9) / 9, 2) * maks,
      ]);
    }
  }

  const piksel = new Uint8ClampedArray(new ArrayBuffer(lebar * tinggi * 4));
  for (let y = 0; y < tinggi; y++) {
    for (let x = 0; x < lebar; x++) {
      let r = 0, g = 0, b = 0;
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const basis = Math.cos((Math.PI * x * i) / lebar) * Math.cos((Math.PI * y * j) / tinggi);
          const w = warna[i + j * nx];
          r += w[0] * basis;
          g += w[1] * basis;
          b += w[2] * basis;
        }
      }
      const p = 4 * (x + y * lebar);
      piksel[p] = keSrgb(r);
      piksel[p + 1] = keSrgb(g);
      piksel[p + 2] = keSrgb(b);
      piksel[p + 3] = 255;
    }
  }
  return piksel;
}
