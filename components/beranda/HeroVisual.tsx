import { IconCheck, IconSuara } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

// The hero's right-hand side: the product itself, not a metaphor. One kos
// card the way it appears in search results, with the three things only we
// show pinned around it: the survey stamp, the measured soundproofing, and
// the real monthly total. Everything is drawn inline (SVG + CSS), so it
// paints with the HTML and needs no image request.
export function HeroVisual({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-full max-w-md select-none", className)} aria-hidden="true">
      {/* Backdrop: a soft block and a dot grid, the "vibrant block" note under the card. */}
      <div className="absolute inset-x-6 top-10 bottom-0 -z-10 rounded-[2.5rem] bg-biru-500/10 [background-image:radial-gradient(var(--color-biru-500)_1px,transparent_1px)] [background-size:18px_18px] opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_95%)]" />

      {/* The card */}
      <div className="relative mx-auto w-[min(100%,22rem)] overflow-hidden rounded-3xl border border-biru-100 bg-putih shadow-2xl shadow-biru-600/25 motion-safe:animate-muncul">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-langit-100">
          <Kamar />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="rounded-lg bg-daun-100 px-2 py-0.5 text-small font-bold text-daun-700 tabular-nums">
              8,1<span className="text-micro font-medium">/10</span>
            </span>
            <span className="rounded-full bg-putih px-2 py-0.5 text-micro font-bold text-biru-600 shadow-sm">360°</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 p-4 pb-9">
          <div className="flex items-start justify-between gap-2">
            <p className="text-body leading-5 font-bold text-arang-900">Kost Anggrek Cakra</p>
            <span className="shrink-0 rounded-md bg-kertas-50 px-1.5 py-0.5 text-micro text-arang-500">Putri</span>
          </div>
          <p className="text-small text-arang-500">12 mnt jalan ke BINUS Kampus Anggrek</p>
          <p className="mt-1 text-price text-arang-900 tabular-nums">
            Rp1.645.000<span className="ml-1 text-small font-normal text-arang-500">/bln</span>
          </p>
          <p className="text-micro text-arang-500">sewa Rp1,45 jt + listrik + air + sampah</p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full bg-daun-100 px-2 py-0.5 text-micro font-bold text-daun-700">Sangat bersih</span>
            <span className="rounded-full bg-daun-100 px-2 py-0.5 text-micro font-bold text-daun-700">Kedap suara</span>
          </div>
        </div>
      </div>

      {/* Proof chips */}
      <div className="absolute -top-4 -right-1 flex items-center gap-2 rounded-2xl border border-biru-100 bg-putih px-3 py-2 shadow-lg motion-safe:animate-muncul motion-safe:[animation-delay:220ms] sm:-right-6">
        <span className="grid size-8 place-items-center rounded-full bg-daun-100 text-daun-700">
          <IconCheck className="size-4" />
        </span>
        <div className="leading-tight">
          <p className="text-small font-bold text-arang-900">Disurvei 5 September</p>
          <p className="text-micro text-arang-500">oleh Dina Anggraeni</p>
        </div>
      </div>

      <div className="absolute top-[50%] -left-1 motion-safe:animate-muncul motion-safe:[animation-delay:340ms] sm:-left-8">
        <div className="flex items-center gap-2 rounded-2xl border border-biru-100 bg-putih px-3 py-2 shadow-lg motion-safe:animate-melayang">
          <span className="grid size-8 place-items-center rounded-full bg-biru-100 text-biru-600">
            <IconSuara className="size-4" />
          </span>
          <div className="leading-tight">
            <p className="text-small font-bold text-arang-900 tabular-nums">Selisih 15 dB</p>
            <div className="mt-1 flex items-end gap-0.5" aria-hidden="true">
              {[3, 5, 8, 6, 4, 7, 3].map((h, i) => (
                <span key={i} className={cn("w-1 rounded-full", i < 4 ? "bg-biru-500" : "bg-biru-100")} style={{ height: `${h * 2}px` }} />
              ))}
              <span className="ml-1 text-micro text-arang-500">terdengar samar</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 right-3 rounded-2xl border border-biru-100 bg-putih px-3 py-2 shadow-lg motion-safe:animate-muncul motion-safe:[animation-delay:460ms] sm:-right-4">
        <p className="text-micro font-bold text-arang-500">Total per bulan</p>
        <p className="text-small font-bold text-arang-900">sudah semua, bukan sewa saja</p>
      </div>
    </div>
  );
}

