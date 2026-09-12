-- pgTAP checks for the owner (mitra) side of RLS and the housekeeping
-- triggers. Runs inside a transaction that is rolled back.

begin;
select plan(11);

-- Two owners; one draft kos each, plus a tayang kos for owner A.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@contoh.id', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@contoh.id', '', now(), now(), now());
insert into owner (id, nama, whatsapp) values
  ('11111111-1111-4111-8111-111111111111', 'Owner A', '6281111111111'),
  ('22222222-2222-4222-8222-222222222222', 'Owner B', '6282222222222');

insert into kos (id, slug, nama, alamat, lokasi, area_id, tipe, kontak_nama, whatsapp, status, tier, owner_id, disurvei_pada, surveyor, ketersediaan_dikonfirmasi_pada)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'kos-tes-a', 'Kos Tes A', 'Jl. Tes 1', st_setsrid(st_makepoint(106.79, -6.2), 4326)::geography, id, 'campur', 'Owner A', '6281111111111', 'tayang', 'free', '11111111-1111-4111-8111-111111111111', current_date, 'Dina Anggraeni', now() - interval '40 days'
from area where slug = 'palmerah';
insert into kos (id, slug, nama, alamat, lokasi, area_id, tipe, kontak_nama, whatsapp, status, owner_id)
select 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'kos-tes-b', 'Kos Tes B (draft)', 'Jl. Tes 2', st_setsrid(st_makepoint(106.79, -6.2), 4326)::geography, id, 'putra', 'Owner B', '6282222222222', 'draft', '22222222-2222-4222-8222-222222222222'
from area where slug = 'palmerah';
insert into tipe_kamar (id, kos_id, nama, harga_bulanan, model_listrik, kamar_tersedia, total_kamar)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Standar', 1000000, 'termasuk', 1, 5);
insert into kos_penilaian (kos_id, skor_kamar_mandi, skor_dapur, skor_koridor, skor_kedap)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 4, 4, 4, 4);
insert into klik_wa (kos_id, sumber) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'detail'), ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'kartu');

-- ---------------------------------------------------------------- as anon
set local role anon;
select is((select count(*) from kos where slug = 'kos-tes-b'), 0::bigint, 'anon: draft kos is invisible');
reset role;

-- ---------------------------------------------------------------- as owner B
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from kos where slug = 'kos-tes-b'), 1::bigint, 'owner: sees their own draft kos');
select is((select count(*) from kos where slug = 'kos-tes-a'), 1::bigint, 'owner: still sees other owners'' tayang kos (public data)');

update kos set nama = 'Diretas' where slug = 'kos-tes-a';
select is((select nama from kos where slug = 'kos-tes-a'), 'Kos Tes A', 'owner: cannot edit someone else''s kos (0 rows affected)');

reset role;

-- ---------------------------------------------------------------- as owner A
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ update tipe_kamar set kamar_tersedia = 3 where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' $$,
  'owner: can update availability of their own room type');

reset role;
select is(
  (select sumber::text from log_ketersediaan where tipe_kamar_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' order by dibuat_pada desc limit 1),
  'pemilik',
  'trigger: availability change by an owner is logged with sumber = pemilik');
select ok(
  (select ketersediaan_dikonfirmasi_pada > now() - interval '1 minute' from kos where slug = 'kos-tes-a'),
  'trigger: availability change re-stamps ketersediaan_dikonfirmasi_pada');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$ update kos set tier = 'spotlight' where slug = 'kos-tes-a' $$,
  '42501',
  null,
  'owner: cannot promote their own tier');

select throws_ok(
  $$ update kos_penilaian set skor_kedap = 5 where kos_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' $$,
  '42501',
  null,
  'owner: cannot touch survey scores');

select is((select count(*) from klik_wa where kos_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 2::bigint, 'owner: can read lead clicks for their own kos');
select is((select count(*) from klik_wa where kos_id <> 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 0::bigint, 'owner: cannot read other kos'' lead clicks');

reset role;
select * from finish();
rollback;
