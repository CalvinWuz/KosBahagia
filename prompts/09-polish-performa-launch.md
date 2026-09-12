# Task 09 — Polish, performance, launch readiness

**Tujuan (ID):** tahap yang menentukan apakah web ini terasa profesional atau seperti tugas kuliah.

Read `CLAUDE.md` first. Do this last, and do not skip it.

## Performance budgets — treat as hard limits

| Metric | Limit |
|---|---|
| LCP on Fast 3G, `/cari` | ≤ 2.5s |
| Initial JS, `/cari` | ≤ 180KB gzipped |
| Initial JS, `/kos/[slug]` | ≤ 200KB gzipped, excluding the 360° library |
| CLS, every page | ≤ 0.05 |
| Largest photo delivered to a 360px screen | ≤ 120KB |

Steps: audit the bundle and dynamically import anything not needed on first paint (map, 360°
viewer, compare table) · serve AVIF with WebP fallback through `next/image` with explicit
dimensions and blurhash placeholders · verify no Server Component accidentally became a Client
Component · check font loading causes no layout shift.

## Accessibility pass

Full keyboard walkthrough of the four-tap journey · axe with zero critical issues · screen-reader
pass on `/kos/[slug]` including the minimap alternative text · contrast verified against the real
tokens, especially orange on white · every form input labelled · focus visible everywhere.

## Copy pass

Read every string on the site aloud. Fix: anything in ALL-CAPS, any "Selengkapnya" or "Submit",
any error that apologises or is vague, any empty state without a button, any English word that has
a normal Indonesian equivalent, any inconsistency where the same action has two names.

## Trust pass

- `/cara-kami-menilai` must exist and fully explain the rubric, including the statement that paid
  tiers cannot change the score. Without this page the "verified" claim is not credible.
- Paid placements are labelled honestly wherever they appear.
- Every listing shows its survey date and surveyor name.
- Red flags render on every tier — test this with a premium kos that has one.

## Launch checklist

`sitemap.xml` and `robots.txt` · analytics that respects privacy (Plausible or Umami, not GA) ·
error tracking · a basic uptime check · 404 and 500 pages in the brand voice · the mitra subdomain
excluded from indexing · delete `/kitchensink` · seed data replaced with real surveyed listings ·
at least 30 real kos published before announcing anything.

## Human testing, not agent testing

Give five people who have never seen the site one task: find a kos under a budget in a chosen area
and contact the owner. Watch without helping. Write down every place they hesitated. Fix the top
three. Repeat once.

## Do not

- Do not launch with seed data visible.
- Do not add features in this phase. Anything new goes in a backlog for after launch.
