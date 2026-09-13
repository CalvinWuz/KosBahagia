-- Task 07 · area pages.
--   area_radius_m(tipe)      the membership radius an area page uses
--   statistik_area(slug)     the "area facts" nobody else has
--   area_tetangga(slug, n)   nearest other areas with their listing counts
-- Membership matches /cari: tayang, availability confirmed ≤ 90 days,
-- within the area's radius of its centre.

-- Hosted Supabase applies migrations without `extensions` on the search_path.
set search_path = public, extensions;

create or replace function area_radius_m(p_tipe tipe_area)
returns integer
language sql
immutable
as $$
  select case p_tipe when 'kecamatan' then 3000 else 2000 end;
$$;

create or replace function statistik_area(p_slug text)
returns table (
  jumlah_kos             integer,
  median_total           integer,
  min_total              integer,
  max_total              integer,
  persen_km_dalam        integer,
  model_listrik_umum     text,
  rata_harga_makan       integer,
  jumlah_tanpa_jam_malam integer,
  jumlah_putra           integer,
  jumlah_putri           integer,
  jumlah_campur          integer
)
language sql
stable
set search_path = public, extensions
as $$
  with a as (
    select lokasi, area_radius_m(tipe) as radius from area where slug = p_slug
  ),
  anggota as (
    select k.id, k.tipe, kk.total_bulanan
    from kos k
    join kos_kartu kk on kk.id = k.id
    cross join a
    where k.status = 'tayang'
      and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
      and st_dwithin(k.lokasi, a.lokasi, a.radius)
  ),
  km as (
    select count(*)::integer as n
    from anggota m
    where exists (
      select 1 from kos_fasilitas kf join fasilitas f on f.id = kf.fasilitas_id
      where kf.kos_id = m.id and f.slug = 'kamar-mandi-dalam'
    )
  ),
  listrik as (
    select t.model_listrik::text as model, count(*) as n
    from anggota m join tipe_kamar t on t.kos_id = m.id
    group by t.model_listrik
    order by n desc, model
    limit 1
  ),
  makan as (
    select (round(avg((s.warung ->> 'harga_makan')::numeric) / 500) * 500)::integer as rata
    from anggota m join kos_sekitar s on s.kos_id = m.id
    where s.warung ->> 'harga_makan' is not null
  ),
  jam as (
    select count(*)::integer as n
    from anggota m join kos_aturan r on r.kos_id = m.id
    where r.jam_malam is null
  )
  select
    count(*)::integer,
    percentile_cont(0.5) within group (order by total_bulanan)::integer,
    min(total_bulanan)::integer,
    max(total_bulanan)::integer,
    case when count(*) = 0 then 0 else round(100.0 * (select n from km) / count(*))::integer end,
    (select model from listrik),
    (select rata from makan),
    (select n from jam),
    count(*) filter (where tipe = 'putra')::integer,
    count(*) filter (where tipe = 'putri')::integer,
    count(*) filter (where tipe = 'campur')::integer
  from anggota;
$$;

create or replace function area_tetangga(p_slug text, p_limit integer default 3)
returns table (slug text, nama text, tipe tipe_area, jarak_m integer, jumlah_kos integer)
language sql
stable
set search_path = public, extensions
as $$
  with asal as (select lokasi from area where slug = p_slug)
  select
    a.slug, a.nama, a.tipe,
    round(st_distance(a.lokasi, asal.lokasi))::integer as jarak_m,
    (select jumlah_kos from statistik_area(a.slug)) as jumlah_kos
  from area a, asal
  where a.slug <> p_slug
  order by st_distance(a.lokasi, asal.lokasi)
  limit p_limit;
$$;

grant execute on function area_radius_m, statistik_area, area_tetangga to anon, authenticated;
