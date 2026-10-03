import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailKos } from "@/components/kos/DetailKos";
import { supabaseServer } from "@/lib/supabase/server";
import { detailKos, kekuatanKos } from "@/lib/kos/detail";
import { formatRupiah } from "@/lib/format";
import { bacaKamar, hitungBiaya, labelTotal } from "@/lib/biaya";
import { MODE_DEMO } from "@/lib/demo";
import { jsonAman } from "@/lib/seo";

const SITUS = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com";

// Static with revalidation; availability is refreshed on the client.
export const revalidate = 3600;
export const dynamicParams = true;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const { data } = await supabaseServer().from("kos").select("slug").eq("status", "tayang");
    return (data ?? []).map((k) => ({ slug: k.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const d = await detailKos(slug);
  if (!d) return { title: "Kos tidak ditemukan", robots: { index: false } };
  const kamar = bacaKamar(d.kartu.kamar);
  const biaya = kamar ? hitungBiaya(kamar) : null;
  const total = formatRupiah(biaya?.total ?? d.kartu.total_bulanan ?? 0);
  const kekuatan = kekuatanKos(d);
  const judul = `${d.kos.nama}, ${d.area?.nama ?? ""} — ${total}/bulan`;
  // Say exactly what the number is: complete, an estimate, or partial.
  const artiTotal = !biaya
    ? `Total ${total} per bulan.`
    : !biaya.lengkap
      ? `${labelTotal(biaya)} ${total} per bulan; ${biaya.belumDiketahui.join(" dan ").toLowerCase()} belum diketahui.`
      : `${labelTotal(biaya)} ${total} per bulan untuk kamar ${kamar?.nama}, sudah termasuk biaya wajib.`;
  const deskripsi =
    `Kos ${d.kos.tipe} di ${d.area?.nama ?? d.kos.alamat}. ${artiTotal}` +
    (kekuatan.length ? ` ${kekuatan.join(" dan ")}.` : "") +
    (MODE_DEMO ? " Data contoh prototipe." : " Sudah kami datangi dan cek langsung.");
  return {
    title: { absolute: `${judul} · Kos Bahagia` },
    description: deskripsi,
    alternates: { canonical: `/kos/${d.kos.slug}` },
    openGraph: { title: judul, description: deskripsi, type: "website", locale: "id_ID" },
  };
}

export default async function HalamanKos({ params }: Params) {
  const { slug } = await params;
  const d = await detailKos(slug);
  if (!d) notFound();

  // Structured data states only facts we hold, and none at all while the
  // listings are sample data (no fake offers in search results).
  const kamar = bacaKamar(d.kartu.kamar);
  const biaya = kamar ? hitungBiaya(kamar) : null;
  const tersedia = (d.kartu.kamar_acuan_tersedia ?? 0) > 0 && !d.kartu.perlu_dikonfirmasi;
  const foto = d.media.filter((m) => m.jenis === "foto").map((m) => new URL(m.url, SITUS).toString());
  const jsonLd =
    MODE_DEMO || !biaya?.lengkap
      ? null
      : {
          "@context": "https://schema.org",
          "@type": "Product",
          name: `${d.kos.nama}, kamar ${kamar?.nama}`,
          description: `Kos ${d.kos.tipe} di ${d.area?.nama ?? d.kos.alamat}, disurvei Kos Bahagia.`,
          image: foto.slice(0, 4),
          offers: {
            "@type": "Offer",
            price: biaya.total,
            priceCurrency: "IDR",
            availability: tersedia ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${SITUS}/kos/${d.kos.slug}`,
            priceSpecification: { "@type": "UnitPriceSpecification", price: biaya.total, priceCurrency: "IDR", unitText: "bulan" },
          },
        };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonAman(jsonLd) }} />}
      <DetailKos data={d} sekarang={new Date().toISOString()} />
    </>
  );
}
