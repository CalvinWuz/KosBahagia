# Task 02 — Database schema and seed data

**Tujuan (ID):** skema Supabase asli sesuai rubrik survei, plus 40 kos dummy yang realistis.

Read `CLAUDE.md` first. This schema mirrors the field survey rubric one-to-one, so survey data can
be entered without reshaping anything later.

## Steps

1. Enable `postgis` and `pg_trgm` in Supabase.
2. Write migrations for these tables. All money is `integer` rupiah. All scores are `smallint` 1–5
   and **nullable** — a missing measurement stays null and is never defaulted to a middle value.

```
area              id, slug, nama, tipe(kecamatan|kampus|stasiun), lokasi geography(Point),
                  deskripsi, seo_judul, seo_deskripsi

kos               id, slug, nama, alamat, rt_rw, lokasi geography(Point), area_id,
                  tipe(putra|putri|campur), jumlah_kamar, jumlah_lantai, ada_lift,
                  tahun_bangunan, kontak_nama, whatsapp, penjaga(pemilik|harian|tidak_tetap|tidak_ada),
                  status(draft|tayang|arsip), tier(free|premium|spotlight),
                  owner_id, disurvei_pada, surveyor, ketersediaan_dikonfirmasi_pada

tipe_kamar        id, kos_id, nama, ukuran, harga_bulanan, harga_tahunan, durasi_minimal,
                  deposit, deposit_kembali(ya|tidak|sebagian), model_listrik(termasuk|token|flat|meteran),
                  estimasi_listrik, boleh_ac, biaya_ac, biaya_air, laundry(termasuk|tidak_ada|berbayar),
                  biaya_laundry, parkir_motor, biaya_parkir_motor, parkir_mobil, biaya_parkir_mobil,
                  biaya_lain jsonb, kamar_tersedia, total_kamar,
                  total_bulanan integer GENERATED ALWAYS AS (...) STORED

kos_penilaian     kos_id PK, skor_kamar_mandi, skor_dapur, skor_koridor, pembersih, frekuensi_bersih,
                  frekuensi_sampah, material_tembok, db_ambient, db_tes, skor_kedap,
                  hadap_jalan_raya, sumber_bising text[]

fasilitas         id, slug, nama, kategori(kamar|bersama), ikon, bisa_difilter boolean
kos_fasilitas     kos_id, fasilitas_id  (composite PK)

kos_aturan        kos_id PK, jam_malam time null, tamu(boleh|ruang_tamu|tidak), lawan_jenis,
                  pasangan(boleh|tidak|surat_nikah), anak, hewan, masak_di_kamar,
                  merokok(kamar|luar|dilarang), mayoritas_penghuni, suasana

kos_sekitar       kos_id PK, landmark_nama, landmark_jarak_m, landmark_menit_jalan,
                  rute jsonb, minimarket jsonb, warung jsonb, laundry jsonb, transit jsonb,
                  akses(motor|mobil|jalan_kaki), penerangan smallint, rawan_banjir

kos_media         id, kos_id, jenis(foto|foto360|patokan), url, keterangan, urutan, lebar, tinggi, blurhash

catatan_surveyor  kos_id PK, hal_baik text[], perlu_diketahui text[], kesan_pemilik,
                  red_flags text[]

log_ketersediaan  id, kos_id, tipe_kamar_id, kamar_tersedia, sumber(survei|pemilik|bot_wa|laporan_user), dibuat_pada
laporan_user      id, kos_id, jenis(penuh|harga_beda|tutup|lainnya), catatan, dibuat_pada
klik_wa           id, kos_id, sumber(detail|kartu|banding), dibuat_pada, referrer
owner             id (= auth.users.id), nama, whatsapp, terverifikasi_pada
```

3. Add a GiST index on `kos.lokasi`, a trigram index on `kos.nama` and `area.nama`, and a plain
   index on `kos.ketersediaan_dikonfirmasi_pada`.
4. Write `lib/scoring.ts` implementing Skor Bahagia exactly as specified in `CLAUDE.md` section 6:
   - cleanliness = mean of the three cleanliness scores (skip nulls, require at least two)
   - soundproofing = `skor_kedap`
   - cost transparency = `5 * (1 - min(((total_bulanan - harga_bulanan) / total_bulanan) / 0.35, 1))`
   - facilities-for-price = filterable-facility count ranked against other kos in the same
     Rp250k price bucket, mapped to 1–5
   - surroundings = mean of walk-time score, `penerangan`, and nearby-amenity availability
   - Returns `null` when cleanliness or soundproofing is missing. Export the per-component
     breakdown too — the detail page shows it.
   Unit-test this function with at least 8 cases including all-null and all-max.
5. Write a Postgres function `cari_kos(...)` taking centre point, radius, price range, kos type,
   min cleanliness, min soundproofing, facility slugs, rule filters, sort, limit, offset. It
   returns rows plus a **total count** — the live result count in the UI depends on it.
   Ordering: spotlight first (max 2), then premium, then by the chosen sort. Listings whose
   availability is older than 30 days are pushed down; older than 90 days are excluded.
6. RLS: everything public-readable where `status = 'tayang'`; writes only by the owning `owner_id`
   or the service role. `klik_wa` and `laporan_user` are insert-only for anonymous users.
7. Seed 40 kos in one Jakarta kecamatan and 10 in Malang. Make them **realistic, not uniform**:
   a spread of prices Rp800k–Rp3jt, several with null scores, at least three with red flags, two
   with stale availability, a mix of tiers, and electricity models that differ so the real-total
   number actually varies. Use placeholder image URLs with correct dimensions.
8. Generate types with the Supabase CLI into `lib/supabase/types.ts`.

## Acceptance

- Migrations run from empty and re-run cleanly.
- `cari_kos` returns correct counts for at least 5 hand-checked filter combinations.
- `lib/scoring.ts` tests pass, including the null cases.
- No seeded kos has a fabricated score where the rubric field is null.

## Do not

- Do not store a computed `skor_bahagia` column that can drift. Compute it, or use a view.
- Do not let `tier` appear anywhere in the scoring function.
