# Kos Bahagia — Project Context

> Paste this file at the repo root as `CLAUDE.md` (Claude Code) or `.cursorrules` (Cursor).
> It is the permanent context. Every task prompt in `prompts/` assumes this file has been read.
> Written in English for precision. **All user-facing copy must be Indonesian.**

---

## 1. What we are building

Kos Bahagia is a boarding-house ("kos") discovery platform for Indonesia. Every listing has been
physically visited and scored by our own survey team using a fixed rubric.

**Positioning in one line:** *Setiap kos di sini sudah kami datangi dan cek langsung.*

We do not try to be the biggest catalogue. Mamikos already won that. We win on **trust and data
accuracy** in a small geography — one sub-district at a time. Launch area: Jakarta (one kecamatan
or one campus radius first), second city Malang.

### The three things no competitor shows

These are the entire reason the product exists. If a trade-off must be made, protect these first.

1. **Real total monthly cost** — rent + electricity + water + trash + other fees, displayed as the
   headline number. Competitors show rent only, so a "Rp1.200.000" kos is really Rp1.550.000.
2. **Cleanliness and soundproofing scores** — measured on site with a fixed rubric, including an
   actual decibel test and wall-material observation.
3. **Surveyor notes** — three good things, three things you should know, written by a named human,
   plus safety red flags.

### Business model

We are a **bridge, not a broker**. No payments, no escrow, no bookings on-platform. Every listing
ends in a WhatsApp handoff to the owner. Revenue comes from owners:

| Tier | What the owner gets |
|---|---|
| `free` | Listed with our survey data and standard photos |
| `premium` | Professional photos, 360° virtual tour, short video, priority ranking in its area |
| `spotlight` | Limited slots at the top of an area's search results |

**A paid tier must never change the Skor Bahagia, hide a red flag, or alter survey data.** Paid
tiers affect ranking and media richness only. This rule is not negotiable — it is the product.

---

## 2. Non-goals

Do not build these. If a task seems to require one, stop and ask.

- Payments, escrow, deposits, booking flow
- In-app chat (WhatsApp deep links only)
- Native mobile app
- User-generated reviews with star ratings (we have surveyor data; reviews invite fake content)
- AI recommendations, chatbots
- Scraping competitor listings into the database
- Any feature that requires login before a user can search, view a listing, or contact an owner

---

## 3. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | SSR/SSG for SEO; people find kos through Google |
| Styling | Tailwind CSS | |
| Components | Headless UI primitives + our own; no heavy component kit | |
| Motion | Framer Motion | |
| Database | Supabase (Postgres + PostGIS) | radius queries built in |
| Auth | Supabase Auth — **owners only**, never renters | |
| File storage | Supabase Storage (dev) → Cloudflare R2 (prod, 360° files) | 360° files are large; R2 egress is free |
| Maps | MapLibre GL + MapTiler or OpenFreeMap | Google Maps bills per map load; unsafe for a student budget |
| Forms | react-hook-form + zod | |
| Hosting | Vercel | |
| Fonts | Plus Jakarta Sans (Google Fonts), self-hosted via `next/font` | |

Do not add a dependency without stating what it replaces. Prefer platform features over packages.

---

## 4. Two separate surfaces

| | Renter surface | Owner surface |
|---|---|---|
| Domain | `kosbahagia.com` | `mitra.kosbahagia.com` |
| Route group | `app/(user)/` | `app/(mitra)/` |
| Auth | none | required |
| Visual tone | bright, playful, image-led | calm, dense, utilitarian |
| Entry point | — | one small footer link: "Punya kos? Gabung jadi mitra" |

A renter must never see owner UI, admin controls, or the word "dashboard". The only bridge between
them is that single footer link.

---

## 5. Design system

The brief: cheerful and colourful like Traveloka, but with excellent usability. The governing rule:

> **Cheerful on the front door, calm in the working rooms.**
> Homepage and area pages may use illustration, shapes and motion.
> Search results and listing detail must be quiet — the photo, the price and the score are the
> only things allowed to shout.

### Colour

```
--biru-600  #1256B8   pressed / dark text on tint
--biru-500  #1D6FE0   primary brand
--biru-100  #DCEAFD   tints, chips, skeletons
--jingga-500 #FF7A1A  ONLY for the primary action (WhatsApp CTA, main search button)
--daun-500  #0E9F6E   good / verified / available
--merah-500 #DC2626   red flags, full rooms, errors
--arang-900 #16202E   body text
--arang-500 #5A6B80   secondary text
--kertas-50 #F7F9FC   page background
--putih     #FFFFFF   cards
```

