-- pgTAP checks for cari_kos_v3, kos_skor and RLS. Runs against the seeded
-- local stack:  npx supabase test db
--
-- Every count from cari_kos is compared against an independent plain query
-- so the function's filters are checked, not just its own consistency.
-- Literal numbers were hand-checked against the seed (regenerated in task 06); if the
-- seed changes, `npm run seed:generate` and re-derive them.

begin;
select plan(38);

-- Centre: BINUS Kampus Anggrek, radius 2.5 km.
create temp table pusat as
  select st_setsrid(st_makepoint(106.7818, -6.2019), 4326)::geography as titik;

-- Kos the public may see at all: tayang, fresh (≤ 90 days), has a room type.
create temp view terlihat as
  select k.*
  from kos k, pusat
  where k.status = 'tayang'
    and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
    and st_dwithin(k.lokasi, pusat.titik, 2500)
    and exists (select 1 from tipe_kamar t where t.kos_id = k.id);

-- 1. no filters ---------------------------------------------------------
select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 2500) limit 1),
  (select count(*) from terlihat),
  'no filters: total_count matches the visible set');

select is(
  (select count(*) from cari_kos_v3(-6.2019, 106.7818, 2500, p_limit => 100)),
  (select count(*) from terlihat),
  'no filters: every visible kos is returned when limit is large');

select is(
  (select count(*) from cari_kos_v3(-6.2019, 106.7818, 2500, p_limit => 5, p_offset => 5)),
  5::bigint,
  'pagination: limit 5 offset 5 returns 5 rows');

select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_limit => 5, p_offset => 5) limit 1),
  (select count(*) from terlihat),
  'pagination: total_count is unaffected by limit/offset');

-- 2. price ceiling on the real total -------------------------------------
select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_harga_max => 1200000) limit 1),
  (select count(*) from terlihat k
    where exists (select 1 from tipe_kamar t where t.kos_id = k.id and t.total_lengkap and t.total_bulanan <= 1200000)),
  'harga_max 1.2jt: matches kos with any room whose complete total_bulanan <= 1.2jt');

select ok(
  (select bool_and(total_bulanan <= 1200000)
     from cari_kos_v3(-6.2019, 106.7818, 2500, p_harga_max => 1200000, p_limit => 100)),
  'harga_max 1.2jt: every returned headline total is within the ceiling');

-- 3. type + must-have facilities -----------------------------------------
select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_tipe => 'putri', p_fasilitas => array['ac', 'kamar-mandi-dalam']) limit 1),
  (select count(*) from terlihat k
    where k.tipe = 'putri'
      and exists (select 1 from kos_fasilitas kf join fasilitas f on f.id = kf.fasilitas_id where kf.kos_id = k.id and f.slug = 'ac')
      and exists (select 1 from kos_fasilitas kf join fasilitas f on f.id = kf.fasilitas_id where kf.kos_id = k.id and f.slug = 'kamar-mandi-dalam')),
  'putri + ac + kamar mandi dalam: matches independent count');

-- 4. minimum survey scores ------------------------------------------------
select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_min_kebersihan => 4, p_min_kedap => 4) limit 1),
  (select count(*) from terlihat k join kos_skor s on s.kos_id = k.id
    where s.kebersihan >= 4 and s.kedap >= 4),
  'min kebersihan 4 + min kedap 4: matches the view');

select ok(
  (select bool_and(skor_kebersihan >= 4 and skor_kedap >= 4)
     from cari_kos_v3(-6.2019, 106.7818, 2500, p_min_kebersihan => 4, p_min_kedap => 4, p_limit => 100)),
  'min scores: every returned row satisfies both minimums');

-- 5. rule filter + price floor ---------------------------------------------
select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_harga_min => 1000000, p_aturan => '{"pasangan":"boleh"}') limit 1),
  (select count(*) from terlihat k join kos_aturan a on a.kos_id = k.id
    where a.pasangan = 'boleh'
      and exists (select 1 from tipe_kamar t where t.kos_id = k.id and t.total_lengkap and t.total_bulanan >= 1000000)),
  'pasangan boleh + harga_min 1jt: matches independent count');

-- 6. radius and exclusion --------------------------------------------------
select is(
  (select total_count from cari_kos_v3(-6.2019, 106.7818, 500) limit 1),
  (select count(*) from kos k, pusat
    where k.status = 'tayang'
      and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
      and st_dwithin(k.lokasi, pusat.titik, 500)),
  'radius 500 m: only kos within 500 m');

