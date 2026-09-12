# Task 05 — Listing detail page

**Tujuan (ID):** halaman tempat keputusan terjadi. Semua data rubrik tampil di sini, termasuk yang jelek.

Read `CLAUDE.md` first. Route: `app/(user)/kos/[slug]/page.tsx`, statically generated with
revalidation; availability fetched fresh on the client.

## Block order — this sequence is deliberate

It follows the order of questions in a renter's head. Do not rearrange.

| # | Block | Notes |
|---|---|---|
| 1 | Gallery | Swipeable, 4:3, counter, 360° entry point (built in task 06) |
| 2 | Name, area, distance to landmark | |
| 3 | **Skor Bahagia + breakdown** | Tapping opens an accordion showing all five components with their raw measurements |
| 4 | **Rincian biaya** | Real total as the headline; accordion lists rent, electricity model and estimate, water, trash, parking, laundry, deposit, minimum duration. Room-type switcher if there is more than one |
| 5 | **Kebersihan & kedap suara** | Show the evidence, not just the score: wall material, dB ambient vs test, who cleans and how often, trash pickup frequency |
| 6 | Fasilitas | Grouped kamar / bersama. Grey out what is absent rather than hiding it — absence is information |
| 7 | Aturan | Curfew, guests, couples, children, pets, cooking, smoking |
| 8 | **Cara ke sini** | Minimap (task 06) |
| 9 | Sekitar | Minimarket, warung with price range, laundry per kg, transit, alley access, street lighting, flood risk |
| 10 | **Catatan surveyor** | Three good things, three things to know, named surveyor with survey date. Red flags render above this in a red panel that cannot be collapsed |
| 11 | Ketersediaan | Rooms left, last confirmed, and a `Kamarnya sudah penuh?` report button |
| 12 | Kos serupa | 3 cards: same area, ±20% total price |

## Sticky action bar

Always visible at the bottom on mobile, in the sidebar on desktop:

```
Rp1.550.000/bln
total sudah semua
[ Chat pemilik ]   ← the one orange button on this page
```

`lib/wa.ts` builds the link with a prefilled Indonesian message naming the kos, the room type and
the real total, and **inserts a `klik_wa` row before opening it**. The insert must not block the
link from opening — fire it, then navigate.

## Missing data

Any block with no data renders as `Belum kami catat` in grey, not as an empty section and never as
a guessed value. A page with half the rubric missing must still look deliberate.

## SEO

`generateMetadata` with the kos name, area, real total price and top two strengths. JSON-LD as
`Product` with `offers`. OpenGraph image generated from the first photo with the price overlaid.

## Acceptance

- Every rubric field from the survey document has a place on this page.
- Red flags cannot be collapsed, hidden or reordered by tier.
- Changing the room type updates the price, facilities and the WhatsApp message.
- Lighthouse SEO ≥ 95, accessibility ≥ 95.
- The page is fully readable and the WhatsApp button works while signed out.

## Do not

- Do not add star ratings or user reviews.
- Do not hide the electricity model behind a tooltip — it is main content.
- Do not autoplay video or preload the 360° tour.
