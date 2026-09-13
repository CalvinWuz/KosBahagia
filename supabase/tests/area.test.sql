-- pgTAP checks for the area statistics behind /area/[slug].

begin;
select plan(7);

select is(
  (select jumlah_kos from statistik_area('palmerah')),
  (select count(*)::integer from kos k, area a
    where a.slug = 'palmerah' and k.status = 'tayang'
      and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
      and st_dwithin(k.lokasi, a.lokasi, 3000)),
  'statistik_area: kos count uses the same membership rule as /cari');

select ok(
  (select min_total <= median_total and median_total <= max_total from statistik_area('palmerah')),
  'statistik_area: min <= median <= max');

select ok(
  (select persen_km_dalam between 0 and 100 from statistik_area('palmerah')),
  'statistik_area: private-bathroom share is a percentage');

select ok(
  (select model_listrik_umum in ('termasuk', 'token', 'flat', 'meteran') from statistik_area('palmerah')),
  'statistik_area: typical electricity model is one of the enum values');

select ok(
  (select rata_harga_makan between 5000 and 50000 from statistik_area('palmerah')),
  'statistik_area: average meal price is plausible (seed carries harga_makan)');

select is(
  (select jumlah_kos from statistik_area('tidak-ada')),
  0,
  'statistik_area: unknown area yields zero, not an error');

select is(
  (select count(*) from area_tetangga('binus-kemanggisan', 3)),
  3::bigint,
  'area_tetangga: returns the three nearest other areas');

select * from finish();
rollback;
