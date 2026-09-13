# Kos Bahagia

Boarding-house discovery platform for Indonesia. Every listing has been visited
and scored by our own survey team. Read `CLAUDE.md` first — it is the permanent
project context. Task prompts live in `prompts/` and are run one at a time.

## Develop

```bash
npm install
npm run dev
```

- Design-system preview (dev only): http://localhost:3000/kitchensink
- Tokens: `app/globals.css` (`@theme`) — the only file allowed to contain a hex colour or a px font size.
- Primitives: `components/ui/`
- Formatting helpers: `lib/format.ts`

## Database (Supabase, local)

Needs Docker Desktop running. The CLI is a dev dependency, so use `npx`.

```bash
npx supabase start          # first run pulls images (a few GB)
npx supabase db reset       # runs supabase/migrations/* then supabase/seed/*.sql
npx supabase test db        # pgTAP checks for cari_kos, kos_skor and RLS
npm run db:types            # regenerates lib/supabase/types.ts (never hand-edit)
```

- Schema: `supabase/migrations/` — enums → tables → `kos_skor` view + `cari_kos()` → RLS.
- Seed: `supabase/seed/generate.ts` writes `supabase/seed/01_seed.sql` (`npm run seed:generate`). 40 kos in Palmerah (Jakarta Barat), 10 in Lowokwaru (Malang).
- Skor Bahagia lives in two places on purpose: `lib/scoring.ts` (UI breakdown, unit-tested) and the `kos_skor` view (search ranking). `npm run cek:skor-db` proves they agree on the seed.

## Map

`/cari` uses MapLibre GL with OpenFreeMap tiles (no key). MapLibre ≥ 6 loads its
worker as a separate module, so `scripts/salin-maplibre.mjs` copies it into
`public/maplibre/` before `dev` and `build` (gitignored). The map bundle is
loaded with `next/dynamic` only when the map is shown.

## Minimap and 360° tour (detail page)

- **Minimap** (`components/kos/Minimap.tsx`) is pure SVG driven by `kos_sekitar.rute`
  (format in `prompts/06`, parser in `lib/kos/rute.ts`). No per-kos illustrations.
- **360° tour** (`components/kos/tur360/`) is a raw-WebGL equirectangular viewer with
  no library. It loads only after "Lihat 360°" is tapped, preview (2048 px) first,
  then the full file; WebGL missing → flat photos. Gyroscope is behind a toggle.
- Pipeline: `npm run proses:360 -- ./kamar.jpg --titik kamar --slug <kos>` makes the
  2048/6144 px files and prints the `kos_media` row; push the files to R2 with wrangler.

## Area pages, saved, compare

- `/area/[slug]` is SSG (daily revalidation) and only generated for areas with at least
  5 fresh listings (`MIN_LISTING_AREA` in `lib/area/data.ts`); thinner areas 404.
  Facts and FAQ answers come from `statistik_area()`; the paragraph is `area.deskripsi`,
  written by hand per area — never templated or generated.
- `/disimpan` and `/banding` work signed out from localStorage (`lib/simpan.ts`).
  A comparison is shareable as `/banding?kos=slug-a,slug-b,slug-c` and renders server-side.
- `sitemap.xml` and `robots.txt` come from `app/sitemap.ts` / `app/robots.ts`.

## Check

```bash
npm run build      # must pass with zero TypeScript errors
npm run lint
npm run typecheck
npm test           # node:test — lib/**/*.test.ts
```

## Surfaces

| Surface | Route group | Host |
|---|---|---|
| Renter | `app/(user)/` | kosbahagia.com |
| Owner (mitra) | `app/(mitra)/` | mitra.kosbahagia.com (`NEXT_PUBLIC_MITRA_URL`) |