// A flat, geometric room: window with sky, curtain, bed, desk, plant.
function Kamar() {
  return (
    <svg viewBox="0 0 320 240" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" fill="none">
      {/* wall + floor */}
      <rect width="320" height="240" className="fill-langit-100" />
      <rect y="170" width="320" height="70" className="fill-kayu-100" />
      <path d="M0 170h320" className="stroke-kayu-500" strokeWidth="1.5" strokeOpacity="0.5" />
      <g className="stroke-kayu-500" strokeWidth="1" strokeOpacity="0.35">
        <path d="M0 192h320M0 214h320" />
        <path d="M60 170v70M150 170v70M240 170v70" />
      </g>

      {/* window */}
      <rect x="182" y="34" width="104" height="82" rx="6" className="fill-putih" />
      <rect x="188" y="40" width="92" height="70" rx="3" className="fill-biru-100" />
      <path d="M188 92c14-12 30-10 44-2s30 8 48-6v26h-92z" className="fill-biru-500" fillOpacity="0.25" />
      <circle cx="262" cy="58" r="9" className="fill-putih" />
      <path d="M234 74c4-6 12-6 16 0h-16zM206 64c6-8 18-8 24 0h-24z" className="fill-putih" />
      <path d="M234 40v70M188 76h92" className="stroke-putih" strokeWidth="3" />
      {/* curtain */}
      <path d="M170 28h22v96h-22c8-16 8-32 0-48s-8-32 0-48z" className="fill-biru-500" fillOpacity="0.85" />
      <path d="M176 28c10 24 10 72 0 96" className="stroke-putih" strokeWidth="1.5" strokeOpacity="0.4" />

      {/* bed */}
      <rect x="28" y="120" width="150" height="14" rx="4" className="fill-biru-600" />
      <rect x="22" y="132" width="164" height="42" rx="8" className="fill-putih" />
      <rect x="22" y="132" width="164" height="42" rx="8" className="stroke-biru-100" strokeWidth="1.5" />
      <path d="M22 156h164" className="stroke-biru-100" strokeWidth="1.5" />
      <rect x="34" y="138" width="46" height="18" rx="5" className="fill-biru-100" />
      <rect x="88" y="140" width="98" height="34" rx="7" className="fill-biru-500" fillOpacity="0.9" />
      <path d="M100 150h70M100 160h44" className="stroke-putih" strokeWidth="2" strokeOpacity="0.5" />
      <rect x="28" y="172" width="10" height="16" rx="2" className="fill-biru-600" />
      <rect x="170" y="172" width="10" height="16" rx="2" className="fill-biru-600" />

      {/* desk + lamp */}
      <rect x="208" y="132" width="86" height="8" rx="3" className="fill-kayu-500" />
      <rect x="214" y="140" width="6" height="34" className="fill-kayu-500" />
      <rect x="282" y="140" width="6" height="34" className="fill-kayu-500" />
      <rect x="226" y="112" width="30" height="20" rx="3" className="fill-arang-900" />
      <rect x="229" y="115" width="24" height="14" rx="2" className="fill-biru-100" />
      <path d="M270 132v-18" className="stroke-arang-900" strokeWidth="2" />
      <path d="M262 114h16l-4-10h-8z" className="fill-arang-900" />
      <circle cx="270" cy="104" r="3" className="fill-putih" />

      {/* plant */}
      <path d="M296 174h18l-2-22h-14z" className="fill-kayu-500" />
      <path d="M305 152c-2-14-14-20-22-16 4 10 12 14 22 16zM305 152c2-16 14-22 22-18-4 10-12 16-22 18zM305 152c-8-6-6-20 0-26 6 6 8 20 0 26z" className="fill-daun-500" />

      {/* frame on wall */}
      <rect x="66" y="52" width="60" height="44" rx="4" className="fill-putih" />
      <rect x="72" y="58" width="48" height="32" rx="2" className="fill-daun-100" />
      <path d="M74 88l14-16 10 10 8-8 14 14z" className="fill-daun-500" fillOpacity="0.8" />
      <circle cx="108" cy="66" r="4" className="fill-putih" />
    </svg>
  );
}
