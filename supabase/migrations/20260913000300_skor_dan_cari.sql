-- Task 02 · Skor Bahagia view and the cari_kos search function.
--
-- Skor Bahagia is never stored. This view computes it on read, and
-- lib/scoring.ts implements the identical formula for the UI breakdown.
-- Keep the two in sync (npm run cek:skor-db compares them on seed data).
-- `tier` must never appear in here.
--
-- Weights (CLAUDE.md §6): kebersihan 30 · kedap 20 · transparansi 20 ·
-- fasilitas 15 · sekitar 15. Each component is on a 1–5 (transparansi 0–5)
-- scale, contributes weight × component / 5, and the result is scaled to
-- 0–10 with one decimal. Kebersihan or kedap missing → skor NULL
-- ("Belum dinilai"). Sekitar missing → its weight is dropped, not guessed.

create or replace view kos_skor
with (security_invoker = on)
as
with termurah as (
  -- The headline room: cheapest real total per kos.
  select distinct on (kos_id) kos_id, harga_bulanan, total_bulanan
  from tipe_kamar
  order by kos_id, total_bulanan, harga_bulanan
),
fas as (
  select kf.kos_id, count(*)::integer as n
  from kos_fasilitas kf
  join fasilitas f on f.id = kf.fasilitas_id
  where f.bisa_difilter
  group by kf.kos_id
),
dasar as (
  select
    k.id as kos_id,
    t.harga_bulanan,
    t.total_bulanan,
    coalesce(fs.n, 0) as n_fasilitas,
    t.total_bulanan / 250000 as ember   -- integer division: Rp250k price bucket
  from kos k
  join termurah t on t.kos_id = k.id
  left join fas fs on fs.kos_id = k.id
  where k.status = 'tayang'
),
peringkat as (
  -- Mid-rank position of filterable-facility count within the bucket,
  -- scaled 0–1: (strictly fewer + half of the other ties) / (bucket size − 1).
  -- Most facilities → 1, fewest → 0, alone in the bucket → 0.5.
  select
    d.*,
    case
      when count(*) over (partition by ember) = 1 then 0.5
      else (
        (rank() over (partition by ember order by n_fasilitas) - 1)
        + (count(*) over (partition by ember, n_fasilitas) - 1) / 2.0
      ) / (count(*) over (partition by ember) - 1)
    end as persentil
  from dasar d
),
komponen as (
  select
    p.kos_id,
    p.n_fasilitas,
    case
      when (n.skor_kamar_mandi is not null)::int
         + (n.skor_dapur is not null)::int
         + (n.skor_koridor is not null)::int >= 2
      then round(
        (coalesce(n.skor_kamar_mandi, 0) + coalesce(n.skor_dapur, 0) + coalesce(n.skor_koridor, 0))::numeric
        / ((n.skor_kamar_mandi is not null)::int + (n.skor_dapur is not null)::int + (n.skor_koridor is not null)::int),
        2)
    end as kebersihan,
    n.skor_kedap::numeric as kedap,
    round(
      5 * (1 - least(((p.total_bulanan - p.harga_bulanan)::numeric / p.total_bulanan) / 0.35, 1)),
      2) as transparansi,
    round(1 + 4 * p.persentil, 2) as fasilitas,
    (
      select round(avg(x), 2)
      from unnest(array[
        case
          when s.landmark_menit_jalan is null then null
          when s.landmark_menit_jalan <= 5 then 5
          when s.landmark_menit_jalan <= 10 then 4
          when s.landmark_menit_jalan <= 15 then 3
          when s.landmark_menit_jalan <= 20 then 2
          else 1
        end,
        s.penerangan,
        case
          when s.kos_id is null then null
          else 1
            + (s.minimarket is not null)::int
            + (s.warung is not null)::int
            + (s.laundry is not null)::int
            + (s.transit is not null)::int
        end
      ]::numeric[]) as x
    ) as sekitar
  from peringkat p
  left join kos_penilaian n on n.kos_id = p.kos_id
  left join kos_sekitar s on s.kos_id = p.kos_id
)
select
  kos_id,
  kebersihan,
  kedap,
  transparansi,
  fasilitas,
  sekitar,
  n_fasilitas,
  case
    when kebersihan is null or kedap is null then null
    else round(
      10 * (
        0.30 * kebersihan / 5
        + 0.20 * kedap / 5
        + 0.20 * transparansi / 5
        + 0.15 * fasilitas / 5
        + coalesce(0.15 * sekitar / 5, 0)
      ) / (0.85 + case when sekitar is null then 0 else 0.15 end),
      1)
  end as skor
from komponen;

