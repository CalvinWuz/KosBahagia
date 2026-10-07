-- pgTAP checks for the UX v3 filter contract (cari_kos_v4, kos_promosi_v2,
-- kos_cocok_v2): kos type is any-of, and room-level requirements (price,
-- kamar mandi dalam, AC) are met by the one room type the card shows.
--
-- Counts are compared against plain queries written independently of the
-- functions. Centre: BINUS Kampus Anggrek, 5 km (the Palmerah seed).

begin;
select plan(26);

-- 0. contract ------------------------------------------------------------------
select has_function('public', 'cari_kos_v4', 'cari_kos_v4 exists');
select has_function('public', 'kos_promosi_v2', 'kos_promosi_v2 exists');
select has_function('public', 'kos_cocok_v2', 'kos_cocok_v2 exists');
select has_function('public', 'cari_kos_v3', 'cari_kos_v3 stays for the deployed frontend');
select has_function('public', 'kos_promosi', 'kos_promosi stays for the deployed frontend');

-- The plain population every count below narrows: live, fresh, in radius.
create temp table populasi as
  select k.*
  from kos k
  where k.status = 'tayang'
    and k.ketersediaan_dikonfirmasi_pada >= now() - interval '90 days'
    and st_dwithin(k.lokasi, st_setsrid(st_makepoint(106.7818, -6.2019), 4326)::geography, 5000);

-- 1. kos type, any-of ---------------------------------------------------------
select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_tipe => array['putra', 'campur']::tipe_kos[], p_limit => 200) where tipe = 'putri'),
  0::bigint,
  'tipe putra + campur: no putri kos');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_tipe => array['putra', 'campur']::tipe_kos[], p_limit => 200)),
  (select count(*) from populasi where tipe in ('putra', 'campur')),
  'tipe putra + campur: every putra and campur kos (independent count)');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_tipe => array['campur']::tipe_kos[], p_limit => 200)),
  (select count(*) from populasi where tipe = 'campur'),
  'putra removed from the selection: campur alone still applies');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_tipe => array['putri', 'putra', 'campur']::tipe_kos[], p_limit => 200)),
  (select count(*) from populasi),
  'all three types = every type');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_tipe => '{}'::tipe_kos[], p_limit => 200)),
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_limit => 200)),
  'an empty type list = no type filter');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_limit => 200)),
  (select count(*) from cari_kos_v3(-6.2019, 106.7818, 5000, p_limit => 200)),
  'without filters the new search returns the same set as cari_kos_v3');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_tipe => array['putri']::tipe_kos[], p_min_kebersihan => 4, p_limit => 200)),
  (select count(*) from populasi p join kos_skor s on s.kos_id = p.id where p.tipe = 'putri' and s.kebersihan >= 4),
  'type AND another filter (kebersihan 4+)');

-- 2. kamar mandi dalam is a room-level requirement ----------------------------
select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200) c
    where (c.kamar ->> 'kamar_mandi_dalam')::boolean is not true),
  0::bigint,
  'kamar mandi dalam: every card shows a room that has one');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200)),
  (select count(*) from populasi p where exists (select 1 from tipe_kamar t where t.kos_id = p.id and t.kamar_mandi_dalam)),
  'kamar mandi dalam: every kos with such a room type (independent count)');

select results_eq(
  $$ select kamar_nama, total_bulanan, kamar_acuan_tersedia
       from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200)
      where slug = 'kost-anggrek-cakra' $$,
  $$ values ('AC + kamar mandi dalam'::text, 2195000, 0) $$,
  'Anggrek Cakra + kamar mandi dalam: the AC room (full) is shown with its own price and status');

select results_eq(
  $$ select kamar_nama from cari_kos_v4(-6.2019, 106.7818, 5000, p_limit => 200) where slug = 'kost-anggrek-cakra' $$,
  $$ values ('Standar (kipas)'::text) $$,
  'Anggrek Cakra without the filter: still the cheapest free room');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200) c
    join tipe_kamar t on t.id = c.kamar_id
   where not t.kamar_mandi_dalam or t.kos_id <> c.id),
  0::bigint,
  'kamar mandi dalam: kamar_id (the detail link) points at the qualifying room of the same kos');

-- 3. price and room requirements on the same room -----------------------------
select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_harga_max => 1500000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200)),
  (select count(*) from populasi p where exists (
     select 1 from tipe_kamar t where t.kos_id = p.id and t.kamar_mandi_dalam and t.total_lengkap and t.total_bulanan <= 1500000)),
  'price ≤ 1,5 jt + kamar mandi dalam: one room must meet both (independent count)');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_harga_max => 2200000, p_tipe => array['putri']::tipe_kos[], p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200)),
  (select count(*) from populasi p where p.tipe = 'putri' and exists (
     select 1 from tipe_kamar t where t.kos_id = p.id and t.kamar_mandi_dalam and t.total_lengkap and t.total_bulanan <= 2200000)),
  'price + kamar mandi dalam + type: same room for the room requirements, kos for the type');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_harga_max => 2200000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200) c
   where c.total_bulanan > 2200000 or not c.total_lengkap or (c.kamar ->> 'kamar_mandi_dalam')::boolean is not true),
  0::bigint,
  'price + kamar mandi dalam: the shown room is within the price and has the bathroom');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['ac'], p_limit => 200) c
   where not (c.kamar ->> 'boleh_ac')::boolean),
  0::bigint,
  'AC: every card shows an AC room');

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam', 'wifi'], p_limit => 200)),
  (select count(*) from populasi p
    where exists (select 1 from tipe_kamar t where t.kos_id = p.id and t.kamar_mandi_dalam)
      and exists (select 1 from kos_fasilitas kf join fasilitas f on f.id = kf.fasilitas_id where kf.kos_id = p.id and f.slug = 'wifi')),
  'room requirement AND a kos-level facility (WiFi)');

-- 4. an unknown value never meets an explicit requirement -----------------------
update tipe_kamar set kamar_mandi_dalam = null
 where kos_id = (select id from kos where slug = 'kost-putri-aisyah') and kamar_mandi_dalam;

select is(
  (select count(*) from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200) where slug = 'kost-putri-aisyah'),
  0::bigint,
  'kamar_mandi_dalam NULL (belum dicatat) is not treated as having one');

-- 5. promotions follow the same filters -----------------------------------------
select is(
  (select count(*) from kos_promosi_v2(-6.2019, 106.7818, 5000, p_tipe => array['putra', 'campur']::tipe_kos[]) where tipe = 'putri'),
  0::bigint,
  'promosi: the multi-type filter applies to promotions');

select is(
  (select count(*) from kos_promosi_v2(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam']) p
    where (p.kamar ->> 'kamar_mandi_dalam')::boolean is not true
       or p.id not in (select id from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200))),
  0::bigint,
  'promosi: a promoted kos shows a qualifying room and also passes the main search');

-- 6. sorting is unchanged -------------------------------------------------------
select is(
  (select total_bulanan from cari_kos_v4(-6.2019, 106.7818, 5000, p_urut => 'termurah', p_fasilitas => array['kamar-mandi-dalam'], p_limit => 1)),
  (select min(total_bulanan) from cari_kos_v4(-6.2019, 106.7818, 5000, p_fasilitas => array['kamar-mandi-dalam'], p_limit => 200) where total_lengkap),
  'termurah after a filter: the first result is the cheapest complete total');

select finish();
rollback;
