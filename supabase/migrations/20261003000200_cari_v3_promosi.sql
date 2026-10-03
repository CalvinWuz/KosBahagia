-- Audit 2026-10 · sorting that means what its label says, promotions apart.
--
--   kos_cocok(...)     the filtered set, unordered (shared by the two below)
--   cari_kos_v3(...)   main results. Explicit sorts are pure:
--                        termurah  total_bulanan ↑ (incomplete totals last)
--                        terdekat  jarak_m ↑
--                        skor      skor ↓ (unscored last)
--                      relevan keeps the recommendation order: rooms left,
--                      fresh data, paid package, skor, distance — the page
--                      explains this next to the sort control.
--                      Ties always fall back to distance, then id (stable).
--   kos_promosi(...)   up to 2 spotlight kos that pass the same filters, have
--                      a room, and fresh data. Shown in a separate, labelled
--                      "Promosi berbayar" block; never reorders the main list.
--
-- The displayed room travels with the row: the cheapest room type that has
-- space (and fits the price range when one is set), so price, room name and
-- vacancy describe the same room. A price filter only matches complete
-- totals: an unknown fee is never treated as free.
--
-- cari_kos (v2) stays for the currently deployed frontend; drop it once the
-- new one is live.

set search_path = public, extensions;

create or replace function kos_cocok(
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
acuan as (
  select distinct on (t.kos_id) t.*
  from tipe_kamar t
  where (p_harga_min is null and p_harga_max is null)
     or (
       t.total_lengkap
       and (p_harga_min is null or t.total_bulanan >= p_harga_min)
       and (p_harga_max is null or t.total_bulanan <= p_harga_max)
     )
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
join kos_kartu kk on kk.id = k.id
join acuan t on t.kos_id = k.id
left join kos_aturan a on a.kos_id = k.id
left join kos_sekitar s on s.kos_id = k.id
where k.status = 'tayang'
  and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
  and st_dwithin(k.lokasi, pusat.titik, p_radius_m)
  and (p_q is null or k.nama ilike '%' || p_q || '%')
  and (p_tipe is null or k.tipe = p_tipe)
  and (p_min_kebersihan is null or kk.skor_kebersihan >= p_min_kebersihan)
  and (p_min_kedap is null or kk.skor_kedap >= p_min_kedap)
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
  and (
    p_aturan ->> 'dekat_minimarket' is null
    or not (p_aturan ->> 'dekat_minimarket')::boolean
    or (s.minimarket is not null and coalesce((s.minimarket ->> 'jarak_m')::integer, 9999) <= 300)
  );
$$;

create or replace function cari_kos_v3(
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
from kos_cocok(
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

create or replace function kos_promosi(
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
from kos_cocok(
  p_lat, p_lng, p_radius_m, p_harga_min, p_harga_max, p_tipe,
  p_min_kebersihan, p_min_kedap, p_fasilitas, p_aturan, p_q
) c
where c.tier = 'spotlight'
  and c.kamar_acuan_tersedia > 0
  and not c.perlu_dikonfirmasi
order by c.skor desc nulls last, c.jarak_m, c.id
limit least(greatest(p_limit, 0), 2);
$$;

grant execute on function kos_cocok, cari_kos_v3, kos_promosi to anon, authenticated;

-- The owner dashboard's "position in your area" follows the new main order.
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
    from pusat, lateral cari_kos_v3(pusat.lat, pusat.lng, pusat.radius, p_limit => 500) c
  )
  select posisi::integer from hasil where id = p_kos_id;
$$;

-- ---------------------------------------------------------------- abuse limits
-- Anonymous inserts are the only public write path. Keep payloads short and
-- stop one kos's report queue from being flooded. The counting trigger runs
-- as definer because anon cannot read laporan_user.
do $$ begin
  alter table laporan_user add constraint laporan_user_catatan_pendek
    check (catatan is null or char_length(catatan) <= 500);
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table klik_wa add constraint klik_wa_referrer_pendek
    check (referrer is null or char_length(referrer) <= 500);
exception when duplicate_object then null;
end $$;

create or replace function batasi_laporan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from laporan_user
    where kos_id = new.kos_id and dibuat_pada > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'Terlalu banyak laporan untuk kos ini dalam satu jam'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists laporan_user_batasi on laporan_user;
create trigger laporan_user_batasi
  before insert on laporan_user
  for each row execute function batasi_laporan();
