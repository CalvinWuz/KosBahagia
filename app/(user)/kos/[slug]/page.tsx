import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailKos } from "@/components/kos/DetailKos";
import { supabaseServer } from "@/lib/supabase/server";
import { detailKos, kekuatanKos } from "@/lib/kos/detail";
import { formatRupiah } from "@/lib/format";

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
  const total = formatRupiah(d.kartu.total_bulanan ?? 0);
  const kekuatan = kekuatanKos(d);
  const judul = `${d.kos.nama}, ${d.area?.nama ?? ""} — ${total}/bulan`;
  const deskripsi =
    `Kos ${d.kos.tipe} di ${d.area?.nama ?? d.kos.alamat}. Total ${total} per bulan sudah termasuk listrik, air, dan biaya wajib.` +
    (kekuatan.length ? ` ${kekuatan.join(" dan ")}.` : "") +
    " Sudah kami datangi dan cek langsung.";
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

  const tersedia = (d.kartu.kamar_tersedia ?? 0) > 0;
  const foto = d.media.filter((m) => m.jenis === "foto").map((m) => m.url);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: d.kos.nama,
    description: `Kos ${d.kos.tipe} di ${d.area?.nama ?? d.kos.alamat}, sudah disurvei Kos Bahagia.`,
    image: foto.slice(0, 4),
    brand: { "@type": "Organization", name: "Kos Bahagia" },
    offers: {
      "@type": "Offer",
      price: d.kartu.total_bulanan ?? 0,
      priceCurrency: "IDR",
      availability: tersedia ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://kosbahagia.com/kos/${d.kos.slug}`,
      priceSpecification: { "@type": "UnitPriceSpecification", price: d.kartu.total_bulanan ?? 0, priceCurrency: "IDR", unitText: "bulan" },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DetailKos data={d} sekarang={new Date().toISOString()} />
    </>
  );
}
