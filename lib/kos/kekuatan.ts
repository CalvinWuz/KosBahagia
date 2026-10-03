import type { DetailKosData } from "./detail";
import { chipKebersihan, kataKedap } from "@/lib/skala";

// Client-safe on purpose: detail.ts pulls in the server Supabase client,
// and the detail page's client components must not drag that into the
// browser bundle just to name two strengths.

/** Top strengths for metadata and cards, derived from survey scores only. */
export function kekuatanKos(d: Pick<DetailKosData, "skor" | "sekitar">): string[] {
  const hasil: string[] = [];
  // Same words as the card chips and the detail page (lib/skala).
  const bersih = chipKebersihan(d.skor?.kebersihan);
  if (bersih) hasil.push(bersih);
  if ((d.skor?.kedap ?? 0) >= 4) hasil.push(kataKedap(d.skor?.kedap) ?? "Kedap suara");
  if ((d.skor?.transparansi ?? 0) >= 4.5) hasil.push("Biaya disebutkan jelas");
  if (d.sekitar?.landmark_menit_jalan != null && d.sekitar.landmark_menit_jalan <= 7) hasil.push("Dekat landmark");
  return hasil.slice(0, 2);
}
