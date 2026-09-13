"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

const Lightbox = dynamic(() => import("@/components/ui/Lightbox").then((m) => m.Lightbox));
import { teksRute, type IkonLandmark, type IkonLangkah, type Rute } from "@/lib/kos/rute";
import { cn } from "@/lib/cn";

// "Cara ke sini" — a stylised route from the landmark to the front gate in
// the same hand-drawn language as the homepage hero. Pure SVG, data-driven
// from kos_sekitar.rute, no network. The ordered list underneath is the
// accessible and screenshot-friendly form of the same route.

type Titik = { x: number; y: number };
type Foto = { id: string; url: string; keterangan: string | null };

const LEBAR = 320;
const TINGGI = 200;
const AWAL: Titik = { x: 44, y: 146 };
const AKHIR: Titik = { x: 282, y: 46 };

function bulat(n: number) {
  return Math.round(n * 10) / 10;
}

/** Nodes for the intermediate steps, on a loose S-curve between landmark and pin. */
function titikRute(jumlahTengah: number): Titik[] {
  const tengah: Titik[] = [];
  for (let i = 1; i <= jumlahTengah; i++) {
    const t = i / (jumlahTengah + 1);
    tengah.push({
      x: bulat(AWAL.x + (AKHIR.x - AWAL.x) * t),
      y: bulat(AWAL.y + (AKHIR.y - AWAL.y) * t + 22 * Math.sin(Math.PI * 1.5 * t)),
    });
  }
  return [AWAL, ...tengah, AKHIR];
}

/** Catmull-Rom through the points, emitted as cubic Béziers. */
function jalur(p: Titik[]): string {
  let d = `M${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    d += ` C${bulat(p1.x + (p2.x - p0.x) / 6)} ${bulat(p1.y + (p2.y - p0.y) / 6)}, ${bulat(p2.x - (p3.x - p1.x) / 6)} ${bulat(p2.y - (p3.y - p1.y) / 6)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export function Minimap({ rute, foto = [], className }: { rute: Rute; foto?: Foto[]; className?: string }) {
  const [buka, setBuka] = useState<Foto | null>(null);
  const langkah = rute.langkah;
  const jumlahTengah = Math.min(Math.max(langkah.length - 1, 0), 3);
  const titik = titikRute(jumlahTengah);
  const fotoDari = (id?: string) => (id ? foto.find((f) => f.id === id) : undefined);
  const labelLandmark = rute.landmark.nama.length > 22 ? `${rute.landmark.nama.slice(0, 21)}…` : rute.landmark.nama;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${LEBAR} ${TINGGI}`}
        role="img"
        aria-label={teksRute(rute)}
        className="h-auto w-full rounded-2xl bg-biru-100/60"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={jalur(titik)} className="stroke-biru-600" strokeWidth={3} strokeDasharray="8 7" />

        <g transform={`translate(${AWAL.x} ${AWAL.y})`}>
          <IkonLandmarkSvg ikon={rute.landmark.ikon} />
          <text x={-30} y={34} textAnchor="start" className="fill-arang-900 text-micro font-medium italic">
            {labelLandmark}
          </text>
        </g>

        {titik.slice(1, -1).map((t, i) => (
          <g key={i} transform={`translate(${t.x} ${t.y})`}>
            <circle r={11} className="fill-putih stroke-biru-600" strokeWidth={2.5} />
            <text y={4} textAnchor="middle" className="fill-biru-600 text-micro font-bold">
              {i + 1}
            </text>
          </g>
        ))}

        {/* Walking time sits top-centre, clear of every node position. */}
        {rute.total_menit != null && (
          <g transform="translate(160 26)">
            <rect x={-38} y={-11} width={76} height={22} rx={11} className="fill-putih stroke-biru-100" strokeWidth={1.5} />
            <text y={4} textAnchor="middle" className="fill-arang-900 text-micro font-bold">
              {rute.total_menit} mnt jalan
            </text>
          </g>
        )}

        <g transform={`translate(${AKHIR.x} ${AKHIR.y})`}>
          <path d="M0 22 c -12 -12, -18 -21, -18 -30 a18 18 0 0 1 36 0 c 0 9, -6 18, -18 30 z" className="fill-biru-500 stroke-biru-600" strokeWidth={2.5} />
          <path d="M-9 -9 l9 -7 9 7 v10 h-18 z" className="fill-putih" />
          <path d="M-4 -4 c 1.5 2.5, 6.5 2.5, 8 0" className="stroke-biru-600" strokeWidth={1.6} />
          <circle r={11} cy={22} className="fill-putih stroke-biru-600" strokeWidth={2.5} />
          <text y={26} textAnchor="middle" className="fill-biru-600 text-micro font-bold">
            {langkah.length}
          </text>
          <text x={0} y={44} textAnchor="middle" className="fill-arang-900 text-small font-bold">
            sampai!
          </text>
        </g>
      </svg>

      <ol className="mt-3 flex flex-col gap-2" aria-label="Langkah rute">
        {langkah.map((l, i) => {
          const f = fotoDari(l.foto_id);
          return (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-biru-100 bg-putih p-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-biru-100 text-micro font-bold text-biru-600 tabular-nums">{i + 1}</span>
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

// ---- pictograms, all in the hero's loose style
function IkonLandmarkSvg({ ikon }: { ikon: IkonLandmark }) {
  const kelas = "stroke-biru-600";
  switch (ikon) {
    case "stasiun":
      return (
        <g>
          <rect x={-14} y={-16} width={28} height={24} rx={5} className={cn("fill-putih", kelas)} strokeWidth={2.5} />
          <path d="M-14 -3 h28 M-8 -10 h16 M-8 14 l-3 5 M8 14 l3 5" className={kelas} strokeWidth={2.2} />
          <circle cx={-7} cy={3} r={1.8} className="fill-biru-600" />
          <circle cx={7} cy={3} r={1.8} className="fill-biru-600" />
        </g>
      );
    case "kampus":
      return (
        <g>
          <path d="M-16 -4 l16 -8 16 8 -16 8 z" className={cn("fill-putih", kelas)} strokeWidth={2.5} />
          <path d="M-9 -1 v8 c0 3 4.5 5 9 5 s9 -2 9 -5 v-8 M16 -4 v10" className={kelas} strokeWidth={2.2} />
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