select is(
  (select count(*) from cari_kos_v3(-6.2019, 106.7818, 5000, p_limit => 200) where slug = 'pondok-mahasiswa-palmerah'),
  0::bigint,
  'availability older than 90 days is excluded');

select is(
  (select count(*) from cari_kos_v3(-6.2019, 106.7818, 5000, p_limit => 200) where slug in ('kos-mas-gilang', 'green-kost-anggrek', 'kos-bu-dewi')),
  0::bigint,
  'draft and arsip kos never appear');

-- 7. ordering ----------------------------------------------------------------
-- Full kos (0 rooms) sink to the very bottom (checked in cari_v2.test.sql);
-- everything else is ranked among the kos that still have a room.
create temp table urutan as
  select row_number() over () as posisi, *
  from cari_kos_v3(-6.2019, 106.7818, 5000, p_limit => 200);
create temp table aktif as
  select row_number() over (order by u.posisi) as posisi, u.slug, u.tier, u.perlu_dikonfirmasi, u.skor
  from urutan u where u.kamar_tersedia > 0;

select is(
  (select count(*) from urutan where tier = 'spotlight'),
  3::bigint,
  'ordering: all three Jakarta spotlight kos are in the result');

select ok(
  (select min(posisi) from aktif where tier = 'free' and not perlu_dikonfirmasi)
  > (select max(posisi) from aktif where tier in ('premium', 'spotlight') and not perlu_dikonfirmasi),
  'ordering: every fresh paid kos precedes every fresh free one');

select ok(
  (select bool_and(perlu_dikonfirmasi) from aktif where posisi > (select count(*) from aktif where not perlu_dikonfirmasi)),
  'ordering: every stale listing sits below every fresh one');

select is(
  (select count(*) from urutan where perlu_dikonfirmasi),
  (select count(*) from kos k, pusat
    where k.status = 'tayang'
      and st_dwithin(k.lokasi, pusat.titik, 5000)
      and k.ketersediaan_dikonfirmasi_pada < now() - interval '30 days'
      and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'),
  'ordering: stale flag is set for exactly the 30–90 day listings');

select ok(
  (select bool_and(skor_berikut is null or skor >= skor_berikut)
     from (select skor, lead(skor) over (order by posisi) as skor_berikut
           from aktif where not perlu_dikonfirmasi and tier = 'free') x),
  'ordering: within fresh free listings, relevance is by skor desc (nulls last)');

select ok(
  (select bool_and(total_berikut is null or total_bulanan <= total_berikut)
     from (select total_bulanan, lead(total_bulanan) over (order by posisi) as total_berikut
           from (select row_number() over () as posisi, *
                 from cari_kos_v3(-7.9526, 112.6141, 3000, p_urut => 'termurah', p_limit => 100)) m
           where total_lengkap) x),
  'termurah (Malang): the whole list, paid and free, is sorted by total ascending');

select ok(
  (select bool_and(jarak_berikut is null or jarak_m <= jarak_berikut)
     from (select jarak_m, lead(jarak_m) over (order by posisi) as jarak_berikut
           from (select row_number() over () as posisi, *
                 from cari_kos_v3(-6.2019, 106.7818, 5000, p_urut => 'terdekat', p_limit => 200)) m) x),
  'terdekat: the whole list, paid and free, is sorted by distance ascending');

select ok(
  (select bool_and(skor_berikut is null or skor is null and skor_berikut is null or skor >= skor_berikut)
     from (select skor, lead(skor) over (order by posisi) as skor_berikut
           from (select row_number() over () as posisi, *
                 from cari_kos_v3(-6.2019, 106.7818, 5000, p_urut => 'skor', p_limit => 200)) m) x)
  and (select bool_and(skor is null) from (select row_number() over () as posisi, *
         from cari_kos_v3(-6.2019, 106.7818, 5000, p_urut => 'skor', p_limit => 200)) m
       where posisi > (select count(*) from cari_kos_v3(-6.2019, 106.7818, 5000, p_limit => 200) where skor is not null)),
  'skor: the whole list, paid and free, is sorted by skor descending with unscored kos last');

-- 8. headline number is the real total ---------------------------------------
select ok(
  (select bool_and(total_bulanan >= harga_bulanan) from urutan),
  'total_bulanan is never below harga_bulanan');

select is(
  (select count(*) from tipe_kamar
    where total_bulanan <> harga_bulanan
      + case when model_listrik = 'termasuk' then 0 else coalesce(estimasi_listrik, 0) end
      + coalesce(biaya_air, 0)
      + case when boleh_ac then coalesce(biaya_ac, 0) else 0 end
      + biaya_lain_wajib(biaya_lain)),
  0::bigint,
  'generated total_bulanan follows the documented formula on every row');

-- 9. scoring never fabricates ----------------------------------------------
select is(
  (select count(*) from kos_skor s
    left join kos_penilaian p on p.kos_id = s.kos_id
    where s.skor is not null
      and (p.skor_kedap is null
           or (p.skor_kamar_mandi is not null)::int + (p.skor_dapur is not null)::int + (p.skor_koridor is not null)::int < 2)),
  0::bigint,
  'no kos has a skor when kedap is null or fewer than two cleanliness scores exist');

select is(
  (select skor from kos_skor s join kos k on k.id = s.kos_id where k.slug = 'rumah-kos-bu-endang'),
  null,
  'kos with no rubric row is "Belum dinilai"');

select is(
  (select skor from kos_skor s join kos k on k.id = s.kos_id where k.slug = 'kos-putra-bahagia'),
  null,
  'kos with null skor_kedap is "Belum dinilai"');

select is(
  (select skor from kos_skor s join kos k on k.id = s.kos_id where k.slug = 'kos-mbak-tuti'),
  null,
  'kos with a single cleanliness score is "Belum dinilai"');

select ok(
  (select count(*) >= 3 from catatan_surveyor where cardinality(red_flags) > 0),
  'at least three seeded kos carry red flags');

-- 10. hand-checked literals ------------------------------------------------------
-- Derived by listing the seed by hand (see prompts/02 acceptance). If the
-- seed is regenerated these will move; that is the point of writing them down.
select is((select total_count from cari_kos_v3(-6.2019, 106.7818, 2500) limit 1), 31::bigint,
  'literal: 31 visible kos within 2.5 km of BINUS Anggrek');
select is((select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_harga_max => 1200000) limit 1), 9::bigint,
  'literal: 9 of them have a room whose complete total is <= Rp1.200.000 (Om Deddy has no electricity estimate, so it does not count)');
