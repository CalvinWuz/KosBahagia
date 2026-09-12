// Cross-surface links. The mitra surface lives on its own host, so links to
// it are plain <a> tags (full page load), never next/link.
export const MITRA_URL =
  process.env.NEXT_PUBLIC_MITRA_URL ?? "https://mitra.kosbahagia.com";
