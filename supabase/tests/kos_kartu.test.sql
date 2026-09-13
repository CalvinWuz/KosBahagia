-- pgTAP checks for the card view and typeahead added in task 03.

begin;
select plan(9);

select is(
  (select count(*) from kos_kartu),
  (select count(*) from kos k where exists (select 1 from tipe_kamar t where t.kos_id = k.id)),
  'kos_kartu: one row per kos that has a room type');

select is(
  (select count(*) from kos_kartu where total_bulanan < harga_bulanan),
  0::bigint,
  'kos_kartu: total is never below rent');

select is(
  (select count(*) from kos_kartu
    where total_bulanan <> (select sum((r ->> 'jumlah')::integer) from jsonb_array_elements(rincian) r)),
  0::bigint,
  'kos_kartu: rincian components always sum to total_bulanan');

select is(
  (select jenis from cari_saran('binus') limit 1),
  'area',
  'cari_saran: "binus" finds the campus area first');

select ok(
  (select count(*) > 0 from cari_saran('melati') where jenis = 'kos' and slug = 'kos-putri-melati'),
  'cari_saran: "melati" finds Kos Putri Melati');

select is(
  (select count(*) from cari_saran('gilang')),
  0::bigint,
  'cari_saran: draft kos never appear');

select ok(
  (select count(*) > 0 from kos_sekitar where jsonb_array_length(rute -> 'langkah') = 2)
  and (select count(*) > 0 from kos_sekitar where jsonb_array_length(rute -> 'langkah') = 4),
  'seed: routes with 2 and with 4 steps both exist (task 06 minimap acceptance)');

select is(
  (select count(*) from kos_media m
    where m.jenis = 'foto360' and (m.tur ->> 'preview_url' is null or (m.tur ->> 'ukuran_bytes')::int <= 0)),
  0::bigint,
  'seed: every foto360 row carries a preview url and a file size');

set local role anon;
select is(
  (select count(*) from kos_kartu where status <> 'tayang'),
  0::bigint,
  'anon: kos_kartu only exposes tayang kos');
reset role;

select * from finish();
rollback;
