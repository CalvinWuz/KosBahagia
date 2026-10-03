// Photos vs illustrations. The prototype's pictures are drawn illustrations
// (public/dummy, made by scripts/foto-dummy-ilustrasi.mjs), not photos of the
// kos. They must be labelled as such and described as such in alt text.

export function adalahIlustrasi(url: string | null | undefined): boolean {
  return typeof url === "string" && url.startsWith("/dummy/");
}

/** Alt text that says what the image actually is. */
export function altMedia(opsi: { url: string; keterangan?: string | null; nama: string; urutan: number }): string {
  const isi = opsi.keterangan ?? `Gambar ${opsi.urutan + 1}`;
  return adalahIlustrasi(opsi.url) ? `Ilustrasi contoh: ${isi.toLowerCase()}, ${opsi.nama}` : `${isi}, ${opsi.nama}`;
}
