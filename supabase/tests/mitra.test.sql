-- pgTAP checks for the owner surface: isolation between owners, survey
-- fields untouchable, capability links, availability sources.

begin;
select plan(14);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@contoh.id', '', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'b@contoh.id', '', now(), now(), now());
insert into owner (id, nama, whatsapp) values
  ('11111111-1111-4111-8111-111111111111', 'Owner A', '6281111111111'),
  ('22222222-2222-4222-8222-222222222222', 'Owner B', '6282222222222');
insert into kos (id, slug, nama, alamat, lokasi, area_id, tipe, kontak_nama, whatsapp, status, owner_id, disurvei_pada, surveyor, ketersediaan_dikonfirmasi_pada)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'kos-a', 'Kos A', 'Jl. A', st_setsrid(st_makepoint(106.79, -6.2), 4326)::geography, id, 'campur', 'A', '6281111111111', 'tayang', '11111111-1111-4111-8111-111111111111', current_date, 'Dina Anggraeni', now() - interval '40 days'
from area where slug = 'palmerah';
insert into kos (id, slug, nama, alamat, lokasi, area_id, tipe, kontak_nama, whatsapp, status, owner_id, disurvei_pada, surveyor, ketersediaan_dikonfirmasi_pada)
select 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'kos-b', 'Kos B', 'Jl. B', st_setsrid(st_makepoint(106.79, -6.2), 4326)::geography, id, 'putra', 'B', '6282222222222', 'tayang', '22222222-2222-4222-8222-222222222222', current_date, 'Dina Anggraeni', now()
from area where slug = 'palmerah';
insert into tipe_kamar (id, kos_id, nama, harga_bulanan, model_listrik, kamar_tersedia, total_kamar) values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Standar', 1000000, 'termasuk', 1, 5),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Standar', 900000, 'termasuk', 2, 4);
insert into catatan_surveyor (kos_id, red_flags) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', array['Tangga darurat digembok']);
insert into klik_wa (kos_id, sumber) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'detail');
insert into kunjungan_kos (kos_id) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into laporan_user (kos_id, jenis) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'penuh');

-- ---------------------------------------------------------------- owner A cannot read owner B
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*) from klik_wa where kos_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'isolation: A cannot read B''s WhatsApp clicks');
select is((select count(*) from kunjungan_kos where kos_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'isolation: A cannot read B''s page views');
select is((select count(*) from kunjungan_kos where kos_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1::bigint, 'isolation: A reads their own page views');
select is((select count(*) from laporan_user where kos_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'), 0::bigint, 'isolation: A cannot read reports filed on B''s kos');
select throws_ok($$ select count(*) from tautan_ketersediaan $$, '42501', null, 'isolation: link tokens are unreadable by owners');
select throws_ok($$ select count(*) from pendaftaran_mitra $$, '42501', null, 'isolation: applications are unreadable by owners');
select throws_ok(
  $$ insert into permintaan_koreksi (kos_id, owner_id, bidang, pesan) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'skor_kedap', 'x') $$,
  '42501', null, 'isolation: A cannot file a correction on B''s kos');

-- ---------------------------------------------------------------- survey fields untouchable
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select throws_ok(
  $$ update catatan_surveyor set red_flags = '{}' where kos_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  '42501', null, 'owner: cannot clear their own red flags');
select throws_ok(
  $$ update kos set tier = 'premium' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  '42501', null, 'owner: cannot change their own tier');
select lives_ok(
  $$ update kos set deskripsi = 'Kos tenang dekat kampus' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' $$,
  'owner: can edit their description');
select lives_ok(
  $$ select konfirmasi_ketersediaan('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') $$,
  'owner: can confirm availability unchanged');
reset role;

-- ---------------------------------------------------------------- capability link
select ok(length(buat_tautan_ketersediaan('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')) = 48, 'link: token is 48 hex chars');
select set_config('kb.tok', buat_tautan_ketersediaan('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), true);

set local role anon;
select is(
  (select perbarui_ketersediaan_via_tautan(current_setting('kb.tok'), '{"cccccccc-cccc-4ccc-8ccc-cccccccccccc": 4}')),
  1,
  'link: anon with a valid token can update availability');
reset role;
select is(
  (select sumber::text from log_ketersediaan where tipe_kamar_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' order by dibuat_pada desc limit 1),
  'bot_wa',
  'link: the update is logged with sumber = bot_wa');

select * from finish();
rollback;
