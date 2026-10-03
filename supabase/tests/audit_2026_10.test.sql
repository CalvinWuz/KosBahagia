-- pgTAP checks for the 2026-10 audit fixes: honest sorting, promotions kept
-- apart, room-level price/vacancy, unknown fees, transparency rubric, abuse
-- limits, and seed narratives that agree with the measurements.

begin;
select plan(24);

-- 1. unknown fees are not free ------------------------------------------------
select is(
  (select total_lengkap from kos_kartu where slug = 'kos-om-deddy'),
  false,
  'unknown electricity estimate: the headline total is marked incomplete');

select is(
  (select count(*) from cari_kos_v3(-6.2019, 106.7818, 5000, p_harga_max => 5000000, p_limit => 200) where slug = 'kos-om-deddy'),
  0::bigint,
  'price filter: an incomplete total never passes a price ceiling');

create temp table murah as
  select row_number() over () as posisi, *
  from cari_kos_v3(-6.2019, 106.7818, 5000, p_urut => 'termurah', p_limit => 200);

select ok(
  (select min(posisi) from murah where not total_lengkap) > (select max(posisi) from murah where total_lengkap),
  'termurah: incomplete totals come after every complete one');

select is(
  (select total_bulanan from murah where posisi = 1),
  (select min(total_bulanan) from murah where total_lengkap),
  'termurah: the first result is the cheapest complete total, whatever its package');

select ok(
  (select bool_and(t.kamar_tersedia > 0 or not exists (select 1 from tipe_kamar x where x.kos_id = m.id and x.kamar_tersedia > 0))
     from murah m join tipe_kamar t on t.id = m.kamar_id),
  'displayed room: a full room is only shown when every room type is full');

-- 2. promotions -----------------------------------------------------------------
select ok(
  (select count(*) <= 2 from kos_promosi(-6.2019, 106.7818, 5000)),
  'promosi: at most two');

select ok(
  (select coalesce(bool_and(tier = 'spotlight' and kamar_acuan_tersedia > 0 and not perlu_dikonfirmasi), true)
     from kos_promosi(-6.2019, 106.7818, 5000)),
  'promosi: only spotlight kos with a free room and fresh data');

select is(
  (select count(*) from kos_promosi(-6.2019, 106.7818, 5000, p_harga_max => 3000000) p
    where p.id not in (select id from cari_kos_v3(-6.2019, 106.7818, 5000, p_harga_max => 3000000, p_limit => 200))),
  0::bigint,
  'promosi: every promoted kos also passes the same filters');

select is(
  (select count(*) from kos_promosi(-6.2019, 106.7818, 5000, p_tipe => 'putra') where tipe <> 'putra'),
  0::bigint,
  'promosi: the type filter applies to promotions too');

select ok(
  (select count(*) > 0 from kos_promosi(-6.2019, 106.7818, 5000)),
  'promosi: the seed has at least one eligible promotion near BINUS');

-- 3. card view: price, room and vacancy describe the same room ------------------
select is(
  (select count(*) from kos_kartu where (kamar ->> 'id')::uuid <> kamar_id or kamar ->> 'nama' <> kamar_nama),
  0::bigint,
  'kos_kartu: kamar json, kamar_id and kamar_nama agree');

select is(
  (select count(*) from kos_kartu where kamar_tersedia > 0 and kamar_acuan_tersedia = 0),
  0::bigint,
  'kos_kartu: when any room is free, the headline room is a free one');

select results_eq(
  $$ select kamar_nama, kamar_acuan_tersedia, kamar_tersedia, total_bulanan from kos_kartu where slug = 'kost-anggrek-cakra' $$,
  $$ values ('Standar (kipas)'::text, 4, 4, 1645000) $$,
  'Anggrek Cakra: headline is the free Standar room; the AC room (full) is not counted as available');

-- 4. transparency rubric --------------------------------------------------------
select is(
  (select count(*) from kos_skor where transparansi < 0 or transparansi > 5),
  0::bigint,
  'transparansi stays within 0–5');

