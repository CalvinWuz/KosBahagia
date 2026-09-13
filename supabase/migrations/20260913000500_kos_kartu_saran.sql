-- Task 03 · card-ready view and typeahead.
--
-- kos_kartu: one row per kos with everything a KosCard needs (headline
-- total, its components, skor, first photo, landmark, freshness). Used by
-- the homepage "Baru disurvei" rail and reusable by saved/compare pages.
-- cari_saran: typeahead over area.nama and kos.nama (trigram indexes).

-- Hosted Supabase applies migrations without `extensions` on the search_path.
set search_path = public, extensions;

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
  -- Components of the headline total, in display order.
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
  sk.landmark_menit_jalan
from kos k
join area a on a.id = k.area_id
join termurah t on t.kos_id = k.id
left join tersedia v on v.kos_id = k.id
left join kos_skor s on s.kos_id = k.id
left join catatan_surveyor c on c.kos_id = k.id
left join foto f on f.kos_id = k.id
left join kos_sekitar sk on sk.kos_id = k.id;

-- Typeahead: areas first, then live kos, ranked by trigram similarity.
create or replace function cari_saran(q text, p_limit integer default 8)
returns table (jenis text, slug text, nama text, keterangan text)
language sql
stable
as $$
  with kata as (select trim(q) as q)
  (
    select 'area'::text, a.slug, a.nama,
      case a.tipe when 'kampus' then 'Kampus' when 'stasiun' then 'Stasiun' else 'Kecamatan' end
    from area a, kata
    where length(kata.q) >= 2 and a.nama ilike '%' || kata.q || '%'
    order by extensions.similarity(a.nama, kata.q) desc, a.nama
    limit p_limit
  )
  union all
  (
    select 'kos'::text, k.slug, k.nama, ar.nama
    from kos k
    join area ar on ar.id = k.area_id, kata
    where length(kata.q) >= 2 and k.status = 'tayang' and k.nama ilike '%' || kata.q || '%'
    order by extensions.similarity(k.nama, kata.q) desc, k.nama
    limit p_limit
  )
  limit p_limit;
$$;

grant select on kos_kartu to anon, authenticated;
grant execute on function cari_saran to anon, authenticated;
