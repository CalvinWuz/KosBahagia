"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { teksRute, type IkonLandmark, type IkonLangkah, type Langkah, type Rute } from "@/lib/kos/rute";
import { cn } from "@/lib/cn";

const Lightbox = dynamic(() => import("@/components/ui/Lightbox").then((m) => m.Lightbox));

// "Cara ke sini": a stylised street map from the landmark to the front gate,
// in the wayfinding language Indonesians actually use ("belok kiri di
// warung biru"). The picture is data-driven from kos_sekitar.rute: the
// route is a fixed street layout, the steps sit along it, and pictograms
// are placed only for things the step text really mentions (masjid,
// warung, zebra cross, ...). Labels are HTML on top of the SVG so they stay
// readable at phone width. The ordered list underneath is the accessible
// form of the same route; hovering a step lights up its point on the map.

type Titik = { x: number; y: number };
type Foto = { id: string; url: string; keterangan: string | null };

const LEBAR = 640;
const TINGGI = 340;
// One street layout for every route: main road, two turns, then the alley.
const JALAN: Titik[] = [
  { x: 84, y: 244 },
  { x: 236, y: 244 },
  { x: 236, y: 156 },
  { x: 396, y: 156 },
  { x: 396, y: 88 },
  { x: 556, y: 88 },
];
const AWAL = JALAN[0];
const AKHIR = JALAN[JALAN.length - 1];

function bulat(n: number) {
  return Math.round(n * 10) / 10;
}

