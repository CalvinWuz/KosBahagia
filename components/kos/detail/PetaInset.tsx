"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibre, Marker, NavigationControl, LngLatBounds, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// The real streets behind the illustrated route: the kos, the landmark
// when we know it, and a straight dashed line between them. OpenFreeMap
// tiles, no key. Loaded only after "Lihat peta asli" is tapped.
const STYLE = "https://tiles.openfreemap.org/styles/positron";
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

function token(nama: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return v || "black";
}

function pinKos(warna: string, putih: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = `<svg width="36" height="44" viewBox="-21 -46 42 56" aria-hidden="true"><path d="M0 8c-14-14-21-25-21-35a21 21 0 0 1 42 0c0 10-7 21-21 35z" fill="${warna}" stroke="${putih}" stroke-width="2"/><path d="M-10-24l10-8 10 8v11h-20z" fill="${putih}"/></svg>`;
  el.style.transform = "translateY(-6px)";
  return el;
}

export default function PetaInset({ kos, landmark, namaLandmark }: { kos: { lat: number; lng: number }; landmark: { lat: number; lng: number } | null; namaLandmark?: string | null }) {
  const wadah = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"memuat" | "siap" | "gagal">("memuat");
  const [percobaan, setPercobaan] = useState(0);

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const biru = token("--color-biru-500");
    const biruTua = token("--color-biru-600");
    const putih = token("--color-putih");
    const map = new MapLibre({ container: el, style: STYLE, center: [kos.lng, kos.lat], zoom: 15, attributionControl: { compact: true } });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const raf = requestAnimationFrame(() => map.resize());
    let dimuat = false;
    const batasWaktu = window.setTimeout(() => !dimuat && setStatus("gagal"), 12_000);
    map.on("error", () => !dimuat && setStatus("gagal"));

    map.on("load", () => {
      dimuat = true;
      window.clearTimeout(batasWaktu);
      setStatus("siap");
      new Marker({ element: pinKos(biru, putih), anchor: "bottom" }).setLngLat([kos.lng, kos.lat]).addTo(map);
      if (landmark) {
        new Marker({ color: biruTua }).setLngLat([landmark.lng, landmark.lat]).addTo(map);
        map.addSource("garis", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[landmark.lng, landmark.lat], [kos.lng, kos.lat]] } },
        });
        map.addLayer({ id: "garis", type: "line", source: "garis", paint: { "line-color": biruTua, "line-width": 2.5, "line-dasharray": [2, 2] } });
        const b = new LngLatBounds([landmark.lng, landmark.lat], [landmark.lng, landmark.lat]).extend([kos.lng, kos.lat]);
        map.fitBounds(b, { padding: 48, maxZoom: 16, duration: 0 });
      }
      map.resize();
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(batasWaktu);
      map.remove();
    };
  }, [kos.lat, kos.lng, landmark, percobaan]);

  return (
    <div className="relative">
      <div ref={wadah} className="h-64 w-full rounded-2xl bg-biru-100" role="region" aria-label={`Peta lokasi kos${namaLandmark ? ` dan ${namaLandmark}` : ""}`} />
      {status === "memuat" && (
        <p className="pointer-events-none absolute top-2 left-2 rounded-full bg-putih/90 px-2.5 py-1 text-micro text-arang-900 shadow-sm" role="status">Memuat peta…</p>
      )}
      {status === "gagal" && (
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-biru-100 p-4" role="alert">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-small font-bold text-arang-900">Peta tidak bisa dimuat. Periksa koneksi.</p>
            <button
              type="button"
              onClick={() => {
                setStatus("memuat");
                setPercobaan((n) => n + 1);
              }}
              className="inline-flex h-11 items-center rounded-xl border-2 border-biru-500 bg-putih px-4 text-small font-bold text-biru-600 hover:bg-biru-100"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}
      {landmark && namaLandmark && status === "siap" && (
        <p className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-putih/90 px-2.5 py-1 text-micro text-arang-900 shadow-sm">
          Garis putus-putus: arah lurus dari {namaLandmark.split(" (")[0]}, bukan rute jalan
        </p>
      )}
    </div>
  );
}
