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

type Props = {
  pusat: { lat: number; lng: number };
  kos: HasilKos[];
  terpilih: string | null;
  onPilih: (id: string | null) => void;
};

function keGeoJson(kos: HasilKos[], terpilih: string | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: kos
      .filter((k) => k.lat != null && k.lng != null)
      .map((k) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [k.lng, k.lat] },
        properties: { id: k.id, label: formatRupiahRingkas(k.total_bulanan), terpilih: k.id === terpilih },
      })),
  };
}

function token(nama: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return v || "black";
}

// Clustered pins with the real monthly total on each pin. Loaded through
// next/dynamic only when the map is first shown.
export default function PetaHasil({ pusat, kos, terpilih, onPilih }: Props) {
  const wadah = useRef<HTMLDivElement>(null);
  const peta = useRef<MapLibre | null>(null);
  const siap = useRef(false);
  const kosRef = useRef(kos);
  const terpilihRef = useRef(terpilih);
  const onPilihRef = useRef(onPilih);

  useEffect(() => {
    kosRef.current = kos;
    terpilihRef.current = terpilih;
    onPilihRef.current = onPilih;
  });

  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const biru = token("--color-biru-500");
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

    const pasang = () => {
      const src = map.getSource("kos") as GeoJSONSource | undefined;
      src?.setData(keGeoJson(kosRef.current, terpilihRef.current));
    };
    const pas = () => {
      const titik = kosRef.current.filter((k) => k.lat != null && k.lng != null);
      if (titik.length === 0) return;
      const b = new LngLatBounds();
      titik.forEach((k) => b.extend([k.lng, k.lat]));
      map.fitBounds(b, { padding: 56, maxZoom: 15, duration: 0 });
    };

    map.on("load", () => {
      map.addSource("kos", { type: "geojson", data: keGeoJson([], null), cluster: true, clusterRadius: 44, clusterMaxZoom: 16 });
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
          "circle-color": ["case", ["get", "terpilih"], arang, biru],
          "circle-radius": ["case", ["get", "terpilih"], 9, 7],
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

      siap.current = true;
      pasang();
      pas();
    });

    peta.current = map;
    return () => {
      map.remove();
      peta.current = null;
      siap.current = false;
    };
  }, [pusat.lat, pusat.lng]);

  // New results → new pins, refit.
  useEffect(() => {
    const map = peta.current;
    if (!map || !siap.current) return;
    (map.getSource("kos") as GeoJSONSource).setData(keGeoJson(kos, terpilihRef.current));
    const titik = kos.filter((k) => k.lat != null && k.lng != null);
    if (titik.length === 0) return;
    const b = new LngLatBounds();
    titik.forEach((k) => b.extend([k.lng, k.lat]));
    map.fitBounds(b, { padding: 56, maxZoom: 15, duration: 0 });
  }, [kos]);

  // Selection change → restyle only.
  useEffect(() => {
    const map = peta.current;
    if (!map || !siap.current) return;
    (map.getSource("kos") as GeoJSONSource).setData(keGeoJson(kosRef.current, terpilih));
  }, [terpilih]);

  return <div ref={wadah} className="h-full w-full bg-biru-100" role="region" aria-label="Peta hasil pencarian" />;
}
