"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Chip } from "@/components/ui/Chip";
import { IconClose } from "@/components/ui/Icon";
import { useLapisRiwayat } from "@/lib/navigasi";
import { formatUkuran } from "@/lib/format";
import { cn } from "@/lib/cn";
import { buatMesin, type Kamera, type Mesin } from "./mesin";
import type { Hotspot, TitikTur } from "./jenis";

const RAD = Math.PI / 180;
const FOV_MIN = 35 * RAD;
const FOV_MAKS = 100 * RAD;
const PITCH_MAKS = 85 * RAD;

type Props = {
  titik: TitikTur[];
  awalId: string;
  fotoCadangan: Array<{ url: string; keterangan: string | null }>;
  onClose: () => void;
};

type Status = "pratinjau" | "penuh" | "siap" | "gagal";

// Loaded only after the user taps "Lihat 360°". Preview (2048 px) first,
// then the full file once it arrives and fits the GPU's texture limit.
export default function Tur360({ titik, awalId, fotoCadangan, onClose }: Props) {
  // Phone back button closes the viewer, not the page.
  useLapisRiwayat({ open: true, onClose });
  const [didukung] = useState(() => {
    try {
      const c = document.createElement("canvas");
      return Boolean(c.getContext("webgl") ?? c.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  });
  const [aktifId, setAktifId] = useState(awalId);
  const [status, setStatus] = useState<Status>("pratinjau");
  const [gagalMesin, setGagalMesin] = useState(false);
  const [gyro, setGyro] = useState(false);
  const [percobaan, setPercobaan] = useState(0);
  const [pernahGerak, setPernahGerak] = useState(false);
  const [posisi, setPosisi] = useState<Array<{ h: Hotspot; x: number; y: number }>>([]);

  const wadah = useRef<HTMLDivElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  const mesin = useRef<Mesin | null>(null);
  const kamera = useRef<Kamera>({
    yaw: (() => {
      const pertama = titik.find((t) => t.id === awalId)?.hotspot[0];
      return pertama ? -(pertama.yaw - 15) * RAD : 0;
    })(),
    pitch: 0,
    fov: 75 * RAD,
  });
  const frame = useRef(0);
  const jari = useRef(new Map<number, { x: number; y: number }>());
  const jarakPinch = useRef(0);

  const aktif = titik.find((t) => t.id === aktifId) ?? titik[0];
  const cadangan = !didukung || gagalMesin || status === "gagal";

  const gambar = useCallback(() => {
    const m = mesin.current;
    if (!m) return;
    m.gambar(kamera.current);
    const k = kamera.current;
    setPosisi(
      (aktif?.hotspot ?? [])
        .map((h) => {
          const p = m.proyeksi(k, h.yaw, h.pitch);
          return p ? { h, x: p.x, y: p.y } : null;
        })
        .filter((x): x is { h: Hotspot; x: number; y: number } => x !== null),
    );
  }, [aktif]);

  const jadwal = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      gambar();
    });
  }, [gambar]);

  // Load the active point: preview, draw, then the full version.
  useEffect(() => {
    if (!didukung || !aktif) return;
    let batal = false;
    Promise.resolve().then(async () => {
      const c = kanvas.current;
      if (!c || batal) return;
      const m = mesin.current ?? buatMesin(c);
      if (!m) {
        setGagalMesin(true);
        return;
      }
      mesin.current = m;
      setStatus("pratinjau");
      try {
        await m.muat(aktif.previewUrl);
        if (batal) return;
        setStatus("penuh");
        gambar();
        // Swap in the full file unless the GPU cannot hold it (many phones
        // stop at 4096 px); the preview then stays.
        if (aktif.url !== aktif.previewUrl && aktif.lebar <= m.maksTekstur) {
          await m.muat(aktif.url).catch(() => undefined);
          if (batal) return;
          gambar();
        }
        setStatus("siap");
      } catch {
        if (!batal) setStatus("gagal");
      }
    });
    return () => {
      batal = true;
    };
  }, [aktif, didukung, gambar, percobaan]);

  // Redraw on resize; tear the engine down on unmount.
  useEffect(() => {
    const ro = new ResizeObserver(() => jadwal());
    if (wadah.current) ro.observe(wadah.current);
    return () => {
      ro.disconnect();
      if (frame.current) cancelAnimationFrame(frame.current);
      mesin.current?.hancur();
      mesin.current = null;
    };
  }, [jadwal]);

  // Gyroscope, only while the toggle is on.
  useEffect(() => {
    if (!gyro) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha == null || e.beta == null) return;
      kamera.current.yaw = -e.alpha * RAD;
      kamera.current.pitch = Math.max(-PITCH_MAKS, Math.min(PITCH_MAKS, (e.beta - 90) * RAD));
      jadwal();
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [gyro, jadwal]);

  const toggleGyro = async () => {
    if (gyro) return setGyro(false);
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<"granted" | "denied"> };
    if (typeof DOE?.requestPermission === "function") {
      const izin = await DOE.requestPermission().catch(() => "denied");
      if (izin !== "granted") return;
    }
    setGyro(true);
  };

  // Pointer controls: drag to look, pinch or wheel to zoom.
  // Buttons for people who cannot drag (switch access, screen magnifiers).
  const putar = (yaw: number, pitch = 0) => {
    const k = kamera.current;
    k.yaw += yaw * RAD;
    k.pitch = Math.max(-PITCH_MAKS, Math.min(PITCH_MAKS, k.pitch + pitch * RAD));
    setPernahGerak(true);
    jadwal();
  };
  const zoom = (faktor: number) => {
    const k = kamera.current;
    k.fov = Math.max(FOV_MIN, Math.min(FOV_MAKS, k.fov * faktor));
    setPernahGerak(true);
    jadwal();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setPernahGerak(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    jari.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (jari.current.size === 2) {
      const [a, b] = [...jari.current.values()];
      jarakPinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const sebelum = jari.current.get(e.pointerId);
    if (!sebelum) return;
    jari.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const k = kamera.current;
    if (jari.current.size === 2) {
      const [a, b] = [...jari.current.values()];
      const jarak = Math.hypot(a.x - b.x, a.y - b.y);
      if (jarakPinch.current) k.fov = Math.max(FOV_MIN, Math.min(FOV_MAKS, k.fov * (jarakPinch.current / jarak)));
      jarakPinch.current = jarak;
    } else if (!gyro) {
      const lebar = wadah.current?.clientWidth ?? 1;
      const skala = k.fov / lebar; // one screen width ≈ one field of view
      k.yaw += (e.clientX - sebelum.x) * skala;
      k.pitch = Math.max(-PITCH_MAKS, Math.min(PITCH_MAKS, k.pitch + (e.clientY - sebelum.y) * skala));
    }
    jadwal();
  };
  const onPointerUp = (e: React.PointerEvent) => {
    jari.current.delete(e.pointerId);
    jarakPinch.current = 0;
  };
  const onWheel = (e: React.WheelEvent) => {
    const k = kamera.current;
    k.fov = Math.max(FOV_MIN, Math.min(FOV_MAKS, k.fov * (e.deltaY > 0 ? 1.08 : 0.92)));
    jadwal();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = kamera.current;
    const langkah = 5 * RAD;
    if (e.key === "ArrowLeft") k.yaw += langkah;
    else if (e.key === "ArrowRight") k.yaw -= langkah;
    else if (e.key === "ArrowUp") k.pitch = Math.min(PITCH_MAKS, k.pitch + langkah);
    else if (e.key === "ArrowDown") k.pitch = Math.max(-PITCH_MAKS, k.pitch - langkah);
    else if (e.key === "+" || e.key === "=") k.fov = Math.max(FOV_MIN, k.fov * 0.9);
    else if (e.key === "-") k.fov = Math.min(FOV_MAKS, k.fov * 1.1);
    else return;
    e.preventDefault();
    setPernahGerak(true);
    jadwal();
  };

  // Enter a point facing its first hotspot (slightly off-centre) so the way
  // onward is visible without hunting for it.
  const pindah = (id: string) => {
    const tujuan = titik.find((t) => t.id === id);
    const pertama = tujuan?.hotspot[0];
    kamera.current = { yaw: pertama ? -(pertama.yaw - 15) * RAD : 0, pitch: 0, fov: 75 * RAD };
    setPosisi([]);
    setAktifId(id);
  };

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-arang-900" aria-hidden="true" />
      <div className="fixed inset-0 flex flex-col">
        <DialogPanel className="flex h-full w-full flex-col text-putih">
          <header className="flex items-center justify-between gap-3 px-4 py-3">
            <DialogTitle className="min-w-0 truncate text-small font-bold">
              Tur 360°{aktif ? `: ${aktif.nama}` : ""}
            </DialogTitle>
            <button type="button" onClick={onClose} aria-label="Tutup tur 360°" className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-putih/20 focus-visible:outline-putih">
              <IconClose />
            </button>
          </header>

          {cadangan ? (
            <Cadangan
              foto={fotoCadangan}
              alasan={status === "gagal" ? "Gambar 360° tidak bisa dimuat. Periksa koneksi, lalu coba lagi." : "Perangkat ini tidak mendukung tampilan 360°."}
              onCobaLagi={
                status === "gagal"
                  ? () => {
                      setStatus("pratinjau");
                      setPercobaan((n) => n + 1);
                    }
                  : undefined
              }
            />
          ) : (
            <div
              ref={wadah}
              className="relative min-h-0 flex-1 touch-none select-none overflow-hidden bg-arang-900"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onWheel={onWheel}
              onKeyDown={onKeyDown}
              tabIndex={0}
              role="application"
              aria-label="Panorama 360 derajat. Geser untuk melihat sekeliling, tombol panah untuk memutar, plus dan minus untuk zoom."
            >
              <canvas ref={kanvas} className="h-full w-full cursor-grab active:cursor-grabbing" />
              {posisi.map(({ h, x, y }) => (
                <button
                  key={h.ke}
                  type="button"
                  onClick={() => pindah(h.ke)}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ left: x, top: y }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-putih bg-arang-900/70 px-3 py-1.5 text-small font-bold text-putih shadow-lg backdrop-blur hover:bg-biru-600 focus-visible:outline-putih"
                >
                  {h.label}
                </button>
              ))}
              {!pernahGerak && status !== "pratinjau" && (
                <p className="pointer-events-none absolute bottom-3 left-1/2 w-max max-w-[90%] -translate-x-1/2 rounded-full bg-arang-900/75 px-3 py-1.5 text-center text-small text-putih">
                  Geser untuk melihat sekeliling, atau pakai tombol di bawah
                </p>
              )}
              {status !== "siap" && (
                <p className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-arang-900/70 px-3 py-1 text-micro text-putih" aria-live="polite">
                  {status === "pratinjau" ? "Memuat pratinjau…" : `Memuat versi penuh${aktif?.ukuranBytes ? ` (${formatUkuran(aktif.ukuranBytes)})` : ""}…`}
                </p>
              )}
            </div>
          )}

          <footer className="flex flex-wrap items-center gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {!cadangan && (
              <div className="flex gap-1" role="group" aria-label="Kontrol tampilan">
                <TombolKontrol label="Putar ke kiri" onClick={() => putar(20)}>⟲</TombolKontrol>
                <TombolKontrol label="Putar ke kanan" onClick={() => putar(-20)}>⟳</TombolKontrol>
                <TombolKontrol label="Perbesar" onClick={() => zoom(0.85)}>+</TombolKontrol>
                <TombolKontrol label="Perkecil" onClick={() => zoom(1.18)}>−</TombolKontrol>
              </div>
            )}
            {titik.length > 1 && (
              <ul className="flex flex-wrap gap-2" aria-label="Titik tur">
                {titik.map((t) => (
                  <li key={t.id}>
                    <Chip selected={t.id === aktif?.id} onClick={() => pindah(t.id)} className={cn(t.id !== aktif?.id && "border-putih/40 bg-transparent text-putih hover:bg-putih/10")}>
                      {t.nama}
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
            {!cadangan && typeof window !== "undefined" && "DeviceOrientationEvent" in window && (
              <button
                type="button"
                onClick={toggleGyro}
                aria-pressed={gyro}
                className={cn("ml-auto inline-flex h-9 items-center rounded-full border px-3 text-small font-bold", gyro ? "border-putih bg-putih text-arang-900" : "border-putih/40 text-putih hover:bg-putih/10")}
              >
                {gyro ? "Gerakan HP: aktif" : "Gerakkan dengan HP"}
              </button>
            )}
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function TombolKontrol({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid size-11 place-items-center rounded-full border border-putih/40 text-h2 leading-none text-putih hover:bg-putih/10 focus-visible:outline-putih">
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

// Flat photos when WebGL is unavailable or the panorama failed to load.
function Cadangan({ foto, alasan, onCobaLagi }: { foto: Array<{ url: string; keterangan: string | null }>; alasan: string; onCobaLagi?: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      <p className="mb-3 text-small text-putih/80" role="status">{alasan} Sementara, ini gambar biasa dari kos yang sama.</p>
      {onCobaLagi && (
        <button type="button" onClick={onCobaLagi} className="mb-3 inline-flex h-11 items-center rounded-full border border-putih px-4 text-small font-bold text-putih hover:bg-putih/10">
          Coba muat lagi
        </button>
      )}
      {foto.length === 0 ? (
        <p className="text-small text-putih/80">Belum ada foto lain.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {foto.map((f, i) => (
            <li key={f.url} className="overflow-hidden rounded-2xl bg-biru-100">
              <div className="relative aspect-[4/3]">
                <Image src={f.url} alt={f.keterangan ?? `Foto ${i + 1}`} fill sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" loading={i === 0 ? undefined : "lazy"} />
              </div>
              {f.keterangan && <p className="px-3 py-2 text-micro text-arang-900">{f.keterangan}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
