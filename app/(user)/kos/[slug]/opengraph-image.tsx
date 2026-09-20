import { ImageResponse } from "next/og";
import { detailKos } from "@/lib/kos/detail";
import { formatRupiah } from "@/lib/format";

export const revalidate = 3600;
export const alt = "Kos Bahagia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// First photo with the real monthly total overlaid. Colours mirror the
// design tokens (biru-600, jingga-500, putih, arang-900); next/og cannot
// read CSS variables.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await detailKos(slug);
  // next/og needs an absolute URL; seed placeholders under /dummy are relative.
  const situs = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com";
  const fotoMentah = d?.media.find((m) => m.jenis === "foto")?.url;
  const foto = fotoMentah?.startsWith("/") ? `${situs}${fotoMentah}` : fotoMentah;
  const total = d ? formatRupiah(d.kartu.total_bulanan ?? 0) : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#1256b8", color: "#ffffff", fontFamily: "sans-serif" }}>
        {foto && (
          <img src={foto} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(22,32,46,0) 30%, rgba(22,32,46,0.85) 100%)", display: "flex" }} />
        <div style={{ position: "absolute", left: 56, right: 56, bottom: 48, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 28, opacity: 0.9, display: "flex" }}>{d?.area?.nama ?? "Kos Bahagia"}</div>
          <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, display: "flex" }}>{d?.kos.nama ?? "Kos Bahagia"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            <div style={{ fontSize: 44, fontWeight: 800, display: "flex" }}>{total}</div>
            <div style={{ fontSize: 24, opacity: 0.9, display: "flex" }}>/bulan, total sudah semua</div>
          </div>
        </div>
        <div style={{ position: "absolute", top: 40, left: 56, display: "flex", alignItems: "center", gap: 12, background: "#ffffff", color: "#1256b8", borderRadius: 999, padding: "10px 20px", fontSize: 24, fontWeight: 800 }}>
          Kos Bahagia
        </div>
      </div>
    ),
    { ...size },
  );
}
