# Task 03 — Homepage

**Tujuan (ID):** halaman depan yang ceria, dengan satu kotak cari dan preset sekali tap.

Read `CLAUDE.md` first. This is one of only two pages allowed to be decorative.

## Job of this page

Get a first-time visitor into `/cari` with useful results in **one tap**, and explain in passing
why our prices look higher than other sites (because ours are the real total).

## Structure, mobile first

1. **Header** — logo, saved icon. No navigation menu.
2. **Hero** — headline over two lines max, one subline, one search input. Exactly one input; no
   tabs, no date pickers, no dropdowns beside it. Placeholder: `Cari area atau kampus`.
   The search input opens a full-screen sheet on focus (mobile) with recent searches, popular
   areas and typeahead over `area` and `kos.nama`.
3. **Preset grid** — 4–6 large tappable cards, two per row on mobile. Each is a preset filter
   combination, each goes straight to `/cari` with query params:
   - `Hemat buat mahasiswa` → price ≤ 1.2jt, sorted by total price
   - `Bersih & tenang` → cleanliness ≥ 4, soundproofing ≥ 4
   - `Bawa pasangan` → couples allowed
   - `Dekat kampus` → opens campus picker, then radius 2 km
   - `Kamar mandi dalam` → facility filter
   - `Bebas jam malam` → no curfew
4. **"Baru disurvei minggu ini"** — horizontal scroll of 6 `KosCard`s, newest `disurvei_pada`
   first. This is proof the team is active; if there is nothing this week, widen to this month
   rather than hiding the section.
5. **Cost explainer** — a short two-column comparison showing the same room as advertised
   elsewhere (rent only) versus here (real total), with the components listed. Two sentences of
   copy, no more. This section prevents the "why is this site expensive" bounce.
6. **How we verify** — three short points (we visit, we measure, we publish the bad parts) linking
   to `/cara-kami-menilai`.
7. **Footer** — includes the single mitra link.

## Visual direction

The identity device for this brand is the **hand-drawn wayfinding sketch** — the "belok kiri di
warung biru" language of Indonesian directions. Use it as the hero illustration: a loose route with
a pin at the end. Do not use floating blobs, gradient meshes or generic 3D shapes; they belong to
every other site.

- Blue background wash in the hero only; the rest of the page is `kertas-50`.
- Orange appears once: the search button.
- One orchestrated entrance animation on load (hero sketch draws itself once, ≤600ms). No
  fade-and-slide on every section as it scrolls into view.

## Acceptance

- One tap from landing to a populated `/cari` for every preset.
- Preset cards are ≥44px tall and reachable by keyboard.
- Hero renders and is interactive before the illustration finishes loading.
- LCP under 2.5s on simulated Fast 3G.
- Page works with JavaScript disabled far enough to submit the search.

## Do not

- Do not put a login prompt, newsletter modal or cookie wall on this page.
- Do not show more than 6 preset cards — the point is fewer decisions, not more.
- Do not add a testimonial section. We have no users yet and fake ones are worse than none.