-- ---------------------------------------------------------------- cari_kos
-- Search with a live total count. Every filter is optional (NULL = off).
--   p_harga_*      applied to a room type's total_bulanan (the real total)
--   p_fasilitas    slugs the kos must ALL have
--   p_aturan       {"pasangan":"boleh","tamu":"boleh","hewan":true,
--                   "masak_di_kamar":true,"anak":true,"tanpa_jam_malam":true}
--   p_urut         relevan | termurah | terdekat | skor
-- Order: fresh before stale (>30 days), then spotlight (max 2), premium,
-- then the chosen sort. Availability older than 90 days is excluded.
create or replace function cari_kos(
  p_lat            double precision,
  p_lng            double precision,
  p_radius_m       integer default 3000,
  p_harga_min      integer default null,
  p_harga_max      integer default null,
  p_tipe           tipe_kos default null,
  p_min_kebersihan numeric default null,
  p_min_kedap      integer default null,
  p_fasilitas      text[] default null,
  p_aturan         jsonb default '{}'::jsonb,
  p_urut           text default 'relevan',
  p_limit          integer default 20,
  p_offset         integer default 0
)
returns table (
  id                              uuid,
  slug                            text,
  nama                            text,
  tipe                            tipe_kos,
  tier                            tier_kos,
  lat                             double precision,
  lng                             double precision,
  jarak_m                         integer,
  harga_bulanan                   integer,
  total_bulanan                   integer,
  kamar_tersedia                  integer,
  skor                            numeric,
  skor_kebersihan                 numeric,
  skor_kedap                      numeric,
  ketersediaan_dikonfirmasi_pada  timestamptz,
  perlu_dikonfirmasi              boolean,
  jumlah_red_flags                integer,
  foto_url                        text,
  foto_lebar                      integer,
  foto_tinggi                     integer,
  foto_blurhash                   text,
  total_count                     bigint
)
language sql
stable
as $$
with pusat as (
  select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as titik
),
termurah as (
  -- Cheapest room type that satisfies the price range, per kos.
  select distinct on (t.kos_id) t.kos_id, t.harga_bulanan, t.total_bulanan
  from tipe_kamar t
  where (p_harga_min is null or t.total_bulanan >= p_harga_min)
    and (p_harga_max is null or t.total_bulanan <= p_harga_max)
  order by t.kos_id, t.total_bulanan, t.harga_bulanan
),
tersedia as (
  select kos_id, sum(kamar_tersedia)::integer as kamar_tersedia
  from tipe_kamar
  group by kos_id
),
foto as (
  select distinct on (kos_id) kos_id, url, lebar, tinggi, blurhash
  from kos_media
  where jenis = 'foto'
  order by kos_id, urutan
),
cocok as (
  select
    k.id, k.slug, k.nama, k.tipe, k.tier,
    st_y(k.lokasi::geometry) as lat,
    st_x(k.lokasi::geometry) as lng,
    round(st_distance(k.lokasi, pusat.titik))::integer as jarak_m,
    t.harga_bulanan,
    t.total_bulanan,
    coalesce(v.kamar_tersedia, 0) as kamar_tersedia,
    s.skor,
    s.kebersihan as skor_kebersihan,
    s.kedap as skor_kedap,
    k.ketersediaan_dikonfirmasi_pada,
    (k.ketersediaan_dikonfirmasi_pada < now() - interval '30 days') as perlu_dikonfirmasi,
    coalesce(cardinality(c.red_flags), 0) as jumlah_red_flags,
    f.url as foto_url, f.lebar as foto_lebar, f.tinggi as foto_tinggi, f.blurhash as foto_blurhash
  from kos k
  cross join pusat
  join termurah t on t.kos_id = k.id
  left join kos_skor s on s.kos_id = k.id
  left join tersedia v on v.kos_id = k.id
  left join catatan_surveyor c on c.kos_id = k.id
  left join foto f on f.kos_id = k.id
  left join kos_aturan a on a.kos_id = k.id
  where k.status = 'tayang'
    and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
    and st_dwithin(k.lokasi, pusat.titik, p_radius_m)
    and (p_tipe is null or k.tipe = p_tipe)
    and (p_min_kebersihan is null or s.kebersihan >= p_min_kebersihan)
    and (p_min_kedap is null or s.kedap >= p_min_kedap)
    and (
      p_fasilitas is null or cardinality(p_fasilitas) = 0
      or not exists (
        select 1 from unnest(p_fasilitas) as u(slug)
        where not exists (
          select 1
          from kos_fasilitas kf
          join fasilitas fs on fs.id = kf.fasilitas_id
          where kf.kos_id = k.id and fs.slug = u.slug
        )
      )
    )
    and (p_aturan ->> 'pasangan' is null or a.pasangan::text = p_aturan ->> 'pasangan')
    and (p_aturan ->> 'tamu' is null or a.tamu::text = p_aturan ->> 'tamu')
    and (p_aturan ->> 'hewan' is null or a.hewan = (p_aturan ->> 'hewan')::boolean)
    and (p_aturan ->> 'anak' is null or a.anak = (p_aturan ->> 'anak')::boolean)
    and (p_aturan ->> 'masak_di_kamar' is null or a.masak_di_kamar = (p_aturan ->> 'masak_di_kamar')::boolean)
    and (p_aturan ->> 'tanpa_jam_malam' is null or (a.jam_malam is null) = (p_aturan ->> 'tanpa_jam_malam')::boolean)
),
peringkat as (
  select
    c.*,
    case
      when c.tier = 'spotlight' and row_number() over (
        partition by c.tier
        order by
          c.perlu_dikonfirmasi,
          case when p_urut = 'termurah' then c.total_bulanan end,
          case when p_urut = 'terdekat' then c.jarak_m end,
          case when p_urut in ('skor', 'relevan') then c.skor end desc nulls last,
          c.jarak_m, c.total_bulanan, c.id
      ) <= 2 then 0
      when c.tier in ('spotlight', 'premium') then 1
      else 2
    end as prioritas
  from cocok c
)
select
  id, slug, nama, tipe, tier, lat, lng, jarak_m,
  harga_bulanan, total_bulanan, kamar_tersedia,
  skor, skor_kebersihan, skor_kedap,
  ketersediaan_dikonfirmasi_pada, perlu_dikonfirmasi, jumlah_red_flags,
  foto_url, foto_lebar, foto_tinggi, foto_blurhash,
  count(*) over () as total_count
from peringkat
order by
  perlu_dikonfirmasi,
  prioritas,
  case when p_urut = 'termurah' then total_bulanan end,
  case when p_urut = 'terdekat' then jarak_m end,
  case when p_urut in ('skor', 'relevan') then skor end desc nulls last,
  jarak_m, total_bulanan, id
limit greatest(p_limit, 0)
offset greatest(p_offset, 0);
$$;

grant select on kos_skor to anon, authenticated;
grant execute on function cari_kos to anon, authenticated;
