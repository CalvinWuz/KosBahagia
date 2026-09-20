"use client";

import { useEffect, useRef } from "react";
import { GeoJSONSource, LngLatBounds, Map as MapLibre, NavigationControl, setWorkerUrl, type MapGeoJSONFeature, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HasilKos } from "@/lib/cari/ambil";
import { formatRupiahRingkas } from "@/lib/format";

// OpenFreeMap: no key, no per-load billing (CLAUDE.md §3).
const STYLE = "https://tiles.openfreemap.org/styles/positron";
const FONT = ["Noto Sans Bold"];

// Worker module served from public/ (see scripts/salin-maplibre.mjs).
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export type AreaPeta = { lat: number; lng: number; radius: number };

type Props = {
  pusat: { lat: number; lng: number };
  kos: HasilKos[];
  terpilih: string | null;
  onPilih: (id: string | null) => void;
  /** Card being hovered in the list; its pin grows. */
  disorot?: string | null;
  /** Fired after the user pans or zooms (not after our own fitBounds). */
  onGeser?: (area: AreaPeta) => void;
};

function keGeoJson(kos: HasilKos[], terpilih: string | null, disorot: string | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: kos
      .filter((k) => k.lat != null && k.lng != null)
      .map((k) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [k.lng, k.lat] },
        properties: { id: k.id, label: formatRupiahRingkas(k.total_bulanan), terpilih: k.id === terpilih, disorot: k.id === disorot },
      })),
  };
}

function token(nama: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return v || "black";
}

/** Metres between two points (haversine); enough for a search radius. */
function jarakM(a: [number, number], b: [number, number]): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Clustered pins with the real monthly total on each pin. Loaded through
// next/dynamic only when the map is first shown.
export default function PetaHasil({ pusat, kos, terpilih, onPilih, disorot = null, onGeser }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const peta = useRef<MapLibre | null>(null);
  const siap = useRef(false);
  const kosRef = useRef(kos);
  const terpilihRef = useRef(terpilih);
  const disorotRef = useRef(disorot);
  const onPilihRef = useRef(onPilih);
  const onGeserRef = useRef(onGeser);

  useEffect(() => {
    kosRef.current = kos;
    terpilihRef.current = terpilih;
    disorotRef.current = disorot;
    onPilihRef.current = onPilih;
    onGeserRef.current = onGeser;
  });

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const biru = token("--color-biru-500");
    const biruTua = token("--color-biru-600");
    const arang = token("--color-arang-900");
    const putih = token("--color-putih");

    const map = new MapLibre({
      container: el,
      style: STYLE,
      center: [pusat.lng, pusat.lat],
      zoom: 13,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (e) => console.error("peta:", e.error?.message ?? e));

    // The container is often still being laid out when the map mounts
    // (mobile: it appears on tap). Without this the canvas stays blank
    // until the first touch.
    const raf = requestAnimationFrame(() => map.resize());
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);

    const pasang = () => {
      const src = map.getSource("kos") as GeoJSONSource | undefined;
      src?.setData(keGeoJson(kosRef.current, terpilihRef.current, disorotRef.current));
    };
    const pas = () => {
      const titik = kosRef.current.filter((k) => k.lat != null && k.lng != null);
      if (titik.length === 0) return;
      const b = new LngLatBounds();
      titik.forEach((k) => b.extend([k.lng, k.lat]));
      map.fitBounds(b, { padding: 56, maxZoom: 15, duration: 0 });
    };

    map.on("load", () => {
      map.addSource("kos", { type: "geojson", data: keGeoJson([], null, null), cluster: true, clusterRadius: 44, clusterMaxZoom: 16 });
      map.addLayer({
        id: "klaster",
        type: "circle",
        source: "kos",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": biru,
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 26],
          "circle-stroke-width": 2,
          "circle-stroke-color": putih,
        },
      });
      map.addLayer({
        id: "klaster-jumlah",
        type: "symbol",
        source: "kos",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": FONT },
        paint: { "text-color": putih },
      });
      map.addLayer({
        id: "titik",
        type: "circle",
        source: "kos",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case", ["get", "terpilih"], arang, ["get", "disorot"], biruTua, biru],
          "circle-radius": ["case", ["get", "terpilih"], 9, ["get", "disorot"], 10, 7],
          "circle-stroke-width": 2,
          "circle-stroke-color": putih,
        },
      });
      map.addLayer({
        id: "titik-label",
        type: "symbol",
        source: "kos",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "label"],
          "text-size": 12,
          "text-font": FONT,
          "text-anchor": "bottom",
          "text-offset": [0, -0.9],
          "text-optional": true,
        },
        paint: { "text-color": arang, "text-halo-color": putih, "text-halo-width": 2 },
      });

      const pilih = (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const f = e.features?.[0];
        if (f?.properties?.id) onPilihRef.current(String(f.properties.id));
      };
      map.on("click", "titik", pilih);
      map.on("click", "titik-label", pilih);
      map.on("click", "klaster", async (e: MapMouseEvent & { features?: MapGeoJSONFeature[] }) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        const src = map.getSource("kos") as GeoJSONSource;
        const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id as number);
        map.easeTo({ center: f.geometry.coordinates as [number, number], zoom, duration: reduce ? 0 : 400 });
      });
      map.on("click", (e: MapMouseEvent) => {
        const hit = map.queryRenderedFeatures(e.point, { layers: ["titik", "titik-label", "klaster"] });
        if (hit.length === 0) onPilihRef.current(null);
      });
      for (const layer of ["titik", "titik-label", "klaster"]) {
        map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
      }
      // Only user gestures count; fitBounds and cluster zoom carry no originalEvent.
      map.on("moveend", (e: { originalEvent?: Event }) => {
        if (!e.originalEvent || !onGeserRef.current) return;
        const b = map.getBounds();
        const c = map.getCenter();
        const ne = b.getNorthEast();
        const radius = Math.round(Math.min(20_000, Math.max(300, jarakM([c.lng, c.lat], [ne.lng, ne.lat]) * 0.8)));
        onGeserRef.current({ lat: c.lat, lng: c.lng, radius });
      });

      siap.current = true;
      map.resize();
      pasang();
      pas();
    });

    peta.current = map;
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      map.remove();
      peta.current = null;
      siap.current = false;
    };
  }, [pusat.lat, pusat.lng]);

  // New results → new pins, refit.
  useEffect(() => {
    const map = peta.current;
    if (!map || !siap.current) return;
    (map.getSource("kos") as GeoJSONSource).setData(keGeoJson(kos, terpilihRef.current, disorotRef.current));
    const titik = kos.filter((k) => k.lat != null && k.lng != null);
    if (titik.length === 0) return;
    const b = new LngLatBounds();
    titik.forEach((k) => b.extend([k.lng, k.lat]));
    map.fitBounds(b, { padding: 56, maxZoom: 15, duration: 0 });
  }, [kos]);

  // Selection / hover change → restyle only.
  useEffect(() => {
    const map = peta.current;
    if (!map || !siap.current) return;
    (map.getSource("kos") as GeoJSONSource).setData(keGeoJson(kosRef.current, terpilih, disorot));
  }, [terpilih, disorot]);

  return <div ref={wadah} className="h-full w-full bg-biru-100" role="region" aria-label="Peta hasil pencarian" />;
}
