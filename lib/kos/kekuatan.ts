import type { DetailKosData } from "./detail";

// Client-safe on purpose: detail.ts pulls in the server Supabase client,
// and the detail page's client components must not drag that into the
// browser bundle just to name two strengths.

/** Top strengths for metadata and cards, derived from survey scores only. */
export function kekuatanKos(d: Pick<DetailKosData, "skor" | "sekitar">): string[] {
  const hasil: string[] = [];
  if ((d.skor?.kebersihan ?? 0) >= 4) hasil.push("Bersih");
  if ((d.skor?.kedap ?? 0) >= 4) hasil.push("Kedap suara");
  if ((d.skor?.transparansi ?? 0) >= 4.5) hasil.push("Biaya transparan");
  if (d.sekitar?.landmark_menit_jalan != null && d.sekitar.landmark_menit_jalan <= 7) hasil.push("Dekat landmark");
  return hasil.slice(0, 2);
}
