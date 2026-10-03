"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button, buttonClasses } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/format";
import { hitungBiaya, labelTotal, type TipeKamar } from "@/lib/biaya";
import type { InfoStatus } from "@/lib/kamar";
import { MODE_DEMO, TEKS_DEMO } from "@/lib/demo";
import { catatKlikWa, labelTombolWa, linkWa, pesanWa, type SumberKlik } from "@/lib/wa";
import { cn } from "@/lib/cn";

const Sheet = dynamic(() => import("@/components/ui/Sheet").then((m) => m.Sheet));

// The one orange button on this page. Outside the prototype it is a plain
// link (works signed out and without JavaScript); the klik_wa row is fired,
// not awaited. In the prototype the owners' numbers are made up, so the
// button shows the prepared message instead of opening WhatsApp.
export function TombolChat({
  kosId,
  namaKos,
  whatsapp,
  kamar,
  status,
  className,
  variant = "primary",
  size = "lg",
  sumber = "detail" as SumberKlik,
}: {
  kosId: string;
  namaKos: string;
  whatsapp: string;
  kamar: TipeKamar | null;
  /** Status of THIS room type; decides the label and the question asked. */
  status?: InfoStatus;
  className?: string;
  /** "secondary" where several kos share a screen (compare table): orange stays singular. */
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  sumber?: SumberKlik;
}) {
  const [buka, setBuka] = useState(false);
  const [disalin, setDisalin] = useState(false);
  const biaya = kamar ? hitungBiaya(kamar) : null;
  const pesan = pesanWa({
    namaKos,
    tipeKamar: kamar?.nama,
    totalBulanan: biaya?.total ?? 0,
    status: status?.status,
    estimasi: biaya?.estimasi,
    belumDiketahui: biaya?.belumDiketahui,
  });
  const label = labelTombolWa(status?.status);
  const aria = `${label}: ${namaKos}${kamar ? `, kamar ${kamar.nama}` : ""}`;

  if (!MODE_DEMO) {
    return (
      <a href={linkWa(whatsapp, pesan)} target="_blank" rel="noopener noreferrer" onClick={() => catatKlikWa(kosId, sumber)} aria-label={`${aria} (WhatsApp, tab baru)`} className={buttonClasses({ variant, size, className })}>
        {label}
      </a>
    );
  }

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(pesan);
      setDisalin(true);
      window.setTimeout(() => setDisalin(false), 2500);
    } catch {
      // Clipboard blocked: the message is on screen to copy by hand.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          catatKlikWa(kosId, sumber);
          setBuka(true);
        }}
        aria-label={aria}
        aria-haspopup="dialog"
        className={buttonClasses({ variant, size, className })}
      >
        {label}
      </button>
      {buka && (
        <Sheet open={buka} onClose={() => setBuka(false)} title={label}>
          <div className="flex flex-col gap-3">
            <p className="text-small text-arang-900">
              Di situs asli, tombol ini membuka WhatsApp pemilik dengan pesan di bawah. Ini prototipe: nomor pemilik adalah data contoh, jadi kami tidak membuka WhatsApp.
            </p>
            <blockquote className="rounded-2xl border border-biru-100 bg-kertas-50 p-4 text-body text-arang-900">{pesan}</blockquote>
            <p className="text-micro text-arang-500">{TEKS_DEMO.penjelasan}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="md" onClick={salin}>{disalin ? "Pesan disalin" : "Salin pesan"}</Button>
              <Button variant="ghost" size="md" onClick={() => setBuka(false)}>Tutup</Button>
            </div>
            <p className="sr-only" aria-live="polite">{disalin ? "Pesan disalin" : ""}</p>
          </div>
        </Sheet>
      )}
    </>
  );
}

// Sticky contact bar. Price, room name and status all describe the selected
// room, so a full AC room never sits next to "4 kamar tersedia".
export function BarAksi({
  kosId,
  namaKos,
  whatsapp,
  kamar,
  status,
  desktop = false,
}: {
  kosId: string;
  namaKos: string;
  whatsapp: string;
  kamar: TipeKamar | null;
  status: InfoStatus | null;
  desktop?: boolean;
}) {
  const biaya = kamar ? hitungBiaya(kamar) : null;
  const total = biaya?.total ?? 0;
  return (
    <div
      className={cn(
        desktop
          ? "rounded-2xl border border-biru-100 bg-putih p-4"
          : "fixed inset-x-0 bottom-0 z-40 border-t border-biru-100 bg-putih px-[max(1rem,env(safe-area-inset-left))] pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
      )}
    >
      <div className={cn("flex items-center gap-3", desktop && "flex-col items-stretch")}>
        <div className="min-w-0 flex-1">
          <p className={cn("text-arang-900 tabular-nums", desktop ? "text-h2" : "text-body font-bold min-[380px]:text-h2")}>
            {formatRupiah(total)}
            <span className="ml-0.5 text-micro font-normal text-arang-500">/bln</span>
          </p>
          <p className="truncate text-micro text-arang-500">
            {biaya ? labelTotal(biaya).toLowerCase() : "total"}
            {kamar ? `, kamar ${kamar.nama}` : ""}
          </p>
          {status && (
            <p className={cn("truncate text-micro font-bold", status.status === "tersedia" ? "text-daun-700" : status.status === "penuh" ? "text-merah-700" : "text-arang-900")}>
              {status.label}
              <span className="font-medium text-arang-500">, {status.rincian.charAt(0).toLowerCase() + status.rincian.slice(1)}</span>
            </p>
          )}
        </div>
        <TombolChat kosId={kosId} namaKos={namaKos} whatsapp={whatsapp} kamar={kamar} status={status ?? undefined} size={desktop ? "lg" : "md"} className="shrink-0" />
      </div>
    </div>
  );
}
