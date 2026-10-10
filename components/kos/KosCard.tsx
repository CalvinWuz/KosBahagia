"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FotoBlur } from "@/components/ui/FotoBlur";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusTaut } from "@/components/ui/StatusTaut";
import { IconBanding, IconCheck, IconDaun, IconHati, IconPin, IconSuara } from "@/components/ui/Icon";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/cn";
import { formatJarak, formatRupiah, formatRupiahRingkas, formatSkala } from "@/lib/format";
import { bacaKamar, hitungBiaya, labelTotal, teksKomponen } from "@/lib/biaya";
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
// Product rule 1: the headline is the room's real monthly total; what it is
// made of sits right under it. Price, room name and vacancy all describe the
// SAME room type (the one shown), so a full room never borrows another
// room's vacancy. Reading order (UX v3): photo and name, monthly total,
// place and who it is for, the room's status, short evidence, then labelled
// Simpan / Bandingkan. The title is a stretched link to the detail page; the
// buttons sit above it, so pressing them never opens the page.
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
  const lokasi = jarak
    ? landmarkSama && kos.landmark_menit_jalan != null
      ? `${kos.landmark_menit_jalan} mnt jalan kaki ke ${jarak.nama}`
      : `${formatJarak(jarak.meter)} garis lurus ke ${jarak.nama}`
    : kos.landmark_nama && kos.landmark_menit_jalan != null
      ? `${kos.landmark_menit_jalan} mnt jalan kaki ke ${kos.landmark_nama}`
      : null;
  const aksi: RingkasanKos = {
    id,
    slug: kos.slug ?? "",
    nama: kos.nama ?? "",
    kamarId: kos.kamar_id,
    kamarNama: kos.kamar_nama,
    total_bulanan: total,
    kamar_tersedia: kos.kamar_acuan_tersedia,
  };

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
      <div className={cn("relative shrink-0 bg-biru-100", ringkas ? "w-28 self-stretch" : "aspect-[16/10] w-full sm:aspect-[4/3]")}>
        {kos.foto_url && (
          <FotoBlur
            src={kos.foto_url}
            alt={adalahIlustrasi(kos.foto_url) ? `Ilustrasi contoh tampak depan ${kos.nama}` : `Foto ${kos.nama}`}
            blurhash={kos.foto_blurhash}
            fill
            sizes={ringkas ? "112px" : "(min-width: 1024px) 340px, (min-width: 640px) 50vw, 90vw"}
            className="object-cover"
            priority={prioritas}
            loading={prioritas ? undefined : "lazy"}
          />
        )}
        {!ringkas && (
          <>
            {/* One wrapping row, so the badges never sit on top of each other on a narrow card. */}
            <div className="absolute inset-x-2 top-2 flex flex-wrap items-start justify-between gap-1">
              <div className="flex flex-wrap gap-1">
                <SkorBadge skor={kos.skor} label className="shadow-sm" />
                {kos.ada_360 && <Badge tone="netral" className="bg-putih shadow-sm">360°</Badge>}
              </div>
              {kos.tier && kos.tier !== "free" && (
                <Badge tone="netral" className="bg-putih shadow-sm" title="Pemilik membayar paket untuk foto dan tur 360°. Skor tidak terpengaruh.">
                  Mitra berbayar
                </Badge>
              )}
            </div>
            {adalahIlustrasi(kos.foto_url) && (
              <span className="absolute right-2 bottom-2 rounded-md bg-arang-900/70 px-1.5 py-0.5 text-micro text-putih">Ilustrasi</span>
            )}
          </>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", ringkas ? "gap-1.5 p-3" : "gap-3 p-4")}>
        {/* 1. name (stretched link to the detail page, room included) */}
        <h3 className="min-w-0 text-body leading-5 font-bold text-arang-900">
          <Link
            href={href}
            transitionTypes={["maju"]}
            className="line-clamp-2 rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-biru-500"
          >
            {kos.nama}
            <StatusTaut selubung />
          </Link>
        </h3>

        {/* 2. the monthly total and what it is made of */}
        <div>
          {/* wrap-anywhere: with enlarged text a long price breaks instead of widening the page. */}
          <p className={cn("text-arang-900 tabular-nums wrap-anywhere", ringkas ? "text-h2" : "text-price")}>
            {formatRupiah(total)}
            <span className="ml-1 text-small font-normal text-arang-500">/bln</span>
          </p>
          <p className="text-micro text-arang-500">
            <b className="font-bold text-arang-900">{biaya ? labelTotal(biaya) : "Total per bulan"}</b>
            {!ringkas && biaya && `: ${teksKomponen(biaya, { sewa: `sewa ${formatRupiahRingkas(kos.harga_bulanan ?? 0)}`, termasuk: false })}`}
          </p>
          {biaya && !biaya.lengkap && (
            <p className="text-micro font-bold text-merah-700">{biaya.belumDiketahui.join(" dan ")} belum diketahui</p>
          )}
        </div>

        {/* 3. where and who for */}
        {!ringkas && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-arang-500">
            <span className="rounded-md bg-kertas-50 px-1.5 py-0.5 text-micro font-bold text-arang-900">{TIPE_LABEL[kos.tipe ?? ""] ?? kos.tipe}</span>
            {lokasi && (
              <span className="inline-flex min-w-0 items-start gap-1">
                <IconPin className="mt-0.5 size-4 shrink-0 text-biru-600" />
                {lokasi}
              </span>
            )}
          </div>
        )}

        {/* 4. the shown room and its status */}
        <div className="flex flex-col gap-0.5">
          {kos.kamar_nama && (
            <p className="text-small text-arang-900">
              Kamar {kos.kamar_nama}
              {tipeLain > 0 && <span className="text-arang-500">, ada {tipeLain} tipe lain</span>}
            </p>
          )}
          <StatusRingkas status={status} />
        </div>

        {/* 5. short evidence; safety notes always shown */}
        {!ringkas && (bersih || kedap || redFlags > 0) && (
          <ul className="flex flex-wrap gap-1.5">
            {bersih && kos.skor_kebersihan != null && (
              <li className="inline-flex items-center gap-1 rounded-full bg-daun-100 px-2 py-0.5 text-micro font-bold text-daun-700">
                <IconDaun className="size-3.5" />
                {bersih} {formatSkala(kos.skor_kebersihan)}/5
              </li>
            )}
            {kedap && kos.skor_kedap != null && (
              <li className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-bold", kedap.baik ? "bg-daun-100 text-daun-700" : "bg-arang-500/10 text-arang-900")}>
                <IconSuara className="size-3.5" />
                {kedap.kata} {formatSkala(kos.skor_kedap)}/5
              </li>
            )}
            {redFlags > 0 && (
              <li className="inline-flex items-center rounded-full bg-merah-100 px-2 py-0.5 text-micro font-bold text-merah-700">
                {redFlags} catatan keselamatan
              </li>
            )}
          </ul>
        )}

        {/* 6. labelled actions */}
        <div className={ringkas ? "" : "mt-auto"}>
          <AksiKartu kos={aksi} tampilan={ringkas ? "ringkas" : "kartu"} />
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

export type TampilanAksi = "kartu" | "judul" | "tumpuk" | "ringkas";

const KELAS_AKSI: Record<TampilanAksi, { wadah: string; tombol: string; ikon: string }> = {
  // Result cards: two equal buttons across the card; they stack instead of
  // overflowing when text is enlarged (200 %).
  kartu: { wadah: "grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2", tombol: "min-h-11 justify-center gap-1.5 rounded-xl px-2 text-small", ikon: "size-4" },
  // Detail title: side by side, wide enough for the longer state label.
  judul: { wadah: "flex flex-wrap gap-2", tombol: "h-11 min-w-36 justify-center gap-2 rounded-xl px-4 text-small", ikon: "size-5" },
  // Mobile detail header: icon over a short label.
  tumpuk: { wadah: "flex gap-1", tombol: "h-12 min-w-14 flex-col justify-center gap-0.5 rounded-xl px-1.5 text-micro", ikon: "size-5" },
  // Map mini card.
  ringkas: { wadah: "flex flex-wrap gap-2", tombol: "sentuh h-9 gap-1 rounded-full px-3 text-micro", ikon: "size-4" },
};

// Save + compare with visible labels (UX v3: icons alone were not
// recognised). The word says the state ("Tersimpan", "Dalam banding"); the
// filled icon, the tint and aria-pressed back it up. Stored on this device
// only (no login wall); sits above the card's stretched link. The compare
// candidate is the kos AND the room type in view. A fourth candidate asks
// which of the three to drop instead of refusing.
export function AksiKartu({ kos, tampilan = "kartu", className }: { kos: RingkasanKos; tampilan?: TampilanAksi; className?: string }) {
  const tersimpan = useSimpanan().some((s) => s.id === kos.id);
  const banding = useBanding();
  const kandidat = { id: kos.id, kamarId: kos.kamarId ?? null };
  const dibanding = banding.some((b) => samaKandidat(b, kandidat));
  const [tanyaGanti, setTanyaGanti] = useState(false);
  const namaPenuh = kos.kamarNama ? `${kos.nama}, kamar ${kos.kamarNama}` : kos.nama;
  const k = KELAS_AKSI[tampilan];

  const kelas = cn(
    "relative z-10 inline-flex items-center border font-bold transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500",
    tampilan === "kartu" ? "text-center" : "whitespace-nowrap",
    "border-biru-100 bg-putih text-biru-600 hover:border-biru-500 hover:bg-biru-100/50",
    "aria-pressed:border-biru-500 aria-pressed:bg-biru-100 aria-pressed:text-biru-600",
    k.tombol,
  );

  const klikSimpan = () => {
    toggleSimpan(kos);
    if (tersimpan) tampilkanToast({ teks: `${kos.nama} dihapus dari simpanan.` });
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
      teks: n === 1 ? `${namaPenuh} masuk perbandingan. Tambah 1–2 kos lagi untuk dibandingkan.` : `${namaPenuh} masuk perbandingan (${n} dari 3).`,
      aksi: n >= 2 ? { label: "Bandingkan", href: "/banding" } : undefined,
    });
  };

  return (
    <div className={cn(k.wadah, className)}>
      <button
        type="button"
        aria-pressed={tersimpan}
        aria-label={tersimpan ? `Tersimpan: ${kos.nama}. Tekan untuk menghapus dari simpanan` : `Simpan ${kos.nama}`}
        onClick={klikSimpan}
        className={kelas}
      >
        <IconHati className={cn(k.ikon, "shrink-0", tersimpan && "fill-current")} />
        {tersimpan ? "Tersimpan" : "Simpan"}
      </button>
      <button
        type="button"
        aria-pressed={dibanding}
        aria-label={dibanding ? `Dalam banding: ${namaPenuh}. Tekan untuk mengeluarkan dari perbandingan` : `Bandingkan ${namaPenuh}`}
        onClick={klikBanding}
        className={kelas}
      >
        {dibanding ? <IconCheck className={cn(k.ikon, "shrink-0")} /> : <IconBanding className={cn(k.ikon, "shrink-0")} />}
        {dibanding ? "Dalam banding" : "Bandingkan"}
      </button>

      {tanyaGanti && (
        <Sheet open={tanyaGanti} onClose={() => setTanyaGanti(false)} title="Sudah 3 pilihan dibandingkan">
          <p className="text-body text-arang-900">Perbandingan paling banyak 3 kos. Ganti yang mana dengan {namaPenuh}?</p>
          <ul className="mt-3 flex flex-col gap-2">
            {banding.map((b) => (
              <li key={`${b.id}:${b.kamarId ?? ""}`}>
                <Button
                  variant="secondary"
                  bungkus
                  className="w-full justify-between"
                  onClick={() => {
                    gantiBanding(b, kos);
                    setTanyaGanti(false);
                    tampilkanToast({ teks: `${namaPenuh} masuk perbandingan menggantikan ${b.nama || "kos sebelumnya"}.`, aksi: { label: "Bandingkan", href: "/banding" } });
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
          <Button variant="ghost" bungkus className="mt-3" onClick={() => setTanyaGanti(false)}>
            Batal, biarkan yang tiga
          </Button>
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
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-5 w-3/5" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-2/5" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-2">
          <Skeleton className="h-11 rounded-xl" />
          <Skeleton className="h-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
