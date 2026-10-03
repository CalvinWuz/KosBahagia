"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FotoBlur } from "@/components/ui/FotoBlur";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusTaut } from "@/components/ui/StatusTaut";
import { IconBanding, IconDaun, IconHati, IconSuara } from "@/components/ui/Icon";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/cn";
import { formatJarak, formatRupiah, formatRupiahRingkas } from "@/lib/format";
import { bacaKamar, hitungBiaya, komponenSingkat, labelTotal } from "@/lib/biaya";
import { statusKamar } from "@/lib/kamar";
import { chipKebersihan, chipKedap } from "@/lib/skala";
import { adalahIlustrasi } from "@/lib/media";
import { gantiBanding, hapusBanding, samaKandidat, tambahBanding, toggleSimpan, useBanding, useSimpanan, type RingkasanKos } from "@/lib/simpan";
import { tampilkanToast } from "@/lib/toast";
import { SkorBadge } from "./SkorBadge";

const Sheet = dynamic(() => import("@/components/ui/Sheet").then((m) => m.Sheet));

export type KosKartu = Database["public"]["Views"]["kos_kartu"]["Row"];

/** The fields a card needs; satisfied by kos_kartu, cari_kos_v3 and kos_promosi rows alike. */
export type KosRingkas = Pick<
  KosKartu,
  | "id" | "slug" | "nama" | "tipe" | "tier" | "harga_bulanan" | "total_bulanan"
  | "kamar" | "kamar_id" | "kamar_nama" | "kamar_acuan_tersedia" | "kamar_acuan_total" | "jumlah_tipe_kamar"
  | "kamar_tersedia" | "skor" | "skor_kebersihan" | "skor_kedap" | "jumlah_red_flags"
  | "foto_url" | "foto_blurhash" | "ketersediaan_dikonfirmasi_pada" | "perlu_dikonfirmasi"
  | "landmark_nama" | "landmark_menit_jalan" | "ada_360"
>;

/** Where distances on this card are measured to. */
export type AcuanJarak = { nama: string; meter: number };

const TIPE_LABEL: Record<string, string> = { putra: "Putra", putri: "Putri", campur: "Campur" };

