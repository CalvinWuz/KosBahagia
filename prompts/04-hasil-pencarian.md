# Task 04 — Search results

**Tujuan (ID):** mesin utama web. Filter yang tidak melelahkan, harga total riil, tanpa layar buntu.

Read `CLAUDE.md` first. This page is the product. Budget the most time here.

## Core principle

The failure we are fixing: competitors show a wall of 40 checkboxes before showing any result.
Here, **results come first and filters narrow them afterwards.** A user must never be asked to
think before seeing something.

## Layout

**Mobile**
```
sticky top:
  [←] Tebet                          [Peta]
  [Semua][≤1,5jt][Km dalam][Bersih][+ Filter]   ← horizontal scroll chips
  84 kos · Termurah ▾                           ← count updates live
scroll:
  KosCard ...
```

**Desktop (≥1024px)** — results list on the left (max 720px), map sticky on the right. This is the
real payoff of a wide screen, not extra animation.

## Filters

- Chips are the primary control. Tapping one applies immediately — no "Apply" button.
- `+ Filter` opens a `Sheet` with the full set, grouped: Harga · Kamar · Kebersihan & suara ·
  Aturan · Fasilitas. Inside the sheet the primary button reads the live count:
  `Lihat 23 kos`.
- **Sliders, not checkboxes**, for cleanliness, soundproofing and wifi speed. They are scales.
- **Negative filters** in their own group: `Sembunyikan yang ada jam malam`,
  `Sembunyikan tanpa kamar mandi dalam`, `Sembunyikan yang jauh dari minimarket`.
- The result count in the header updates on every filter change, including while the sheet is open.
- All filter state lives in the URL query string so results are shareable and the back button works.

## KosCard

```
[photo 4:3, lazy]        [SkorBadge 8,4]  [360° pill if available]
Kos Melati Putri
7 mnt jalan ke Stasiun Tebet
Rp1.550.000 /bln                          ← text-price, this is total_bulanan
sewa 1,2jt + listrik + air + sampah       ← text-micro, arang-500
[🧼 Bersih] [🔇 Kedap suara]              ← max 2 strength chips, derived from scores
Dikonfirmasi 3 hari lalu                  ← or "Perlu dikonfirmasi" in amber if >30 days
                                    [♡] [⇄]
```

- `SkorBadge` shows "Belum dinilai" in grey when the score is null. Never invent a number.
- Only 2 kamar tersisa → small green line. 0 tersisa → card greys out and drops to the bottom.
- Spotlight and premium cards carry a small, honest label (`Mitra`). Do not disguise paid placement.

## States

- **Loading** — 6 skeleton cards, same height as real cards so nothing shifts.
- **Zero results** — never a dead end. Compute the single filter that costs the most results and
  offer to relax it: `Nggak ada yang pas. Longgarkan harga ke Rp1.800.000 → 14 kos` with a button
  that applies it. Below that, show 3 nearest kos outside the radius.
- **Error** — state what failed and give a retry button.

## Map toggle

- Map is a toggle over the same screen on mobile, not a separate route.
- MapLibre, clustered pins, price label on each pin, tapping a pin raises a mini card.
- Load the map bundle only when the toggle is first used (`next/dynamic`, `ssr: false`).

## Acceptance

- Changing any filter updates both the list and the count without a full page reload.
- Back button restores the exact previous filter state.
- First results render within 1.5s on Fast 3G; the map bundle is not in the initial JS payload.
- Scrolling 100 cards stays smooth on a mid-range Android.
- The zero-result screen always offers at least one working action.

## Do not

- Do not add an "Apply filters" button.
- Do not paginate with numbered pages; use infinite scroll with a visible "Muat lebih banyak"
  fallback button for accessibility.
- Do not show the rent-only price as the headline anywhere, under any circumstance.
