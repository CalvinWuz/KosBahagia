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