// Card used in rails, search results and saved/compare pages.
// Product rule 1: the headline is the room's real monthly total; rent sits
// below in micro grey. Price, room name and vacancy all describe the SAME
// room type (the one shown), so a full room never borrows another room's
// vacancy. The photo and title link to the detail page (stretched link); the
// save and compare buttons sit above that link.
export function KosCard({
  kos,
  sekarang = new Date(),
  prioritas = false,
  ringkas = false,
  jarak,
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
  /** Straight-line distance to the search centre (campus/station searches). */
  jarak?: AcuanJarak;
  /** Pointer enters/leaves the card; the map pin follows. */
  onSorot?: (id: string | null) => void;
  className?: string;
}) {
  const id = kos.id ?? kos.slug ?? "";
  const kamar = bacaKamar(kos.kamar);
  const biaya = kamar ? hitungBiaya(kamar) : null;
  const total = biaya?.total ?? kos.total_bulanan ?? 0;
  const status = statusKamar({ kamar_tersedia: kos.kamar_acuan_tersedia, total_kamar: kos.kamar_acuan_total }, kos.ketersediaan_dikonfirmasi_pada, sekarang);
  const tipeLain = Math.max(0, (kos.jumlah_tipe_kamar ?? 1) - 1);
  const penuh = status.status === "penuh";
  const redFlags = kos.jumlah_red_flags ?? 0;
  const bersih = chipKebersihan(kos.skor_kebersihan);
  const kedap = chipKedap(kos.skor_kedap);
  const href = kos.kamar_id ? `/kos/${kos.slug}?kamar=${kos.kamar_id}` : `/kos/${kos.slug}`;
  // A walking time is only comparable when it is to the place the renter searched for.
  const landmarkSama = jarak && kos.landmark_nama && namaSama(kos.landmark_nama, jarak.nama);

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
            alt={adalahIlustrasi(kos.foto_url) ? `Ilustrasi contoh tampak depan ${kos.nama}` : `Foto ${kos.nama}`}
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
            {kos.tier && kos.tier !== "free" && (
              <div className="absolute top-2 right-2">
                <Badge tone="netral" className="bg-putih shadow-sm" title="Pemilik membayar paket untuk foto dan tur 360°. Skor tidak terpengaruh.">
                  Mitra berbayar
                </Badge>
              </div>
            )}
            {adalahIlustrasi(kos.foto_url) && (
              <span className="absolute right-2 bottom-2 rounded-md bg-arang-900/70 px-1.5 py-0.5 text-micro text-putih">Ilustrasi</span>
            )}
          </>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", ringkas ? "p-3" : "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-body leading-5 font-bold text-arang-900">
            <Link
              href={href}
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

        {jarak ? (
          <p className="text-small text-arang-500">
            {landmarkSama && kos.landmark_menit_jalan != null
              ? `${kos.landmark_menit_jalan} mnt jalan ke ${jarak.nama}`
              : `${formatJarak(jarak.meter)} ke ${jarak.nama} (garis lurus)`}
          </p>
        ) : (
          kos.landmark_nama && kos.landmark_menit_jalan != null && (
            <p className="text-small text-arang-500">{kos.landmark_menit_jalan} mnt jalan ke {kos.landmark_nama}</p>
          )
        )}

        <p className={cn("text-arang-900 tabular-nums", ringkas ? "text-h2" : "mt-1 text-price")}>
          {formatRupiah(total)}
          <span className="ml-1 text-small font-normal text-arang-500">/bln</span>
        </p>
        {biaya && (!biaya.lengkap || biaya.estimasi) && (
          <p className="text-micro font-bold text-arang-900">
            {biaya.lengkap ? labelTotal(biaya) : `${labelTotal(biaya)}: ${biaya.belumDiketahui.join(", ").toLowerCase()} belum diketahui`}
          </p>
        )}
        <p className="text-micro text-arang-500">
          sewa {formatRupiahRingkas(kos.harga_bulanan ?? 0)}
          {biaya && komponenSingkat(biaya).length > 0 && ` + ${komponenSingkat(biaya).join(" + ")}`}
        </p>
        {kos.kamar_nama && (
          <p className="text-micro text-arang-500">
            Kamar {kos.kamar_nama}
            {tipeLain > 0 && `, ada ${tipeLain} tipe lain`}
          </p>
        )}

        {!ringkas && (bersih || kedap || redFlags > 0) && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {bersih && (
              <li className="inline-flex items-center gap-1 rounded-full bg-daun-100 px-2 py-0.5 text-micro font-bold text-daun-700">
                <IconDaun className="size-3.5" />
                {bersih}
              </li>
            )}
            {kedap && (
              <li className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-bold", kedap.baik ? "bg-daun-100 text-daun-700" : "bg-arang-500/10 text-arang-900")}>
                <IconSuara className="size-3.5" />
                {kedap.kata}
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
            <StatusRingkas status={status} />
          </div>
          {!ringkas && (
            <AksiKartu
              kos={{
                id,
                slug: kos.slug ?? "",
                nama: kos.nama ?? "",
                kamarId: kos.kamar_id,
                kamarNama: kos.kamar_nama,
                total_bulanan: total,
                kamar_tersedia: kos.kamar_acuan_tersedia,
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function namaSama(a: string, b: string): boolean {
  const n = (s: string) => s.split(" (")[0].trim().toLowerCase();
  return n(a) === n(b) || n(a).startsWith(n(b)) || n(b).startsWith(n(a));
}

/** Room-level status in words (never colour alone). */
export function StatusRingkas({ status }: { status: ReturnType<typeof statusKamar> }) {
  if (status.status === "belum_dikonfirmasi") {
    return (
      <>
        <Badge tone="peringatan">Belum dikonfirmasi</Badge>
        <p className="text-micro text-arang-500">{status.rincian}</p>
      </>
    );
  }
  return (
    <>
      <p className={cn("text-micro font-bold", status.status === "penuh" ? "text-merah-700" : "text-daun-700")}>
        {status.status === "penuh" ? "Penuh" : status.tersedia <= 2 ? `Tersedia, sisa ${status.tersedia} kamar` : `Tersedia ${status.tersedia} kamar`}
      </p>
      <p className="text-micro text-arang-500">{status.waktu.replace(/ \(.*\)$/, "").replace(/^d/, "D")}</p>
    </>
  );
}

// Save + compare. Stored on this device only (no login wall); sits above the
// stretched link. The compare candidate is the kos AND the room type in view.
// A fourth candidate asks which of the three to drop instead of refusing.
export function AksiKartu({ kos }: { kos: RingkasanKos }) {
  const tersimpan = useSimpanan().some((s) => s.id === kos.id);
  const banding = useBanding();
  const kandidat = { id: kos.id, kamarId: kos.kamarId ?? null };
  const dibanding = banding.some((b) => samaKandidat(b, kandidat));
  const [tanyaGanti, setTanyaGanti] = useState(false);
  const namaPenuh = kos.kamarNama ? `${kos.nama}, kamar ${kos.kamarNama}` : kos.nama;

  const kelas =
    "sentuh relative z-10 grid size-9 place-items-center rounded-full border border-biru-100 bg-putih text-arang-500 transition-colors duration-150 ease-out hover:border-biru-500 hover:text-biru-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500 aria-pressed:border-biru-500 aria-pressed:bg-biru-100 aria-pressed:text-biru-600";

  const klikSimpan = () => {
    toggleSimpan(kos);
    if (tersimpan) tampilkanToast({ teks: `${kos.nama} dihapus dari simpanan di perangkat ini.` });
    else tampilkanToast({ teks: `${kos.nama} tersimpan di perangkat ini.`, aksi: { label: "Lihat simpanan", href: "/disimpan" } });
  };
  const klikBanding = () => {
    if (dibanding) {
      hapusBanding(kandidat);
      tampilkanToast({ teks: `${namaPenuh} dikeluarkan dari perbandingan.` });
      return;
    }
    if (!tambahBanding(kos)) return setTanyaGanti(true);
    const n = banding.length + 1;
    tampilkanToast({
      teks: n === 1 ? `${namaPenuh} ditambahkan. Pilih 1–2 lagi untuk dibandingkan.` : `${namaPenuh} ditambahkan ke perbandingan (${n} dari 3).`,
      aksi: n >= 2 ? { label: "Bandingkan", href: "/banding" } : undefined,
    });
  };

  return (
    <div className="flex shrink-0 gap-2">
      <button type="button" aria-pressed={tersimpan} aria-label={tersimpan ? `Hapus ${kos.nama} dari simpanan` : `Simpan ${kos.nama}`} onClick={klikSimpan} className={kelas}>
        <IconHati className={cn("size-4", tersimpan && "fill-current")} />
      </button>
      <button
        type="button"
        aria-pressed={dibanding}
        aria-label={dibanding ? `Keluarkan ${namaPenuh} dari perbandingan` : `Bandingkan ${namaPenuh}`}
        onClick={klikBanding}
        className={kelas}
      >
        <IconBanding className="size-4" />
      </button>

      {tanyaGanti && (
        <Sheet open={tanyaGanti} onClose={() => setTanyaGanti(false)} title="Sudah 3 pilihan dibandingkan">
          <p className="text-body text-arang-900">Ganti yang mana dengan {namaPenuh}?</p>
          <ul className="mt-3 flex flex-col gap-2">
            {banding.map((b) => (
              <li key={`${b.id}:${b.kamarId ?? ""}`}>
                <Button
                  variant="secondary"
                  className="w-full justify-between"
                  onClick={() => {
                    gantiBanding(b, kos);
                    setTanyaGanti(false);
                    tampilkanToast({ teks: `${namaPenuh} masuk perbandingan.`, aksi: { label: "Bandingkan", href: "/banding" } });
                  }}
                >
                  <span className="truncate">
                    {b.nama || "Kos"}
                    {b.kamarNama ? `, ${b.kamarNama}` : ""}
                  </span>
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
        <Skeleton className="h-3 w-2/5" />
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex items-end justify-between pt-2">
          <Skeleton className="h-3 w-28" />
          <div className="flex gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
