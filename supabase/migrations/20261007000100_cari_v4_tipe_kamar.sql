-- UX v3 (kuesioner Oktober 2026) · a filter means the same thing from the
-- chip to the database.
--
--   kos_cocok_v2(...)    the filtered set, unordered (shared by the two below)
--   cari_kos_v4(...)     main results; same ordering rules as cari_kos_v3
--   kos_promosi_v2(...)  up to 2 spotlight kos that pass the same filters
--
-- What changes against kos_cocok / cari_kos_v3 / kos_promosi:
--   1. p_tipe is tipe_kos[]. NULL or an empty array = every type; one or more
--      values = any of them (OR). Combined with every other filter by AND.
--   2. Room-level requirements are met by ONE room type. The reference room
--      (whose price, name, status and link the card shows) must fit the price
--      range AND have a kamar mandi dalam / AC when those are asked for.
--      Before, a kos passed when room A fit the price and room B had the
--      bathroom, and the card then showed room A.
--   3. tipe_kamar.kamar_mandi_dalam NULL (belum dicatat) never satisfies the
--      kamar-mandi-dalam requirement. Every other facility slug stays a
--      kos-level check on kos_fasilitas, as before.
--
-- A new name instead of changing cari_kos_v3: the type of p_tipe changes, and
-- two functions with one name would leave PostgREST choosing between
-- overloads. The deployed frontend keeps calling cari_kos_v3 / kos_promosi
-- (unchanged here) until the new one is live; drop those and kos_cocok in a
-- later migration. posisi_di_area moves to cari_kos_v4 now (it passes no
-- filters, so its rows are the same).

set search_path = public, extensions;

create or replace function kos_cocok_v2(
  p_lat            double precision,
  p_lng            double precision,
  p_radius_m       integer default 3000,
  p_harga_min      integer default null,
  p_harga_max      integer default null,
  p_tipe           tipe_kos[] default null,
  p_min_kebersihan numeric default null,
  p_min_kedap      integer default null,
  p_fasilitas      text[] default null,
  p_aturan         jsonb default '{}'::jsonb,
  p_q              text default null
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
  kamar_id                        uuid,
  kamar_nama                      text,
  kamar                           jsonb,
  harga_bulanan                   integer,
  total_bulanan                   integer,
  total_lengkap                   boolean,
  total_estimasi                  boolean,
  kamar_acuan_tersedia            integer,
  kamar_acuan_total               integer,
  kamar_tersedia                  integer,
  jumlah_tipe_kamar               integer,
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
  landmark_nama                   text,
  landmark_menit_jalan            smallint,
  ada_360                         boolean
)
language sql
stable
set search_path = public, extensions
as $$
with pusat as (
  select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as titik
),
-- Room-level requirements are pulled out of the facility list; the rest of
-- the slugs are checked against the kos.
syarat as (
  select
    coalesce('kamar-mandi-dalam' = any(p_fasilitas), false) as km_dalam,
    coalesce('ac' = any(p_fasilitas), false) as ac,
    array(
      select distinct s
      from unnest(coalesce(p_fasilitas, '{}'::text[])) as s
      where s not in ('kamar-mandi-dalam', 'ac')
    ) as fasilitas_kos
),
-- The reference room: the cheapest room type that still has space, among
-- the room types that meet every room-level requirement. Price, name,
-- vacancy and the detail link all describe this one room.
acuan as (
  select distinct on (t.kos_id) t.*
  from tipe_kamar t
  cross join syarat
  where (
      (p_harga_min is null and p_harga_max is null)
      or (
        t.total_lengkap
        and (p_harga_min is null or t.total_bulanan >= p_harga_min)
        and (p_harga_max is null or t.total_bulanan <= p_harga_max)
      )
    )
    and (not syarat.km_dalam or t.kamar_mandi_dalam is true)
    and (not syarat.ac or t.boleh_ac)
  order by t.kos_id, (t.kamar_tersedia = 0), (not t.total_lengkap), t.total_bulanan, t.harga_bulanan, t.id
)
select
  kk.id, kk.slug, kk.nama, kk.tipe, kk.tier, kk.lat, kk.lng,
  round(st_distance(k.lokasi, pusat.titik))::integer as jarak_m,
  t.id, t.nama, to_jsonb(t),
  t.harga_bulanan, t.total_bulanan, t.total_lengkap, t.total_estimasi,
  t.kamar_tersedia::integer, t.total_kamar::integer,
  kk.kamar_tersedia, kk.jumlah_tipe_kamar,
  kk.skor, kk.skor_kebersihan, kk.skor_kedap,
  kk.ketersediaan_dikonfirmasi_pada, kk.perlu_dikonfirmasi, kk.jumlah_red_flags,
  kk.foto_url, kk.foto_lebar, kk.foto_tinggi, kk.foto_blurhash,
  kk.landmark_nama, kk.landmark_menit_jalan, kk.ada_360
