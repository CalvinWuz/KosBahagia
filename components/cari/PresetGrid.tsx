"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import {
  IconBulan,
  IconChevronDown,
  IconDaun,
  IconDompet,
  IconKampus,
  IconPasangan,
  IconShower,
} from "@/components/ui/Icon";
import { hrefCari } from "@/lib/cari-params";
import type { AreaRingkas } from "./PencarianHero";

// Six presets, no more. Each is one tap to a populated /cari.
// "Dekat kampus" is the exception: it asks which campus first.
const PRESET = [
  {
    id: "hemat",
    label: "Hemat buat mahasiswa",
    keterangan: "Total di bawah Rp1,2 juta",
    href: hrefCari({ harga_max: 1_200_000, urut: "termurah" }),
    ikon: <IconDompet />,
  },
  {
    id: "bersih",
    label: "Bersih & tenang",
    keterangan: "Kebersihan dan kedap suara 4 ke atas",
    href: hrefCari({ kebersihan: 4, kedap: 4 }),
    ikon: <IconDaun />,
  },
  {
    id: "pasangan",
    label: "Bawa pasangan",
    keterangan: "Kos yang mengizinkan pasangan",
    href: hrefCari({ pasangan: "boleh" }),
    ikon: <IconPasangan />,
  },
  {
    id: "kampus",
    label: "Dekat kampus",
    keterangan: "Pilih kampus, radius 2 km",
    href: null,
    ikon: <IconKampus />,
  },
  {
    id: "km-dalam",
    label: "Kamar mandi dalam",
    keterangan: "Tidak berbagi kamar mandi",
    href: hrefCari({ fasilitas: ["kamar-mandi-dalam"] }),
    ikon: <IconShower />,
  },
  {
    id: "jam-malam",
    label: "Bebas jam malam",
    keterangan: "Pulang jam berapa pun",
    href: hrefCari({ tanpa_jam_malam: true }),
    ikon: <IconBulan />,
  },
] as const;

export function PresetGrid({ kampus }: { kampus: AreaRingkas[] }) {
  const [bukaKampus, setBukaKampus] = useState(false);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {PRESET.map((p) => (
          <li key={p.id}>
            {p.href ? (
              <KartuPreset href={p.href} ikon={p.ikon} label={p.label} keterangan={p.keterangan} />
            ) : (
              <KartuPreset
                onClick={() => setBukaKampus(true)}
                ikon={p.ikon}
                label={p.label}
                keterangan={p.keterangan}
              />
            )}
          </li>
        ))}
      </ul>

      <Sheet open={bukaKampus} onClose={() => setBukaKampus(false)} title="Kampus mana?">
        {kampus.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-body text-arang-900">Belum ada kampus yang kami survei.</p>
            <Link href={hrefCari({})} className="text-small font-bold text-biru-600 hover:underline">
              Lihat semua kos
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {kampus.map((k) => (
              <li key={k.slug}>
                <Link
                  href={hrefCari({ area: k.slug, radius: 2000 })}
                  className="flex min-h-14 items-center gap-3 rounded-xl border border-biru-100 px-4 py-3 text-body font-bold text-arang-900 transition-colors duration-150 ease-out hover:border-biru-500 hover:bg-biru-100/50"
                >
                  <IconKampus className="size-5 shrink-0 text-biru-600" />
                  {k.nama}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </>
  );
}

// Preset tiles: icon tile top-left, arrow bottom-right that only shows on
// hover/focus. The lift is transform-only so nothing around it reflows.
const kelasKartu =
  "group relative flex h-full min-h-28 w-full flex-col items-start gap-2 rounded-2xl border border-biru-100 bg-putih p-4 text-left shadow-sm shadow-biru-600/5 transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-biru-500 hover:shadow-lg hover:shadow-biru-600/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500 motion-reduce:hover:translate-y-0";

function KartuPreset({
  href,
  onClick,
  ikon,
  label,
  keterangan,
}: {
  href?: string;
  onClick?: () => void;
  ikon: ReactNode;
  label: string;
  keterangan: string;
}) {
  const isi = (
    <>
      <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-biru-100 to-biru-100/40 text-biru-600 ring-1 ring-biru-500/10 ring-inset transition-colors duration-200 group-hover:bg-biru-500 group-hover:from-biru-500 group-hover:to-biru-600 group-hover:text-putih [&>svg]:size-6">
        {ikon}
      </span>
      <span className="text-body leading-5 font-bold text-arang-900">{label}</span>
      <span className="text-micro text-arang-500">{keterangan}</span>
      <IconChevronDown
        aria-hidden="true"
        className="absolute right-3 bottom-3 size-4 -rotate-90 text-biru-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
    </>
  );
  return href ? (
    <Link href={href} transitionTypes={["maju"]} className={kelasKartu}>
      {isi}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={kelasKartu}>
      {isi}
    </button>
  );
}
