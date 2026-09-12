// The brand's identity device: a hand-drawn wayfinding sketch — the
// "belok kiri di warung biru" language of Indonesian directions. Inline
// SVG so it paints with the HTML; the route draws itself once on load
// (≤600 ms total) and landmarks pop in behind it. Decorative only.
export function HeroSketch({ className }: { className?: string }) {
  const rute =
    "M42 262 C 78 258, 96 226, 128 214 S 190 226, 214 190 S 252 128, 302 138 S 372 170, 400 132 S 436 74, 474 62";
  return (
    <svg
      viewBox="0 0 520 300"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        {/* A solid copy of the route that draws itself and reveals the dashed one. */}
        <mask id="hero-gambar">
          <path
            d={rute}
            pathLength={1}
            strokeDasharray={1}
            className="animate-gambar stroke-putih"
            strokeWidth={14}
          />
        </mask>
      </defs>

      {/* Route */}
      <path
        d={rute}
        mask="url(#hero-gambar)"
        className="stroke-biru-600"
        strokeWidth={3.5}
        strokeDasharray="9 8"
      />

      {/* Start: kamu di sini */}
      <g className="animate-muncul">
        <circle cx="42" cy="262" r="7" className="fill-putih stroke-biru-600" strokeWidth={3} />
        <circle cx="42" cy="262" r="2.5" className="fill-biru-600" />
        <text x="16" y="290" className="fill-arang-900 text-micro font-medium italic">
          kamu di sini
        </text>
      </g>

      {/* Warung biru */}
      <g className="animate-muncul [animation-delay:180ms]">
        <path d="M112 176 h44 v34 h-44 z" className="fill-biru-500 stroke-biru-600" strokeWidth={2.5} />
        <path d="M106 178 l6 -10 h44 l6 10" className="fill-biru-100 stroke-biru-600" strokeWidth={2.5} />
        <path d="M106 178 l5 6 5 -6 5 6 5 -6 5 6 5 -6 5 6 5 -6 5 6 5 -6 5 6 5 -6" className="stroke-biru-600" strokeWidth={2} />
        <path d="M128 210 v-14 h12 v14" className="stroke-putih" strokeWidth={2.5} />
        <text x="96" y="162" className="fill-arang-900 text-micro font-medium italic">
          belok kiri di warung biru
        </text>
      </g>

      {/* Lurus 200 m */}
      <g className="animate-muncul [animation-delay:260ms]">
        <text x="214" y="122" className="fill-arang-500 text-micro font-medium italic">
          lurus 200 m
        </text>
        <path d="M232 128 c 10 6, 18 8, 30 6" className="stroke-arang-500" strokeWidth={2} strokeDasharray="3 4" />
      </g>

      {/* Pohon besar */}
      <g className="animate-muncul [animation-delay:340ms]">
        <path d="M318 212 v-26" className="stroke-daun-700" strokeWidth={3} />
        <path
          d="M300 190 c -8 -14, 4 -34, 18 -30 c 6 -12, 24 -8, 24 6 c 12 4, 10 24, -4 24 c -6 10, -24 10, -28 0 c -8 2, -14 -4, -10 0 z"
          className="fill-daun-100 stroke-daun-700"
          strokeWidth={2.5}
        />
        <text x="290" y="232" className="fill-arang-900 text-micro font-medium italic">
          lewat pohon besar
        </text>
      </g>

      {/* Masjid kecil */}
      <g className="animate-muncul [animation-delay:400ms]">
        <path d="M346 96 h34 v22 h-34 z" className="fill-putih stroke-biru-600" strokeWidth={2.5} />
        <path d="M348 96 c 0 -18, 30 -18, 30 0" className="fill-biru-100 stroke-biru-600" strokeWidth={2.5} />
        <path d="M386 118 v-30 l4 -6 4 6 v30" className="fill-putih stroke-biru-600" strokeWidth={2.5} />
        <path d="M360 118 v-9 a3 3 0 0 1 6 0 v9" className="stroke-biru-600" strokeWidth={2} />
      </g>

      {/* Pin: sampai */}
      <g className="animate-muncul [animation-delay:460ms]">
        <path
          d="M474 84 c -14 -14, -22 -26, -22 -38 a22 22 0 0 1 44 0 c 0 12, -8 24, -22 38 z"
          className="fill-biru-500 stroke-biru-600"
          strokeWidth={3}
        />
        <path d="M463 44 l11 -9 11 9 v12 h-22 z" className="fill-putih" />
        <path d="M469 50 c 2 3, 8 3, 10 0" className="stroke-biru-600" strokeWidth={2} />
        <text x="440" y="104" className="fill-arang-900 text-small font-bold">
          sampai!
        </text>
      </g>
    </svg>
  );
}
