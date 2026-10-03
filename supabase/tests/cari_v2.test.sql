-- pgTAP checks for the task 04 additions, now on cari_kos_v3.

begin;
select plan(6);

select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 20000, p_q => 'melati') limit 1),
  1::bigint,
  'p_q: name filter finds exactly Kos Putri Melati');

select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_aturan => '{"dekat_minimarket":true}') limit 1),
  (select count(*) from kos k, kos_sekitar s
    where s.kos_id = k.id and k.status = 'tayang'
      and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
      and st_dwithin(k.lokasi, st_setsrid(st_makepoint(106.7818, -6.2019), 4326)::geography, 2500)
      and s.minimarket is not null and (s.minimarket ->> 'jarak_m')::integer <= 300),
  'dekat_minimarket: matches kos with a minimarket within 300 m');

create temp table urutan as
  select row_number() over () as posisi, * from cari_kos_v3(-6.2019, 106.7818, 5000, p_limit => 200);

select ok(
  (select min(posisi) from urutan where kamar_tersedia = 0)
  > (select max(posisi) from urutan where kamar_tersedia > 0),
  'relevan: full kos (0 rooms left) sit below every kos with a room');

select ok(
  (select count(*) > 0 from urutan where ada_360),
  'ada_360 is true for at least one paid-tier kos');

select is(
  (select count(*) from urutan where ada_360 and tier = 'free'),
  0::bigint,
  'ada_360 is never true for a free kos in the seed');

select is(
  (select count(*) from area_publik where lat is null or lng is null),
  0::bigint,
  'area_publik exposes lat/lng for every area');

select * from finish();
rollback;
