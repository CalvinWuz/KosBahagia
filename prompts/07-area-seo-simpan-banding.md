# Task 07 — Area pages, saved list, comparison

**Tujuan (ID):** mesin pertumbuhan dari Google, plus dua fitur bantu keputusan.

Read `CLAUDE.md` first.

## A. Area pages — `/area/[slug]`

This is how strangers find us. People type "kos murah dekat Binus" into Google; they do not open
Mamikos. Statically generated, revalidated daily.

Each page contains original content we own because we surveyed it:

1. H1 and one paragraph written per area (stored in `area.deskripsi`, not templated).
2. **Area facts**, computed from our data: number of kos surveyed, median real total price,
   price range, share with private bathrooms, typical electricity model, average meal price nearby.
   These numbers are our moat — nobody else has them.
3. Listings in the area, using the same `KosCard`.
4. `Kos dekat sini juga` — 3 neighbouring areas.
5. FAQ block with `FAQPage` JSON-LD, questions drawn from real search phrasing
   ("Berapa harga kos di Tebet?", "Kos di Tebet ada yang bebas jam malam?").

Metadata, canonical URL, OpenGraph, `ItemList` JSON-LD, and an entry in `sitemap.xml`.

**Never publish an area page with fewer than 5 listings.** A thin page damages the whole domain's
ranking. Gate it in the generator.

## B. Saved — `/disimpan`

- Works signed-out using `localStorage`.
- On sign-in, merge local saves into the account. Never silently discard them.
- Each saved card shows whether the price or availability changed since it was saved.
- Empty state links back to the presets.

## C. Compare — `/banding`

- Maximum 3 kos. Adding a fourth asks which one to drop.
- Attribute rows in this order: real total price · price breakdown · Skor Bahagia · cleanliness ·
  soundproofing · room size · private bathroom · AC · curfew · distance to landmark · availability.
- **Highlight the differences, not the whole table.** Rows where all three are identical collapse
  into a "Sama semua" group at the bottom.
- On mobile the table scrolls horizontally with the attribute column frozen.
- Shareable via URL (`?kos=a,b,c`) so a student can send it to their parents. This is the actual
  use case — design for the screenshot.

## Acceptance

- Area page scores ≥ 95 on Lighthouse SEO and renders fully server-side.
- Generator refuses to build an area page with fewer than 5 listings.
- Saved items survive a page refresh while signed out.
- A shared comparison URL opens the same three kos for someone else.

## Do not

- Do not generate area descriptions with an LLM at build time. Write them once, by hand, per area.
- Do not put compare behind sign-in.