/** Rounded-corner path through the street points. */
function jalurJalan(p: Titik[], r = 22): string {
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1];
    const b = p[i];
    const c = p[i + 1];
    const masuk = arah(a, b);
    const keluar = arah(b, c);
    d += ` L${bulat(b.x - masuk.x * r)} ${bulat(b.y - masuk.y * r)}`;
    d += ` Q${b.x} ${b.y} ${bulat(b.x + keluar.x * r)} ${bulat(b.y + keluar.y * r)}`;
  }
  const t = p[p.length - 1];
  d += ` L${t.x} ${t.y}`;
  return d;
}
function arah(a: Titik, b: Titik): Titik {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Point at fraction t (0–1) of the polyline's length. */
function titikPada(p: Titik[], t: number): Titik {
  const seg = p.slice(1).map((b, i) => Math.hypot(b.x - p[i].x, b.y - p[i].y));
  const total = seg.reduce((a, b) => a + b, 0);
  let sisa = t * total;
  for (let i = 0; i < seg.length; i++) {
    if (sisa <= seg[i]) {
      const f = seg[i] === 0 ? 0 : sisa / seg[i];
      return { x: bulat(p[i].x + (p[i + 1].x - p[i].x) * f), y: bulat(p[i].y + (p[i + 1].y - p[i].y) * f) };
    }
    sisa -= seg[i];
  }
  return p[p.length - 1];
}

/** Where each step sits: intermediate steps spread along the road, the last one at the gate. */
function titikLangkah(n: number): Titik[] {
  if (n <= 1) return [AKHIR];
  const tengah = Array.from({ length: n - 1 }, (_, i) => titikPada(JALAN, (i + 1) / n));
  return [...tengah, AKHIR];
}

type Piktogram = "masjid" | "warung" | "minimarket" | "ojek" | "pohon" | "zebra" | "jembatan" | "lampu" | "gang";
const KATA: Array<[RegExp, Piktogram]> = [
  [/masjid|musala|mushola/i, "masjid"],
  [/minimarket|indomaret|alfamart|alfamidi/i, "minimarket"],
  [/warung|warteg|warmindo/i, "warung"],
  [/ojek|pangkalan/i, "ojek"],
  [/pohon|beringin/i, "pohon"],
  [/zebra|seberang/i, "zebra"],
  [/jembatan/i, "jembatan"],
  [/lampu merah|lampu lalu/i, "lampu"],
  [/gang/i, "gang"],
];
function piktogramDari(l: Langkah): Piktogram | null {
  for (const [re, p] of KATA) if (re.test(l.teks)) return p;
  return null;
}

export function Minimap({
  rute,
  foto = [],
  className,
}: {
  rute: Rute;
  foto?: Foto[];
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const [buka, setBuka] = useState<Foto | null>(null);
  const [aktif, setAktif] = useState<number | null>(null);
  const [terlihat, setTerlihat] = useState(false);
  const [gerak, setGerak] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  const daftar = useRef<HTMLOListElement>(null);

  const langkah = rute.langkah;
  const titik = titikLangkah(langkah.length);
  const fotoDari = (fid?: string) => (fid ? foto.find((f) => f.id === fid) : undefined);
  const jalurD = jalurJalan(JALAN);

  // Draw the route once the map is on screen; the walker only when motion is welcome.
  useEffect(() => {
    const el = wadah.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTerlihat(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setGerak(!mq.matches);
    const onUbah = () => setGerak(!mq.matches);
    mq.addEventListener("change", onUbah);
    return () => {
      io.disconnect();
      mq.removeEventListener("change", onUbah);
    };
  }, []);

  const keDaftar = (i: number) => {
    setAktif(i);
    daftar.current?.querySelectorAll<HTMLElement>("li")[i]?.focus();
  };

  return (
    <div className={className}>
      <div ref={wadah} className="relative overflow-hidden rounded-2xl border border-biru-100 bg-biru-100/60">
        <svg
          viewBox={`0 0 ${LEBAR} ${TINGGI}`}
          role="img"
          aria-label={teksRute(rute)}
          className="block h-auto w-full"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <mask id={`${id}-gambar`}>
              <path
                d={jalurD}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={terlihat ? 0 : 1}
                className={cn("stroke-putih", terlihat && "motion-safe:animate-gambar")}
                strokeWidth={18}
              />
            </mask>
            <path id={`${id}-jalur`} d={jalurD} />
          </defs>

          {/* Blocks: what the roads leave behind. */}
          <g className="fill-putih/45">
            <rect x="0" y="0" width="150" height="120" />
            <rect x="180" y="0" width="190" height="60" />
            <rect x="400" y="0" width="240" height="56" />
            <rect x="24" y="150" width="182" height="64" />
            <rect x="270" y="90" width="98" height="36" />
            <rect x="430" y="120" width="210" height="90" />
            <rect x="0" y="274" width="200" height="66" />
            <rect x="270" y="190" width="100" height="150" />
            <rect x="430" y="244" width="210" height="96" />
          </g>

          {/* Side streets */}
          <g className="stroke-putih" strokeWidth={12}>
            <path d="M160 0v120M380 0v88M380 190v150M236 244v96M470 120v124M62 130h96M206 244H0M556 88v250M640 210H430M0 150h30" />
          </g>

          {/* The route's own road: wide for the main road, narrow for the alley at the end. */}
          <path d={jalurJalan(JALAN.slice(0, 5))} className="stroke-putih" strokeWidth={28} />
          <path d={`M${JALAN[4].x} ${JALAN[4].y} L${AKHIR.x} ${AKHIR.y}`} className="stroke-putih" strokeWidth={16} />
          <path d={`M${JALAN[4].x} ${JALAN[4].y} L${AKHIR.x} ${AKHIR.y}`} className="stroke-biru-500/25" strokeWidth={1} strokeDasharray="3 5" />

          {/* Trees, off the roads. */}
          <g>
            {[
              [118, 196],
              [318, 216],
              [500, 262],
              [590, 292],
              [70, 96],
              [470, 176],
              [606, 168],
            ].map(([x, y]) => (
              <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
                <circle r="9" className="fill-daun-100 stroke-daun-500" strokeWidth={1.5} />
                <circle r="3" className="fill-daun-500" />
              </g>
            ))}
          </g>

          {/* Route, revealed as it draws. */}
          <path d={jalurD} mask={`url(#${id}-gambar)`} className="stroke-biru-600" strokeWidth={4} strokeDasharray="10 8" />

          {/* Walker */}
          {gerak && terlihat && (
            <g>
              <circle r="6" className="fill-jingga-500 stroke-putih" strokeWidth={2}>
                <animateMotion dur="16s" begin="1s" repeatCount="indefinite">
                  <mpath href={`#${id}-jalur`} />
                </animateMotion>
              </circle>
            </g>
          )}

          {/* Landmark */}
          <g transform={`translate(${AWAL.x} ${AWAL.y})`}>
            <circle r="26" className="fill-putih" />
            <IkonLandmarkSvg ikon={rute.landmark.ikon} />
          </g>

          {/* Steps: pictogram beside the point when the text names something. */}
          {titik.slice(0, -1).map((t, i) => {
            const p = piktogramDari(langkah[i]);
            const diAtas = t.y > 170;
            return (
              <g key={i}>
                {p && (
                  <g transform={`translate(${t.x + (diAtas ? 34 : 34)} ${t.y + (diAtas ? -30 : 30)})`}>
                    <PiktogramSvg jenis={p} />
                  </g>
                )}
                <g
                  transform={`translate(${t.x} ${t.y})`}
                  className="cursor-pointer"
                  onClick={() => keDaftar(i)}
                  onMouseEnter={() => setAktif(i)}
                  onMouseLeave={() => setAktif(null)}
                >
                  <circle r={aktif === i ? 15 : 12} className={cn("stroke-biru-600 transition-[r] duration-150", aktif === i ? "fill-biru-600" : "fill-putih")} strokeWidth={2.5} />
                  <text y={4.5} textAnchor="middle" className={cn("text-small font-bold", aktif === i ? "fill-putih" : "fill-biru-600")}>
                    {i + 1}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Destination: the house pin with the last step number. */}
          <g
            transform={`translate(${AKHIR.x} ${AKHIR.y})`}
            className="cursor-pointer"
            onClick={() => keDaftar(langkah.length - 1)}
            onMouseEnter={() => setAktif(langkah.length - 1)}
            onMouseLeave={() => setAktif(null)}
          >
            {piktogramDari(langkah[langkah.length - 1]) === "gang" && (
              <path d="M-30 30h60M-24 24v12M-12 24v12M0 24v12M12 24v12M24 24v12" className="stroke-arang-900/60" strokeWidth={2} />
            )}
            <path d="M0 8c-14-14-21-25-21-35a21 21 0 0 1 42 0c0 10-7 21-21 35z" className={cn("stroke-biru-600", aktif === langkah.length - 1 ? "fill-biru-600" : "fill-biru-500")} strokeWidth={2.5} />
            <path d="M-10-24l10-8 10 8v11h-20z" className="fill-putih" />
            <path d="M-4.5-19c1.6 2.6 7.4 2.6 9 0" className="stroke-biru-600" strokeWidth={1.8} />
            <circle r="12" cy="12" className="fill-putih stroke-biru-600" strokeWidth={2.5} />
            <text y={16.5} textAnchor="middle" className="fill-biru-600 text-small font-bold">
              {langkah.length}
            </text>
          </g>
        </svg>

        {/* HTML labels: fixed-size text over the drawing. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full border border-biru-100 bg-putih px-3 py-1 text-micro font-bold text-arang-900 shadow-sm tabular-nums whitespace-nowrap">
            {rute.total_menit != null ? `${rute.total_menit} mnt jalan kaki` : "Rute jalan kaki"}
            {rute.akses && rute.akses !== "jalan_kaki" && <span className="hidden font-medium text-arang-500 sm:inline"> · {rute.akses === "mobil" ? "mobil bisa masuk" : "motor bisa masuk"}</span>}
          </span>
          <span className="absolute bottom-[6%] left-[3%] max-w-[40%] text-micro leading-tight font-bold text-arang-900 italic">{rute.landmark.nama.split(" (")[0]}</span>
          <span className="absolute top-[3%] left-[87%] -translate-x-1/2 text-small font-bold text-arang-900">sampai!</span>
          <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 rounded-full bg-putih/80 py-0.5 pr-2 pl-1.5 text-micro font-bold text-biru-600">
            <svg viewBox="0 0 12 12" className="size-3" aria-hidden="true"><path d="M6 1l3.5 9L6 8 2.5 10z" fill="currentColor" /></svg>
            U
          </span>
          <span className="absolute right-2 bottom-1 text-micro text-arang-500/80">ilustrasi, bukan skala</span>
        </div>
      </div>

      <ol ref={daftar} className="mt-3 flex flex-col gap-2" aria-label="Langkah rute">
        {langkah.map((l, i) => {
          const f = fotoDari(l.foto_id);
          const sorot = aktif === i;
          return (
            <li
              key={i}
              tabIndex={0}
              onMouseEnter={() => setAktif(i)}
              onMouseLeave={() => setAktif(null)}
              onFocus={() => setAktif(i)}
              onBlur={() => setAktif(null)}
              className={cn(
                "flex items-start gap-3 rounded-xl border bg-putih p-2.5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500",
                sorot ? "border-biru-500 bg-biru-100/40" : "border-biru-100",
              )}
            >
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-micro font-bold tabular-nums", sorot ? "bg-biru-600 text-putih" : "bg-biru-100 text-biru-600")}>{i + 1}</span>
              <span className="mt-1 shrink-0 text-biru-600" aria-hidden="true"><IkonLangkahSvg ikon={l.ikon} /></span>
              <span className="min-w-0 flex-1 pt-1 text-small text-arang-900">{l.teks}</span>
              {f && (
                <button
                  type="button"
                  onClick={() => setBuka(f)}
                  aria-label={`Lihat foto: ${f.keterangan ?? "patokan"}`}
                  className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-biru-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
                >
                  <Image src={f.url} alt="" fill sizes="56px" className="object-cover" />
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {buka && <Lightbox open onClose={() => setBuka(null)} src={buka.url} alt={buka.keterangan ?? "Foto patokan"} keterangan={buka.keterangan} />}
    </div>
  );
}

// ---- pictograms, all in the same loose stroke style
function IkonLandmarkSvg({ ikon }: { ikon: IkonLandmark }) {
  const kelas = "stroke-biru-600";
  switch (ikon) {
    case "stasiun":
      return (
        <g>
          <rect x={-15} y={-17} width={30} height={26} rx={5} className={cn("fill-putih", kelas)} strokeWidth={2.5} />
          <path d="M-15 -3 h30 M-8 -10 h16 M-8 15 l-3 5 M8 15 l3 5" className={kelas} strokeWidth={2.2} />
          <circle cx={-7} cy={3} r={2} className="fill-biru-600" />
          <circle cx={7} cy={3} r={2} className="fill-biru-600" />
        </g>
      );
    case "kampus":
      return (
        <g>
          <path d="M-17 -4 l17 -9 17 9 -17 9 z" className={cn("fill-putih", kelas)} strokeWidth={2.5} />
          <path d="M-9 0 v8 c0 3 4.5 5 9 5 s9 -2 9 -5 v-8 M17 -4 v11" className={kelas} strokeWidth={2.2} />
        </g>
      );
    case "masjid":
      return (
        <g>
          <path d="M-14 8 h28 v-12 h-28 z" className={cn("fill-putih", kelas)} strokeWidth={2.5} />
          <path d="M-12 -4 c 0 -16, 24 -16, 24 0" className={cn("fill-biru-100", kelas)} strokeWidth={2.5} />
          <path d="M-3 8 v-6 a3 3 0 0 1 6 0 v6" className={kelas} strokeWidth={2} />
          <path d="M16 8 v-20 l3 -4 3 4 v20" className={cn("fill-putih", kelas)} strokeWidth={2.2} />
        </g>
      );
    case "pasar":
      return (
        <g>
          <path d="M-14 -4 l4 -8 h20 l4 8" className={cn("fill-biru-100", kelas)} strokeWidth={2.5} />
          <path d="M-14 -4 l4 5 4 -5 4 5 4 -5 4 5 4 -5 4 5 M-11 2 v8 h22 v-8" className={kelas} strokeWidth={2.2} />
        </g>
      );
    case "halte":
      return (
        <g>
          <path d="M-14 -12 h28 l-3 6 h-22 z" className={cn("fill-biru-100", kelas)} strokeWidth={2.5} />
          <path d="M-10 -6 v18 M10 -6 v18 M-10 6 h20" className={kelas} strokeWidth={2.2} />
        </g>
      );
    default:
      return (
        <g>
          <path d="M0 14 c -9 -9, -14 -16, -14 -22 a14 14 0 0 1 28 0 c 0 6, -5 13, -14 22 z" className={cn("fill-putih", kelas)} strokeWidth={2.5} />
          <circle cy={-8} r={4} className="fill-biru-600" />
        </g>
      );
  }
}

function PiktogramSvg({ jenis }: { jenis: Piktogram }) {
  const k = "stroke-arang-900";
  switch (jenis) {
    case "masjid":
      return (
        <g>
          <path d="M-11 8h22v-9h-22z" className={cn("fill-putih", k)} strokeWidth={1.8} />
          <path d="M-9-1c0-12 18-12 18 0" className={cn("fill-biru-100", k)} strokeWidth={1.8} />
          <path d="M13 8v-16l2-3 2 3v16" className={cn("fill-putih", k)} strokeWidth={1.6} />
        </g>
      );
    case "warung":
      return (
        <g>
          <path d="M-12 8v-10h24v10z" className={cn("fill-putih", k)} strokeWidth={1.8} />
          <path d="M-14-2l3-6h22l3 6" className={cn("fill-biru-500", k)} strokeWidth={1.8} />
          <path d="M-14-2l3.5 3 3.5-3 3.5 3 3.5-3 3.5 3 3.5-3 3.5 3 3.5-3" className={k} strokeWidth={1.4} />
          <path d="M-3 8v-6h6v6" className={k} strokeWidth={1.6} />
        </g>
      );
    case "minimarket":
      return (
        <g>
          <rect x={-13} y={-10} width={26} height={18} rx={2} className={cn("fill-putih", k)} strokeWidth={1.8} />
          <rect x={-13} y={-10} width={26} height={6} className="fill-merah-500" />
          <path d="M-8 8v-7h6v7M4 0h6M4 3h6" className={k} strokeWidth={1.4} />
        </g>
      );
    case "ojek":
      return (
        <g>
          <circle cx={-8} cy={4} r={5} className={cn("fill-putih", k)} strokeWidth={1.8} />
          <circle cx={8} cy={4} r={5} className={cn("fill-putih", k)} strokeWidth={1.8} />
          <path d="M-8 4l4-9h8l4 9M-2-5l2-4h4" className={k} strokeWidth={1.8} />
          <path d="M-4-5h8" className={k} strokeWidth={3} />
        </g>
      );
    case "pohon":
      return (
        <g>
          <path d="M0 10v-8" className="stroke-daun-700" strokeWidth={2.5} />
          <path d="M-12-2c-2-10 8-16 12-11 4-5 14 1 12 11-3 4-9 5-12 3-3 2-9 1-12-3z" className="fill-daun-100 stroke-daun-700" strokeWidth={1.8} />
        </g>
      );
    case "zebra":
      return (
        <g>
          <rect x={-16} y={-7} width={32} height={14} rx={2} className="fill-arang-900/70" />
          <path d="M-12-7v14M-6-7v14M0-7v14M6-7v14M12-7v14" className="stroke-putih" strokeWidth={3} />
        </g>
      );
    case "jembatan":
      return (
        <g>
          <path d="M-16 6h32" className={k} strokeWidth={2.5} />
          <path d="M-14 6v-9a14 8 0 0 1 28 0v9" className={cn("fill-putih", k)} strokeWidth={1.8} />
          <path d="M-7 6v-5M0 6v-7M7 6v-5" className={k} strokeWidth={1.4} />
        </g>
      );
    case "lampu":
      return (
        <g>
          <rect x={-5} y={-14} width={10} height={24} rx={3} className={cn("fill-arang-900", k)} strokeWidth={1} />
          <circle cy={-9} r={2.6} className="fill-merah-500" />
          <circle cy={-2} r={2.6} className="fill-jingga-500" />
          <circle cy={5} r={2.6} className="fill-daun-500" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M-8-12v24M8-12v24" className={k} strokeWidth={2} />
          <path d="M0 12v-4M0 4v-4M0-4v-4" className={k} strokeWidth={2} />
        </g>
      );
  }
}

function IkonLangkahSvg({ ikon }: { ikon: IkonLangkah }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (ikon) {
    case "lurus":
      return <svg {...p}><path d="M12 20V5M6 11l6-6 6 6" /></svg>;
    case "belok-kiri":
      return <svg {...p}><path d="M18 20V10a3 3 0 0 0-3-3H6M10 3 6 7l4 4" /></svg>;
    case "belok-kanan":
      return <svg {...p}><path d="M6 20V10a3 3 0 0 1 3-3h9M14 3l4 4-4 4" /></svg>;
    case "seberang":
      return <svg {...p}><path d="M4 8h16M4 16h16M8 8v8M12 8v8M16 8v8" /></svg>;
    case "gang":
      return <svg {...p}><path d="M7 4v16M17 4v16M12 20v-3M12 13v-3M12 7V4" /></svg>;
    default:
      return <svg {...p}><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2" /></svg>;
  }
}
