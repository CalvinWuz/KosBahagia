-- Task 04 · search page needs.
--   area_publik   area with plain lat/lng (PostGIS geography is opaque over REST)
--   kos_kartu     + ada_360
--   cari_kos      + p_q (name filter), aturan.dekat_minimarket, ada_360 output,
--                 full kos (0 rooms left) sink to the bottom

create or replace view area_publik
with (security_invoker = on)
as
select
  id, slug, nama, tipe, deskripsi, seo_judul, seo_deskripsi,
  st_y(lokasi::geometry) as lat,
  st_x(lokasi::geometry) as lng
from area;

grant select on area_publik to anon, authenticated;

-- kos_kartu: append ada_360 (create or replace may only add trailing columns).
create or replace view kos_kartu
with (security_invoker = on)
as
with termurah as (
  select distinct on (kos_id) *
  from tipe_kamar
  order by kos_id, total_bulanan, harga_bulanan
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
)
select
  k.id,
  k.slug,
  k.nama,
  k.tipe,
  k.tier,
  k.status,
  a.slug as area_slug,
  a.nama as area_nama,
  k.disurvei_pada,
  k.ketersediaan_dikonfirmasi_pada,
  (k.ketersediaan_dikonfirmasi_pada < now() - interval '30 days') as perlu_dikonfirmasi,
  st_y(k.lokasi::geometry) as lat,
  st_x(k.lokasi::geometry) as lng,
  t.harga_bulanan,
  t.total_bulanan,
  (
    select jsonb_agg(jsonb_build_object('nama', nama, 'jumlah', jumlah))
    from (
      select 'Sewa' as nama, t.harga_bulanan as jumlah
      union all
      select case t.model_listrik when 'flat' then 'Listrik' else 'Listrik (estimasi)' end, t.estimasi_listrik
      where t.model_listrik <> 'termasuk' and coalesce(t.estimasi_listrik, 0) > 0
      union all
      select 'Air', t.biaya_air where coalesce(t.biaya_air, 0) > 0
      union all
      select 'AC', t.biaya_ac where t.boleh_ac and coalesce(t.biaya_ac, 0) > 0
      union all
      select b ->> 'nama', (b ->> 'jumlah')::integer
      from jsonb_array_elements(t.biaya_lain) b
      where coalesce((b ->> 'wajib')::boolean, true)
    ) r
  ) as rincian,
  coalesce(v.kamar_tersedia, 0) as kamar_tersedia,
  s.skor,
  s.kebersihan as skor_kebersihan,
  s.kedap as skor_kedap,
  coalesce(cardinality(c.red_flags), 0) as jumlah_red_flags,
  f.url as foto_url,
  f.lebar as foto_lebar,
  f.tinggi as foto_tinggi,
  f.blurhash as foto_blurhash,
  sk.landmark_nama,
  sk.landmark_menit_jalan,
  exists (select 1 from kos_media m where m.kos_id = k.id and m.jenis = 'foto360') as ada_360
from kos k
join area a on a.id = k.area_id
join termurah t on t.kos_id = k.id
left join tersedia v on v.kos_id = k.id
left join kos_skor s on s.kos_id = k.id
left join catatan_surveyor c on c.kos_id = k.id
left join foto f on f.kos_id = k.id
left join kos_sekitar sk on sk.kos_id = k.id;

-- cari_kos v2. Signature changes, so drop the old overload first.
drop function if exists cari_kos(
  double precision, double precision, integer, integer, integer, tipe_kos,
  numeric, integer, text[], jsonb, text, integer, integer
);

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
  harga_bulanan                   integer,
  total_bulanan                   integer,
  rincian                         jsonb,
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
  landmark_nama                   text,
  landmark_menit_jalan            smallint,
  ada_360                         boolean,
  total_count                     bigint
)
language sql
stable
as $$
with pusat as (
  select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as titik
),
termurah as (
  select distinct on (t.kos_id) t.kos_id, t.harga_bulanan, t.total_bulanan
  from tipe_kamar t
  where (p_harga_min is null or t.total_bulanan >= p_harga_min)
    and (p_harga_max is null or t.total_bulanan <= p_harga_max)
  order by t.kos_id, t.total_bulanan, t.harga_bulanan
),
cocok as (
  select
    kk.id, kk.slug, kk.nama, kk.tipe, kk.tier, kk.lat, kk.lng,
    round(st_distance(k.lokasi, pusat.titik))::integer as jarak_m,
    t.harga_bulanan,
    t.total_bulanan,
    kk.rincian,
    kk.kamar_tersedia,
    kk.skor, kk.skor_kebersihan, kk.skor_kedap,
    kk.ketersediaan_dikonfirmasi_pada,
    kk.perlu_dikonfirmasi,
    kk.jumlah_red_flags,
    kk.foto_url, kk.foto_lebar, kk.foto_tinggi, kk.foto_blurhash,
    kk.landmark_nama, kk.landmark_menit_jalan,
    kk.ada_360
  from kos k
  cross join pusat
  join kos_kartu kk on kk.id = k.id
  join termurah t on t.kos_id = k.id
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
    )
),
peringkat as (
  select
    c.*,
    (c.kamar_tersedia = 0) as penuh,
    case
      when c.tier = 'spotlight' and row_number() over (
        partition by c.tier
        order by
          (c.kamar_tersedia = 0),
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
  harga_bulanan, total_bulanan, rincian, kamar_tersedia,
  skor, skor_kebersihan, skor_kedap,
  ketersediaan_dikonfirmasi_pada, perlu_dikonfirmasi, jumlah_red_flags,
  foto_url, foto_lebar, foto_tinggi, foto_blurhash,
  landmark_nama, landmark_menit_jalan, ada_360,
  count(*) over () as total_count
from peringkat
order by
  penuh,
  perlu_dikonfirmasi,
  prioritas,
  case when p_urut = 'termurah' then total_bulanan end,
  case when p_urut = 'terdekat' then jarak_m end,
  case when p_urut in ('skor', 'relevan') then skor end desc nulls last,
  jarak_m, total_bulanan, id
limit greatest(p_limit, 0)
offset greatest(p_offset, 0);
$$;

grant execute on function cari_kos to anon, authenticated;
