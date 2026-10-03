import type { Metadata } from "next";
import { jsonAman } from "@/lib/seo";
import { MODE_DEMO } from "@/lib/demo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KosCard } from "@/components/kos/KosCard";
import { FaktaArea } from "@/components/area/FaktaArea";
import { FaqArea, faqArea } from "@/components/area/FaqArea";
import { buttonClasses } from "@/components/ui/Button";
import { supabaseServer } from "@/lib/supabase/server";
import { daftarAreaLayak, dataArea } from "@/lib/area/data";
import { hrefCari } from "@/lib/cari-params";
import { formatJarak, formatRupiah } from "@/lib/format";

// Statically generated, revalidated daily. The generator only emits areas
// with at least MIN_LISTING_AREA listings; thinner ones 404.
export const revalidate = 86400;
export const dynamicParams = true;

type Params = { params: Promise<{ slug: string }> };
const TIPE: Record<string, string> = { kecamatan: "Kecamatan", kampus: "Kampus", stasiun: "Stasiun" };
/** Cards shown on the area page before "Lihat semua". */
const CUPLIKAN = 6;

const SITUS = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kosbahagia.com";

export async function generateStaticParams() {
  try {
    return (await daftarAreaLayak(supabaseServer())).map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const d = await dataArea(slug);
  if (!d) return { title: "Area tidak ditemukan", robots: { index: false } };
  const judul = d.area.seo_judul ?? `Kos di ${d.area.nama}`;
  const deskripsi =
    d.area.seo_deskripsi ??
    `${d.statistik.jumlah_kos} kos di ${d.area.nama} yang sudah kami survei, total per bulan mulai ${formatRupiah(d.statistik.min_total)}.`;
  return {
    title: { absolute: `${judul} · Kos Bahagia` },
    description: deskripsi,
    alternates: { canonical: `/area/${d.area.slug}` },
    openGraph: { title: judul, description: deskripsi, type: "website", locale: "id_ID", url: `/area/${d.area.slug}` },
  };
}

export default async function HalamanArea({ params }: Params) {
  const { slug } = await params;
  const d = await dataArea(slug);
  if (!d) notFound();
  const { area, statistik, kos, tetangga } = d;
  const nama = area.nama ?? slug;
  const faq = faqArea(nama, statistik);
  const sekarang = new Date();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Kos di ${nama}`,
      numberOfItems: kos.length,
      itemListElement: kos.slice(0, 20).map((k, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITUS}/kos/${k.slug}`,
        name: k.nama,
      })),
    },
    // FAQ answers quote area statistics; sample data must not be published as fact.
    ...(MODE_DEMO
      ? []
      : [
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Kos Bahagia", item: SITUS },
        { "@type": "ListItem", position: 2, name: nama, item: `${SITUS}/area/${slug}` },
      ],
    },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-6 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonAman(jsonLd) }} />

      <header className="flex flex-col gap-3">
        <p className="text-micro font-bold text-arang-500">{TIPE[area.tipe ?? ""] ?? "Area"}</p>
        <h1 className="text-display text-arang-900">{area.seo_judul ?? `Kos di ${nama}`}</h1>
        {area.deskripsi && <p className="max-w-2xl text-body text-arang-900">{area.deskripsi}</p>}
        <div className="flex flex-wrap gap-3">
          <Link href={hrefCari({ area: slug })} className={buttonClasses({ variant: "primary" })}>
            Lihat {statistik.jumlah_kos} kos di {nama}
          </Link>
          <Link href={hrefCari({ area: slug, harga_max: 1_200_000, urut: "termurah" })} className={buttonClasses({ variant: "secondary" })}>
            Yang hemat dulu
          </Link>
        </div>
      </header>

      <FaktaArea s={statistik} nama={nama} />

      {/* A taste, not the whole catalogue: the full list lives on /cari with
          filters and the map. Keeps the page short on phones. */}
      <section aria-labelledby="daftar-kos">
        <div className="flex items-end justify-between gap-4">
          <h2 id="daftar-kos" className="text-h2 text-arang-900">Kos di {nama}</h2>
          <Link href={hrefCari({ area: slug })} className="shrink-0 rounded-sm text-small font-bold text-biru-600 hover:underline">
            Filter dan peta
          </Link>
        </div>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kos.slice(0, CUPLIKAN).map((k, i) => (
            <li key={k.id}><KosCard kos={k} sekarang={sekarang} prioritas={i < 3} /></li>
          ))}
        </ul>
        {kos.length > CUPLIKAN && (
          <div className="mt-4 flex justify-center">
            <Link href={hrefCari({ area: slug })} className={buttonClasses({ variant: "secondary" })}>
              Lihat semua {statistik.jumlah_kos} kos di {nama}
            </Link>
          </div>
        )}
      </section>

      <FaqArea faq={faq} />

      {tetangga.length > 0 && (
        <section aria-labelledby="dekat-sini">
          <h2 id="dekat-sini" className="text-h2 text-arang-900">Kos dekat sini juga</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {tetangga.map((t) => (
              <li key={t.slug}>
                <Link href={`/area/${t.slug}`} className="flex h-full flex-col gap-1 rounded-2xl border border-biru-100 bg-putih p-4 transition-colors duration-150 ease-out hover:border-biru-500">
                  <span className="text-micro text-arang-500">{TIPE[t.tipe] ?? "Area"}, {formatJarak(t.jarak_m)} dari sini</span>
                  <span className="text-body font-bold text-arang-900">{t.nama}</span>
                  <span className="text-small text-arang-500">{t.jumlah_kos} kos disurvei</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
