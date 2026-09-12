# Task 08 — Owner surface (mitra.kosbahagia.com)

**Tujuan (ID):** tempat pemilik kos update ketersediaan dan lihat angka yang menjual paket Premium.

Read `CLAUDE.md` first. Route group `app/(mitra)/`. Different layout, different tone: calm, dense,
utilitarian. Zero illustration. Assume the user is 50+ years old and on a mid-range phone.

## Pages

1. **`/` landing** — sells the actual service, not features. The pitch is:
   *fotonya kami yang urus, hasilnya jadi milik Bapak/Ibu, dan kos Anda tampil paling atas di area
   ini.* Show a real before/after photo pair. Pricing table for the three tiers, honest about what
   money does and does not buy: **it does not change the score.** One form, one button.
2. **`/daftar`** — short application form: name, WhatsApp, kos name, address, number of rooms. That
   is all. We survey in person, so do not ask them to type 40 fields they will abandon.
3. **`/dashboard`** — one screen with: rooms available per kos, last confirmed date, views and
   WhatsApp clicks this month, and any pending user reports.
4. **`/dashboard/ketersediaan`** — the most important screen. One big number per room type with
   `−` and `+` buttons and a single `Simpan` button. Nothing else. This must be usable in under
   ten seconds with one thumb.
5. **`/dashboard/kos/[id]`** — edit prices, description, rules, photos. **Survey-measured fields
   (all scores, dB readings, wall material, surveyor notes, red flags) are read-only**, shown with
   a note explaining they come from our visit. Owners can file a correction request, which creates
   a task for the survey team rather than editing the data.
6. **`/dashboard/statistik`** — views, WhatsApp clicks, position in area search, and a comparison
   against the area median. This screen sells the Premium tier by itself; do not add sales copy to
   it beyond one contextual line when performance is below median.
7. **`/dashboard/paket`** — current tier, what the next tier adds, and a WhatsApp button to our
   team. No online payment.

## Availability updates come through WhatsApp, not this dashboard

Owners will not log in weekly. Build a scheduled job that every Monday sends owners with stale
availability a WhatsApp message with a one-tap magic link to `/dashboard/ketersediaan` that
authenticates and opens directly on the right kos. The dashboard is the fallback, the message is
the mechanism.

Log every update to `log_ketersediaan` with its `sumber` so we can see which channel actually works.

## Auth

Supabase Auth, WhatsApp OTP or magic link. Separate cookie scope from the renter surface. RLS must
make it impossible for one owner to read another owner's rows — write a test that proves it.

## Acceptance

- A renter browsing the main site sees no owner UI anywhere except the one footer link.
- Availability can be updated in under 10 seconds on a phone.
- An owner cannot modify any survey-measured field or any red flag.
- Owner A cannot read owner B's data, proven by test.
- Every screen is legible at 200% browser zoom.

## Do not

- Do not add payment processing.
- Do not let tier affect Skor Bahagia in any code path.
- Do not build bulk import, multi-user accounts or role permissions.
