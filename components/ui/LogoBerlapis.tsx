import { useId } from "react";
import { cn } from "@/lib/cn";

// The brand mark drawn as a layered app icon for the opening screen
// (components/layout/IntroLogo.tsx), in the spirit of a glossy app icon: a
// blue card and a survey sheet tucked behind the house, the house in a blue
// gradient with a soft sheen, and the white smile. Same 32 × 32 geometry as
// <Logo>, so when it shrinks onto the header mark the house lands exactly.
// During that flight .intro-hiasan fades out and .intro-polos (the flat
// biru-500 house of the header mark) fades in, so the landing is seamless.
const RUMAH = "M4.6 13.6 15.1 4.7a1.4 1.4 0 0 1 1.8 0l10.5 8.9V26.4A1.6 1.6 0 0 1 25.8 28H6.2a1.6 1.6 0 0 1-1.6-1.6z";

export function LogoBerlapis({ className, kelasSenyum }: { className?: string; kelasSenyum?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const g = (nama: string) => `${nama}-${id}`;
  return (
    <svg viewBox="0 0 32 32" overflow="visible" className={cn("shrink-0", className)} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={g("kartu")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-biru-500)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-biru-600)" }} />
        </linearGradient>
        <linearGradient id={g("kertas")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--color-putih)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-biru-100)" }} />
        </linearGradient>
        <linearGradient id={g("rumah")} x1="0.1" y1="0.15" x2="0.9" y2="1">
          <stop offset="0" style={{ stopColor: "color-mix(in srgb, var(--color-biru-500) 55%, white)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--color-biru-500)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-biru-600)" }} />
        </linearGradient>
        <linearGradient id={g("kilau")} x1="0" y1="0" x2="0.7" y2="0.7">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="intro-hiasan">
        {/* Behind the roof: a blue card (left) and a survey sheet (right). */}
        <rect x="6.2" y="2.2" width="14" height="16" rx="2.6" fill={`url(#${g("kartu")})`} transform="rotate(-13 13.2 10.2)" />
        <g transform="rotate(10 19.6 9)">
          <rect x="12.6" y="1" width="14" height="16" rx="2.4" fill={`url(#${g("kertas")})`} />
          <path d="M15.4 4.6h8M15.4 7.1h5.6" stroke="var(--color-biru-500)" strokeOpacity="0.35" strokeWidth="1.1" strokeLinecap="round" />
        </g>
        <path d={RUMAH} fill={`url(#${g("rumah")})`} />
        <path d={RUMAH} fill={`url(#${g("kilau")})`} />
      </g>
      {/* The header mark's flat house, shown at the end of the flight. */}
      <path d={RUMAH} className="intro-polos" style={{ fill: "var(--color-biru-500)" }} opacity="0" />
      <path
        d="M11.2 19.2c1.4 2.1 3 3.1 4.8 3.1s3.4-1 4.8-3.1"
        pathLength={1}
        className={cn("stroke-putih", kelasSenyum)}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
