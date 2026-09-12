# Task 06 — Wayfinding minimap and 360° tour

**Tujuan (ID):** dua fitur yang tidak bisa ditiru kompetitor tanpa datang ke lokasi.

Read `CLAUDE.md` first. These two components carry the brand. Build them well.

## A. Minimap "Cara ke sini"

Not a real map. A stylised route from the nearest well-known landmark to the front gate, in the way
Indonesians actually give directions: by visual landmarks, not street names.

**It must be a reusable component driven by data, not a per-kos illustration.** 150 hand-drawn maps
is an unpayable debt. Data comes from `kos_sekitar.rute`:

```json
{
  "landmark": { "nama": "Stasiun Tebet", "ikon": "stasiun" },
  "langkah": [
    { "teks": "Keluar pintu barat, jalan lurus 200 m", "ikon": "lurus" },
    { "teks": "Belok kiri di warung cat biru", "ikon": "belok-kiri", "foto_id": "..." },
    { "teks": "Masuk gang kedua, kos di kanan, pagar hijau", "ikon": "tujuan", "foto_id": "..." }
  ],
  "total_menit": 7,
  "akses": "motor"
}
```

Render as an SVG path with 2–4 nodes, landmark icon at the start, a pin at the end, walking time in
the middle. Beside each step with a `foto_id`, show a small thumbnail of the actual landmark photo
that opens full-screen on tap. Accompany it with the same steps as an ordered text list — the map
is the appealing form, the list is the accessible and screenshot-friendly one.

Style it in the same loose hand-drawn language as the homepage hero so the brand reads as one thing.

Constraints: pure SVG, no map library, no network request, under 15KB, legible at 320px wide,
`role="img"` with a text alternative that reads the whole route.

## B. 360° virtual tour

Source: the team's Insta360 output, equirectangular JPEG.

- Render with a lightweight sphere viewer. Load the library **only after the user taps**
  (`next/dynamic`, `ssr: false`).
- Never auto-load. Show a blurred thumbnail with a `Lihat 360°` overlay. A 10MB auto-download on
  mobile data will lose the user permanently.
- Show file size on the trigger: `Lihat 360° · 4 MB`.
- Hotspots to move between points (kamar → koridor → dapur → halaman).
- Fallback for unsupported devices or WebGL failure: the flat photo set with a short explanation.
- Pipeline: on upload, generate a 2048px preview and a 6144px full version; serve the preview first
  and swap in the full version once loaded. Store on R2.
- Gyroscope control on mobile behind an explicit toggle, never on by default.

## Acceptance

- Minimap renders correctly for a kos with 2 steps and one with 4 steps.
- Minimap route is fully understandable to a screen reader.
- Detail page initial JS payload does not include the 360° library.
- With WebGL disabled, the fallback appears without a console error.
- Tested on a mid-range Android over 4G, not on desktop wifi only.

## Do not

- Do not replace the real map on `/cari` with this. It is a detail-page component only.
- Do not preload, autoplay or auto-rotate the tour.
- Do not require the 360° tour to exist for the page to look complete.