from kos k
cross join pusat
cross join syarat
join kos_kartu kk on kk.id = k.id
join acuan t on t.kos_id = k.id
left join kos_aturan a on a.kos_id = k.id
left join kos_sekitar s on s.kos_id = k.id
where k.status = 'tayang'
  and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
  and st_dwithin(k.lokasi, pusat.titik, p_radius_m)
  and (p_q is null or k.nama ilike '%' || p_q || '%')
  and (p_tipe is null or cardinality(p_tipe) = 0 or k.tipe = any(p_tipe))
  and (p_min_kebersihan is null or kk.skor_kebersihan >= p_min_kebersihan)
  and (p_min_kedap is null or kk.skor_kedap >= p_min_kedap)
  and not exists (
    select 1 from unnest(syarat.fasilitas_kos) as u(slug)
    where not exists (
      select 1
      from kos_fasilitas kf
      join fasilitas fs on fs.id = kf.fasilitas_id
      where kf.kos_id = k.id and fs.slug = u.slug
    )
  )
  and (p_aturan ->> 'pasangan' is null or a.pasangan::text = p_aturan ->> 'pasangan')
  and (p_aturan ->> 'tamu' is null or a.tamu::text = p_aturan ->> 'tamu')
  and (p_aturan ->> 'hewan' is null or a.hewan = (p_aturan ->> 'hewan')::boolean)
  and (p_aturan ->> 'anak' is null or a.anak = (p_aturan ->> 'anak')::boolean)
  and (p_aturan ->> 'masak_di_kamar' is null or a.masak_di_kamar = (p_aturan ->> 'masak_di_kamar')::boolean)
  and (p_aturan ->> 'tanpa_jam_malam' is null or (a.jam_malam is null) = (p_aturan ->> 'tanpa_jam_malam')::boolean)
  and (
    p_aturan ->> 'dekat_minimarket' is null
    or not (p_aturan ->> 'dekat_minimarket')::boolean
    or (s.minimarket is not null and coalesce((s.minimarket ->> 'jarak_m')::integer, 9999) <= 300)
  );
$$;