Orange is scarce on purpose. If two orange things are on screen, one of them is wrong.
Use true `#FFFFFF` for cards, not a tinted near-white.

### Type

One family, Plus Jakarta Sans. Personality comes from weight and size contrast, not from a second
typeface.

```
display   32/38  800   homepage headline only
h1        24/30  700
h2        20/26  700
body      16/26  400   never below 16px for body on mobile
small     14/20  400
micro     12/16  500   freshness stamps, captions
price     28/32  800   tabular-nums
```

### Motion

- Functional motion only in `/cari` and `/kos/[slug]`: accordion open, sheet slide, gallery swipe.
- Durations 150–250ms, ease-out. One orchestrated entrance on the homepage, not one per section.
- Every animation must respect `prefers-reduced-motion: reduce`.
- Never animate anything that delays the first screen of search results.

### Copy rules (Indonesian)

- Sentence case everywhere. No ALL-CAPS labels.
- Buttons name the outcome: "Chat pemilik", "Lihat 84 kos", "Simpan kos ini". Never "Submit", "Kirim", "Selengkapnya".
- Informal-but-respectful register ("kamu", not "Anda"; not slang).
- Empty states propose a next action with a working button, never just state emptiness.
- Errors say what happened and what to do. They do not apologise.
- Do not append "→" to link or button text. Do not join metadata with middle dots.

### Quality floor (applies to every task, never stated in the UI)

Responsive from 360px up · visible keyboard focus rings · real `<button>`/`<a>` elements ·
labelled inputs · colour contrast ≥ 4.5:1 · alt text on every photo · reduced motion respected ·
no layout shift when images load.

---

## 6. Product rules the code must enforce

1. **Headline price is `total_monthly`, not `price_monthly`.** Rent appears below it in small grey
   text with its components listed. This is true on cards, detail pages and comparison.
2. **Skor Bahagia** is computed, never hand-entered. Formula in `lib/scoring.ts`:
   cleanliness 30% · soundproofing 20% · cost transparency 20% · facilities-for-price 15% ·
   surroundings 15%. Output 0–10, one decimal. A kos missing required inputs shows
   "Belum dinilai" — never a guessed number.
3. **Freshness is public.** Every listing shows when availability was last confirmed. Older than
   30 days → ranked down and labelled "Belum dikonfirmasi" on the renter side (owners see
   "Perlu dikonfirmasi"). Availability is per room type. Older than 90 days → hidden from
   default results.
4. **Safety red flags always render**, regardless of tier, in a red panel that cannot be collapsed.
5. **No login wall.** Search, detail and the WhatsApp handoff work signed-out. Auth is requested
   only when saving or comparing, and only after the user taps.
6. **Four taps maximum** from landing to WhatsApp: preset → result card → detail → chat.
7. Every WhatsApp handoff writes a row to `lead_click` before opening the link. This is the number
   we sell to owners.

---

## 7. Repo layout

```
app/
  (user)/
    page.tsx                  Beranda
    cari/page.tsx             Search results
    kos/[slug]/page.tsx       Listing detail
    area/[slug]/page.tsx      SEO landing per area/campus
    banding/page.tsx          Compare up to 3
    disimpan/page.tsx         Saved
    cara-kami-menilai/page.tsx
  (mitra)/
    page.tsx                  Owner landing
    daftar/page.tsx
    dashboard/...
  api/
components/
  ui/            primitives (Button, Chip, Sheet, Accordion)
  kos/           KosCard, SkorBadge, RincianBiaya, SkorRincian, Minimap, Tur360
  cari/          FilterBar, PresetGrid, HasilList, PetaHasil
lib/
  supabase/      client, server, types (generated)
  scoring.ts     Skor Bahagia + cost calculations
  wa.ts          WhatsApp link builder + lead logging
  format.ts      rupiah, distance, relative time (id-ID)
supabase/
  migrations/
  seed/
```

### Conventions

- TypeScript strict. No `any`. Database types generated by Supabase CLI, never hand-written.
- Server Components by default; `"use client"` only where interaction requires it.
- All currency formatting through `lib/format.ts`. Never inline `toLocaleString` in a component.
- Money stored as integer rupiah. No floats, no decimals.
- Never expose the Supabase service-role key to the client. RLS on every table.
- Comments and commit messages in English; UI strings in Indonesian, centralised per page.

---

## 8. Definition of done

A task is finished when: it builds with no TypeScript errors · it works at 360px and 1440px ·
loading, empty and error states exist · keyboard navigation works · reduced motion is respected ·
no hardcoded colours or font sizes outside the token system · the product rules in section 6 are
not violated.

If a requirement in a task prompt conflicts with this file, stop and ask rather than guessing.
