"use client";

import type { ReactElement } from "react";
import { FotoBlur } from "@/components/ui/FotoBlur";
import Link from "next/link";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/cn";
import { formatRupiah, formatRupiahRingkas, formatWaktuRelatif } from "@/lib/format";
import { gantiBanding, hapusBanding, tambahBanding, toggleSimpan, useBanding, useSimpanan, type RingkasanKos } from "@/lib/simpan";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import dynamic from "next/dynamic";

const Sheet = dynamic(() => import("@/components/ui/Sheet").then((m) => m.Sheet));
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusTaut } from "@/components/ui/StatusTaut";
import { IconBanding, IconDaun, IconHati, IconSuara } from "@/components/ui/Icon";
import { tampilkanToast } from "@/lib/toast";
import { BATAS_BERISIK } from "@/lib/skala";
import { SkorBadge } from "./SkorBadge";

export type KosKartu = Database["public"]["Views"]["kos_kartu"]["Row"];

/** The fields a card needs; satisfied by kos_kartu rows and cari_kos rows alike. */
export type KosRingkas = Pick<
  KosKartu,
  | "id" | "slug" | "nama" | "tipe" | "tier" | "harga_bulanan" | "total_bulanan" | "rincian"
  | "kamar_tersedia" | "skor" | "skor_kebersihan" | "skor_kedap" | "jumlah_red_flags"
  | "foto_url" | "foto_blurhash" | "ketersediaan_dikonfirmasi_pada" | "perlu_dikonfirmasi"
  | "landmark_nama" | "landmark_menit_jalan" | "ada_360"
>;

const TIPE_LABEL: Record<string, string> = { putra: "Putra", putri: "Putri", campur: "Campur" };
type Rincian = { nama: string; jumlah: number };