select ok(
  (select transparansi < 5 from kos_skor s join kos k on k.id = s.kos_id where k.slug = 'kos-om-deddy'),
  'transparansi: an unknown mandatory fee costs points');

select is(
  (select count(*) from kos_skor where porsi_biaya_tambahan < 0 or porsi_biaya_tambahan >= 1),
  0::bigint,
  'porsi_biaya_tambahan is a share between 0 and 1');

-- 5. price check date follows price changes -------------------------------------
update tipe_kamar set harga_bulanan = harga_bulanan + 50000
where id = (select kamar_id from kos_kartu where slug = 'kost-bu-ning');
select ok(
  (select harga_dikonfirmasi_pada >= now() - interval '1 minute' from tipe_kamar
    where id = (select kamar_id from kos_kartu where slug = 'kost-bu-ning')),
  'a price change re-stamps harga_dikonfirmasi_pada');

-- 6. abuse limits ---------------------------------------------------------------
insert into laporan_user (kos_id, jenis)
select k.id, 'penuh' from kos k, generate_series(1, 20) where k.slug = 'kos-pak-darto';
select throws_ok(
  $$ insert into laporan_user (kos_id, jenis) select id, 'penuh' from kos where slug = 'kos-pak-darto' $$,
  '23514',
  null,
  'laporan_user: the 21st report on one kos within an hour is refused');

select throws_ok(
  $$ insert into laporan_user (kos_id, jenis, catatan) select id, 'lainnya', repeat('x', 501) from kos where slug = 'kos-ibu-yanti' $$,
  '23514',
  null,
  'laporan_user: a note longer than 500 characters is refused');

-- 7. seed narrative agrees with the measurements --------------------------------
select is(
  (select count(*) from catatan_surveyor c join kos_penilaian p on p.kos_id = c.kos_id
    where exists (select 1 from unnest(c.hal_baik) h where h ilike '%nyaris tidak terdengar%')
      and (p.skor_kedap is null or p.skor_kedap < 4 or p.material_tembok not in ('bata', 'hebel'))),
  0::bigint,
  'notes: "nyaris tidak terdengar" only appears with a measured kedap of 4+ and a brick/hebel wall');

select is(
  (select count(*) from catatan_surveyor c join kos_aturan a on a.kos_id = c.kos_id
    where exists (select 1 from unnest(c.perlu_diketahui) h
                  where (h ilike 'Mayoritas penghuni karyawan%' and a.mayoritas_penghuni <> 'karyawan')
                     or (h ilike 'Mayoritas penghuni mahasiswa%' and a.mayoritas_penghuni <> 'mahasiswa'))),
  0::bigint,
  'notes: who mostly lives there matches the rules record');

select is(
  (select count(*) from catatan_surveyor c join kos_aturan a on a.kos_id = c.kos_id
    where exists (select 1 from unnest(c.perlu_diketahui) h
                  where h ilike 'Jam malam%'
                    and (a.jam_malam is null or position(replace(to_char(a.jam_malam, 'HH24:MI'), ':', '.') in h) = 0))),
  0::bigint,
  'notes: a curfew note names the curfew recorded in the rules');

select is(
  (select count(*) from catatan_surveyor c join kos k on k.id = c.kos_id
    where exists (select 1 from unnest(c.red_flags) r where r ilike '%tidak ada penjaga%')
      and (k.penjaga <> 'tidak_ada'
           or exists (select 1 from kos_fasilitas kf join fasilitas f on f.id = kf.fasilitas_id
                      where kf.kos_id = k.id and f.slug = 'penjaga-24-jam'))),
  0::bigint,
  'red flag "no guard" agrees with the guard record and facilities');

select is(
  (select count(*) from kos_penilaian where db_tes is not null and kamar_diukur is null),
  0::bigint,
  'every noise test says which room it was done in');

select * from finish();
rollback;
