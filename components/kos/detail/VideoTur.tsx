"use client";

import { useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import type { Media } from "@/lib/kos/detail";
import { formatUkuran } from "@/lib/format";
import { useLapisRiwayat } from "@/lib/navigasi";
import { useKembalikanFokus } from "@/lib/fokus";
import { IconClose, IconMainkan } from "@/components/ui/Icon";

// The short room tour (premium). A pill on the gallery names its length and
// size; nothing downloads until it is tapped. It plays in a full-screen
// dialog with native controls; the clip has no sound, so it starts muted
// and plays inline. With reduced motion it waits for the play button.

export type Video = { url: string; poster: string | null; detik: number | null; bytes: number | null; keterangan: string | null; lebar: number; tinggi: number };

/** kos_media row (jenis 'video') → what the player needs, or null without a URL. */
export function bacaVideo(m: Media): Video | null {
  if (m.jenis !== "video" || !m.url) return null;
  const t = m.tur && typeof m.tur === "object" && !Array.isArray(m.tur) ? m.tur : {};
  return {
    url: m.url,
    poster: typeof t.poster_url === "string" ? t.poster_url : null,
    detik: typeof t.durasi_detik === "number" ? t.durasi_detik : null,
    bytes: typeof t.ukuran_bytes === "number" ? t.ukuran_bytes : null,
    keterangan: m.keterangan,
    lebar: m.lebar,
    tinggi: m.tinggi,
  };
}

const durasi = (detik: number) => `${Math.floor(detik / 60)}:${String(Math.round(detik % 60)).padStart(2, "0")}`;

export function VideoPemicu({ video }: { video: Video }) {
  const [buka, setBuka] = useState(false);
  const info = [video.detik != null && durasi(video.detik), video.bytes != null && formatUkuran(video.bytes)].filter(Boolean).join(", ");
  return (
    <>
      <button
        type="button"
        onClick={() => setBuka(true)}
        aria-haspopup="dialog"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-putih/95 pr-4 pl-1.5 text-small font-bold text-arang-900 shadow transition-colors duration-150 ease-out hover:bg-putih focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
      >
        <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-biru-500 text-putih">
          <IconMainkan className="size-4" />
        </span>
        Video kamar{info && <span className="font-medium tabular-nums">({info})</span>}
      </button>
      {buka && <PemutarVideo video={video} onClose={() => setBuka(false)} />}
    </>
  );
}

function PemutarVideo({ video, onClose }: { video: Video; onClose: () => void }) {
  useLapisRiwayat({ open: true, onClose });
  useKembalikanFokus(true);
  const [gerak] = useState(() => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const judul = "Video tur kamar";

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-arang-900 transition-opacity duration-200 ease-out data-closed:opacity-0" />
      <div className="fixed inset-0 flex flex-col">
        <DialogPanel transition className="flex h-full w-full flex-col transition-opacity duration-200 ease-out data-closed:opacity-0">
          <header className="flex items-center justify-between gap-3 px-4 py-3 text-putih">
            <DialogTitle className="min-w-0 truncate text-small font-bold">{judul}</DialogTitle>
            <button type="button" onClick={onClose} aria-label="Tutup video" className="grid size-11 shrink-0 place-items-center rounded-full text-putih hover:bg-putih/20 focus-visible:outline-putih">
              <IconClose />
            </button>
          </header>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4">
            <video
              src={video.url}
              poster={video.poster ?? undefined}
              width={video.lebar}
              height={video.tinggi}
              controls
              playsInline
              muted
              autoPlay={gerak}
              preload="metadata"
              aria-describedby="video-tur-keterangan"
              className="h-auto max-h-full w-auto max-w-full rounded-xl bg-arang-900"
            />
          </div>
          <p id="video-tur-keterangan" className="px-4 pt-3 pb-5 text-center text-small text-putih/85">
            {video.keterangan ?? judul}. Tanpa suara.
          </p>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