// Card used in rails, search results and saved/compare pages.
// Product rule 1: the headline is total_bulanan; rent sits below in micro grey.
// The photo and title link to the detail page (stretched link); the save and
// compare buttons sit above that link.
export function KosCard({
  kos,
  sekarang = new Date(),
  prioritas = false,
  ringkas = false,
  onSorot,
  className,
}: {
  kos: KosRingkas;
  /** Injected clock so server and client render the same freshness stamp. */
  sekarang?: Date;
  /** Above the fold → eager image. */
  prioritas?: boolean;
  /** Compact horizontal layout for the map mini card. */
  ringkas?: boolean;
  /** Pointer enters/leaves the card; the map pin follows. */
  onSorot?: (id: string | null) => void;
  className?: string;
}) {
  const id = kos.id ?? kos.slug ?? "";
  const rincian = (Array.isArray(kos.rincian) ? kos.rincian : []) as Rincian[];
  const tambahan = rincian
    .filter((r) => r.nama !== "Sewa")
    .map((r) => r.nama.replace(/ \(estimasi\)$/, "").toLowerCase());
  const tersisa = kos.kamar_tersedia ?? 0;
  const penuh = tersisa === 0;
  const redFlags = kos.jumlah_red_flags ?? 0;
  const kekuatan = [
    kos.skor_kebersihan != null && kos.skor_kebersihan >= 4 && { label: "Bersih", ikon: <IconDaun className="size-3.5" /> },
    kos.skor_kedap != null && kos.skor_kedap >= 4 && { label: "Kedap suara", ikon: <IconSuara className="size-3.5" /> },
  ].filter((x): x is { label: string; ikon: ReactElement } => Boolean(x));
  // Information, not a penalty: a measured low score is worth a word.
  const berisik = kos.skor_kedap != null && kos.skor_kedap < BATAS_BERISIK;

  return (
    <article
      className={cn(
        "relative flex overflow-hidden rounded-2xl border border-biru-100 bg-putih",
        ringkas ? "flex-row" : "h-full flex-col",
        // Full kos step back visually without losing text contrast.
        penuh && "border-arang-500/20 bg-kertas-50 [&_img]:grayscale",
        className,
      )}
      aria-label={kos.nama ?? undefined}
      onMouseEnter={onSorot ? () => onSorot(id) : undefined}
      onMouseLeave={onSorot ? () => onSorot(null) : undefined}
    >
      {/* Phones: a shorter photo so more than one card fits a screen. */}
      <div className={cn("relative shrink-0 bg-biru-100", ringkas ? "w-32 self-stretch" : "aspect-[16/10] w-full sm:aspect-[4/3]")}>
        {kos.foto_url && (
          <FotoBlur
            src={kos.foto_url}
            alt={`Foto ${kos.nama}`}
            blurhash={kos.foto_blurhash}
            fill
            sizes={ringkas ? "128px" : "(min-width: 1024px) 340px, (min-width: 640px) 50vw, 90vw"}
            className="object-cover"
            priority={prioritas}
            loading={prioritas ? undefined : "lazy"}
          />
        )}
        {!ringkas && (
          <>
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              <SkorBadge skor={kos.skor} className="shadow-sm" />
              {kos.ada_360 && <Badge tone="netral" className="bg-putih shadow-sm">360°</Badge>}
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              {kos.tier && kos.tier !== "free" && (
                <Badge tone="netral" className="bg-putih shadow-sm">Mitra</Badge>
              )}
            </div>
          </>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", ringkas ? "p-3" : "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-body leading-5 font-bold text-arang-900">
            <Link
              href={`/kos/${kos.slug}`}
              className="line-clamp-2 rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-biru-500"
            >
              {kos.nama}
              <StatusTaut selubung />
            </Link>
          </h3>
          <span className="shrink-0 rounded-md bg-kertas-50 px-1.5 py-0.5 text-micro text-arang-500">
            {TIPE_LABEL[kos.tipe ?? ""] ?? kos.tipe}
          </span>
        </div>

        {kos.landmark_nama && kos.landmark_menit_jalan != null && (
          <p className="text-small text-arang-500">
            {kos.landmark_menit_jalan} mnt jalan ke {kos.landmark_nama}
          </p>
        )}

        <p className={cn("text-arang-900 tabular-nums", ringkas ? "text-h2" : "mt-1 text-price")}>
          {formatRupiah(kos.total_bulanan ?? 0)}
          <span className="ml-1 text-small font-normal text-arang-500">/bln</span>
        </p>
        <p className="text-micro text-arang-500">
          sewa {formatRupiahRingkas(kos.harga_bulanan ?? 0)}
          {tambahan.length > 0 && ` + ${tambahan.join(" + ")}`}
        </p>

        {!ringkas && (kekuatan.length > 0 || redFlags > 0 || berisik) && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {kekuatan.map((k) => (
              <li key={k.label} className="inline-flex items-center gap-1 rounded-full bg-daun-100 px-2 py-0.5 text-micro font-bold text-daun-700">
                {k.ikon}
                {k.label}
              </li>
            ))}
            {berisik && (
              <li className="inline-flex items-center gap-1 rounded-full bg-arang-500/10 px-2 py-0.5 text-micro font-bold text-arang-900">
                <IconSuara className="size-3.5" />
                Berisik
              </li>
            )}
            {redFlags > 0 && (
              <li className="inline-flex items-center rounded-full bg-merah-100 px-2 py-0.5 text-micro font-bold text-merah-700">
                {redFlags} hal penting
              </li>
            )}
          </ul>
        )}

        <div className={cn("flex items-end justify-between gap-2", ringkas ? "mt-1" : "mt-auto pt-2")}>
          <div className="flex min-w-0 flex-col gap-0.5">
            {penuh ? (
              <p className="text-micro font-bold text-merah-700">Penuh</p>
            ) : tersisa <= 2 ? (
              <p className="text-micro font-bold text-daun-700">Tinggal {tersisa} kamar</p>
            ) : null}
            {kos.perlu_dikonfirmasi ? (
              <Badge tone="peringatan">Perlu dikonfirmasi</Badge>
            ) : (
              kos.ketersediaan_dikonfirmasi_pada && (
                <p className="text-micro text-arang-500">
                  Dikonfirmasi {formatWaktuRelatif(kos.ketersediaan_dikonfirmasi_pada, sekarang)}
                </p>
              )
            )}
          </div>
          {!ringkas && <AksiKartu kos={{ id, slug: kos.slug ?? "", nama: kos.nama ?? "", total_bulanan: kos.total_bulanan, kamar_tersedia: kos.kamar_tersedia }} />}
        </div>
      </div>
    </article>
  );
}

// Save + compare. Local-only (no login wall); sits above the stretched link.
// A fourth compare asks which of the three to drop instead of refusing.
export function AksiKartu({ kos }: { kos: RingkasanKos }) {
  const tersimpan = useSimpanan().some((s) => s.id === kos.id);
  const banding = useBanding();
  const dibanding = banding.some((b) => b.id === kos.id);
  const [tanyaGanti, setTanyaGanti] = useState(false);

  const kelas =
    "relative z-10 grid size-9 place-items-center rounded-full border border-biru-100 bg-putih text-arang-500 transition-colors duration-150 ease-out hover:border-biru-500 hover:text-biru-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500 aria-pressed:border-biru-500 aria-pressed:bg-biru-100 aria-pressed:text-biru-600";

  const klikSimpan = () => {
    toggleSimpan(kos);
    if (tersimpan) tampilkanToast({ teks: "Dihapus dari simpanan." });
    else tampilkanToast({ teks: "Tersimpan di HP ini.", aksi: { label: "Lihat simpanan", href: "/disimpan" } });
  };
  const klikBanding = () => {
    if (dibanding) {
      hapusBanding(kos.id);
      tampilkanToast({ teks: "Dikeluarkan dari perbandingan." });
      return;
    }
    if (!tambahBanding(kos)) return setTanyaGanti(true);
    const n = banding.length + 1;
    tampilkanToast({
      teks: n === 1 ? "Ditambahkan. Pilih 1–2 kos lagi untuk dibandingkan." : `Ditambahkan ke perbandingan (${n} dari 3).`,
      aksi: n >= 2 ? { label: "Bandingkan", href: "/banding" } : undefined,
    });
  };

  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        type="button"
        aria-pressed={tersimpan}
        aria-label={tersimpan ? `Hapus ${kos.nama} dari simpanan` : `Simpan ${kos.nama}`}
        onClick={klikSimpan}
        className={kelas}
      >
        <IconHati className={cn("size-4", tersimpan && "fill-current")} />
      </button>
      <button
        type="button"
        aria-pressed={dibanding}
        aria-label={dibanding ? `Keluarkan ${kos.nama} dari perbandingan` : `Bandingkan ${kos.nama}`}
        onClick={klikBanding}
        className={kelas}
      >
        <IconBanding className="size-4" />
      </button>

      {tanyaGanti && (
      <Sheet open={tanyaGanti} onClose={() => setTanyaGanti(false)} title="Sudah 3 kos dibandingkan">
        <p className="text-body text-arang-900">Ganti yang mana dengan {kos.nama}?</p>
        <ul className="mt-3 flex flex-col gap-2">
          {banding.map((b) => (
            <li key={b.id}>
              <Button
                variant="secondary"
                className="w-full justify-between"
                onClick={() => {
                  gantiBanding(b.id, kos);
                  setTanyaGanti(false);
                  tampilkanToast({ teks: `${kos.nama} masuk perbandingan.`, aksi: { label: "Bandingkan", href: "/banding" } });
                }}
              >
                <span className="truncate">{b.nama || "Kos"}</span>
                <span className="text-small font-medium text-arang-500">Ganti</span>
              </Button>
            </li>
          ))}
        </ul>
      </Sheet>
      )}
    </div>
  );
}

/** Same box as a real card so the list does not shift when data lands. */
export function KosCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-biru-100 bg-putih" aria-hidden="true">
      <Skeleton className="aspect-[16/10] w-full rounded-none sm:aspect-[4/3]" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-1 h-8 w-2/3" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex items-end justify-between pt-2">
          <Skeleton className="h-3 w-28" />
          <div className="flex gap-1.5">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
