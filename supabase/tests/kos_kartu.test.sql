-- pgTAP checks for the card view and typeahead added in task 03.

begin;
select plan(7);

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

set local role anon;
select is(
  (select count(*) from kos_kartu where status <> 'tayang'),
  0::bigint,
  'anon: kos_kartu only exposes tayang kos');
reset role;

select * from finish();
rollback;
