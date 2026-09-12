# Task 01 — Foundation and design system

**Tujuan (ID):** menyiapkan proyek, token desain, komponen dasar, dan kerangka dua surface.

Read `CLAUDE.md` first.

## Scope

Set up the Next.js project and build the design system primitives. **No product pages yet.**

## Steps

1. Initialise Next.js (App Router, TypeScript, Tailwind, ESLint, `src/` dir off, import alias `@/`).
2. Configure `next/font` with Plus Jakarta Sans, weights 400/500/700/800, `display: "swap"`,
   subset latin. Set `lang="id"` on `<html>`.
3. Translate the colour and type tokens from `CLAUDE.md` section 5 into `tailwind.config.ts` as
   named tokens (`biru-500`, `jingga-500`, `arang-900`, `kertas-50`, …) and a type scale
   (`text-display`, `text-price`, …). No component may use a raw hex value afterwards.
4. Create the route groups `app/(user)` and `app/(mitra)` with separate root layouts. The user
   layout has the bright shell; the mitra layout is a plain calm shell. They must not share a header.
5. Build these primitives in `components/ui/`, each with keyboard support and visible focus:
   - `Button` — variants: `primary` (orange, one per screen), `secondary` (blue outline),
     `ghost`; sizes `sm` / `md` / `lg`; loading state.
   - `Chip` — toggleable filter pill, with a selected state that does not rely on colour alone.
   - `Sheet` — bottom sheet on mobile, side panel ≥768px, with focus trap and Escape to close.
   - `Accordion` — animated height, `prefers-reduced-motion` aware.
   - `Skeleton` — shimmer that does not shift layout.
   - `Badge` — small status label.
6. Build `lib/format.ts`: `formatRupiah(n)` → `Rp1.550.000` (no decimals), `formatJarak(m)` →
   `450 m` / `1,2 km`, `formatWaktuRelatif(date)` → `3 hari lalu` / `baru saja`, all `id-ID`.
7. Build the user-surface `Header` (logo, compact search entry, saved-items icon) and `Footer`
   (links plus the single "Punya kos? Gabung jadi mitra" link to the mitra surface).
8. Create `/app/(user)/kitchensink/page.tsx` rendering every primitive in every state. This page
   is dev-only and must be deleted in task 09.

## Acceptance

- `npm run build` passes with zero TypeScript errors.
- Kitchensink renders correctly at 360px and 1440px.
- Every interactive element reachable by Tab with a visible focus ring.
- Turning on "reduce motion" in the OS removes all non-essential animation.
- Grep for `#` hex values in `components/` returns nothing outside `tailwind.config.ts`.

## Do not

- Do not install a component library (MUI, Chakra, shadcn). Primitives are hand-built.
- Do not build any page from the sitemap yet.
- Do not add a dark mode.