select is((select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_tipe => 'putri', p_fasilitas => array['ac', 'kamar-mandi-dalam']) limit 1), 5::bigint,
  'literal: 5 kos putri with AC and kamar mandi dalam (Melati, Aisyah, Batusari Hijau, Anggrek Cakra, Griya Asri)');
select is((select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_min_kebersihan => 4, p_min_kedap => 4) limit 1), 5::bigint,
  'literal: 5 kos score >= 4 on both kebersihan and kedap (Suites, Batusari Hijau, Pak Ridwan, Melati, Bunda Ratna)');
select is((select total_count from cari_kos_v3(-6.2019, 106.7818, 2500, p_harga_min => 1000000, p_aturan => '{"pasangan":"boleh"}') limit 1), 3::bigint,
  'literal: 3 kos allow pasangan and have a room >= Rp1.000.000 (D''Kost Syahdan, Griya Kemanggisan, Slipi Residence)');
select is((select total_count from cari_kos_v3(-6.2019, 106.7818, 500) limit 1), 2::bigint,
  'literal: 2 kos within 500 m of the campus gate');

-- 11. RLS -----------------------------------------------------------------------
set local role anon;

select is(
  (select count(*) from kos where status <> 'tayang'),
  0::bigint,
  'anon: cannot see draft or arsip kos');

select is(
  (select count(*) from kos_penilaian p where not exists (select 1 from kos k where k.id = p.kos_id and k.status = 'tayang')),
  0::bigint,
  'anon: survey rows of non-tayang kos are invisible');

select lives_ok(
  $$ insert into klik_wa (kos_id, sumber) select id, 'kartu' from kos where slug = 'kos-putri-melati' $$,
  'anon: can log a WhatsApp click');

select throws_ok(
  $$ select count(*) from klik_wa $$,
  '42501',
  null,
  'anon: cannot read klik_wa back');

reset role;

select * from finish();
rollback;