create or replace function cari_kos_v4(
  p_lat            double precision,
  p_lng            double precision,
  p_radius_m       integer default 3000,
  p_harga_min      integer default null,
  p_harga_max      integer default null,
  p_tipe           tipe_kos[] default null,
  p_min_kebersihan numeric default null,
  p_min_kedap      integer default null,
  p_fasilitas      text[] default null,
  p_aturan         jsonb default '{}'::jsonb,
  p_urut           text default 'relevan',
  p_limit          integer default 20,
  p_offset         integer default 0,
  p_q              text default null
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
  kamar_id                        uuid,
  kamar_nama                      text,
  kamar                           jsonb,
  harga_bulanan                   integer,
  total_bulanan                   integer,
  total_lengkap                   boolean,
  total_estimasi                  boolean,
  kamar_acuan_tersedia            integer,
  kamar_acuan_total               integer,
  kamar_tersedia                  integer,
  jumlah_tipe_kamar               integer,
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
  landmark_nama                   text,
  landmark_menit_jalan            smallint,
  ada_360                         boolean,
  total_count                     bigint
)
language sql
stable
set search_path = public, extensions
as $$
select c.*, count(*) over () as total_count
from kos_cocok_v2(
  p_lat, p_lng, p_radius_m, p_harga_min, p_harga_max, p_tipe,
  p_min_kebersihan, p_min_kedap, p_fasilitas, p_aturan, p_q
) c
order by
  case when p_urut not in ('termurah', 'terdekat', 'skor') then (c.kamar_tersedia = 0) end,
  case when p_urut not in ('termurah', 'terdekat', 'skor') then c.perlu_dikonfirmasi end,
  case when p_urut not in ('termurah', 'terdekat', 'skor') then (c.tier = 'free') end,
  case when p_urut = 'termurah' then (not c.total_lengkap) end,
  case when p_urut = 'termurah' then c.total_bulanan end,
  case when p_urut not in ('termurah', 'terdekat') then c.skor end desc nulls last,
  c.jarak_m,
  c.id
limit greatest(p_limit, 0)
offset greatest(p_offset, 0);
$$;

create or replace function kos_promosi_v2(
  p_lat            double precision,
  p_lng            double precision,
  p_radius_m       integer default 3000,
  p_harga_min      integer default null,
  p_harga_max      integer default null,
  p_tipe           tipe_kos[] default null,
  p_min_kebersihan numeric default null,
  p_min_kedap      integer default null,
  p_fasilitas      text[] default null,
  p_aturan         jsonb default '{}'::jsonb,
  p_q              text default null,
  p_limit          integer default 2
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
  kamar_id                        uuid,
  kamar_nama                      text,
  kamar                           jsonb,
  harga_bulanan                   integer,
  total_bulanan                   integer,
  total_lengkap                   boolean,
  total_estimasi                  boolean,
  kamar_acuan_tersedia            integer,
  kamar_acuan_total               integer,
  kamar_tersedia                  integer,
  jumlah_tipe_kamar               integer,
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
  landmark_nama                   text,
  landmark_menit_jalan            smallint,
  ada_360                         boolean
)
language sql
stable
set search_path = public, extensions
as $$
select c.*
from kos_cocok_v2(
  p_lat, p_lng, p_radius_m, p_harga_min, p_harga_max, p_tipe,
  p_min_kebersihan, p_min_kedap, p_fasilitas, p_aturan, p_q
) c
where c.tier = 'spotlight'
  and c.kamar_acuan_tersedia > 0
  and not c.perlu_dikonfirmasi
order by c.skor desc nulls last, c.jarak_m, c.id
limit least(greatest(p_limit, 0), 2);
$$;

grant execute on function kos_cocok_v2, cari_kos_v4, kos_promosi_v2 to anon, authenticated;

-- The owner dashboard's "position in your area" (no filters, so the same rows
-- as before) follows the new function, so cari_kos_v3 can go later.
create or replace function posisi_di_area(p_kos_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  with pusat as (
    select st_y(a.lokasi::geometry) as lat, st_x(a.lokasi::geometry) as lng, area_radius_m(a.tipe) as radius
    from kos k join area a on a.id = k.area_id where k.id = p_kos_id
  ),
  hasil as (
    select c.id, row_number() over () as posisi
    from pusat, lateral cari_kos_v4(pusat.lat, pusat.lng, pusat.radius, p_limit => 500) c
  )
  select posisi::integer from hasil where id = p_kos_id;
$$;

comment on function cari_kos_v4 is 'Renter search (UX v3): p_tipe is any-of; room-level requirements (price, kamar mandi dalam, AC) met by one room type.';
comment on column tipe_kamar.kamar_mandi_dalam is 'Bathroom inside this room type; NULL = belum dicatat (never matches the kamar-mandi-dalam filter).';
