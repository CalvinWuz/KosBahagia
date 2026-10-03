-- Audit 2026-10 · one price model, room-type context, honest transparency.
--
-- What this adds (additive only: the live site keeps working on the old
-- columns until the new frontend ships):
--   tipe_kamar.kamar_mandi_dalam      per room type; NULL = belum dicatat
--   tipe_kamar.bayar_dimuka_bulan     months paid up front; NULL = belum diketahui
--                                     (separate from durasi_minimal, the minimum stay)
--   tipe_kamar.biaya_sekali           one-off entry fees [{nama, jumlah|null}]
--   tipe_kamar.ketentuan_deposit      how and when the deposit comes back
--   tipe_kamar.harga_dikonfirmasi_pada  last time the prices were checked
--   tipe_kamar.total_lengkap          every mandatory monthly fee has a number
--   tipe_kamar.total_estimasi         the total contains a usage-based estimate
--   kos_penilaian.kamar_diukur        which room the noise test was done in
--   kos_skor.transparansi             now scores disclosure, not fee share
--   kos_skor.porsi_biaya_tambahan     the old fee-share metric, kept as information
--   kos_kartu: headline room = cheapest room that still has space, plus the
--              room's id/name/status and the full row as `kamar`
--
-- Money stays integer rupiah. An unknown amount is NULL, never 0.

set search_path = public, extensions;

-- ---------------------------------------------------------------- helpers
-- True when every mandatory item in a fee list has an amount. Items look like
-- {"nama": "Sampah", "jumlah": 20000, "wajib": true}; wajib defaults to true.
create or replace function biaya_lain_lengkap(biaya jsonb)
returns boolean
language sql
immutable
parallel safe
as $$
  select not exists (
    select 1
    from jsonb_array_elements(coalesce(biaya, '[]'::jsonb)) as b
    where coalesce((b ->> 'wajib')::boolean, true)
      and (b ->> 'jumlah') is null
  );
$$;

-- ---------------------------------------------------------------- tipe_kamar
alter table tipe_kamar add column if not exists kamar_mandi_dalam boolean;
alter table tipe_kamar add column if not exists bayar_dimuka_bulan smallint;
alter table tipe_kamar add column if not exists biaya_sekali jsonb not null default '[]'::jsonb;
alter table tipe_kamar add column if not exists ketentuan_deposit text;
alter table tipe_kamar add column if not exists harga_dikonfirmasi_pada timestamptz;

do $$ begin
  alter table tipe_kamar add constraint tipe_kamar_bayar_dimuka_masuk_akal
    check (bayar_dimuka_bulan is null or bayar_dimuka_bulan between 1 and 24);
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table tipe_kamar add constraint tipe_kamar_biaya_sekali_array
    check (jsonb_typeof(biaya_sekali) = 'array');
exception when duplicate_object then null;
end $$;

-- Electricity on token/meteran without an estimate, or a mandatory fee
-- without an amount, makes the total incomplete. total_bulanan still sums
-- what is known; the UI and the search treat an incomplete total as
-- "belum lengkap", never as the full price.
alter table tipe_kamar add column if not exists total_lengkap boolean generated always as (
  (model_listrik = 'termasuk' or estimasi_listrik is not null)
  and biaya_lain_lengkap(biaya_lain)
) stored;

-- Token and meteran electricity are billed by use; the surveyor's number is
-- an estimate, so the total is an estimate too. Flat fees are not.
alter table tipe_kamar add column if not exists total_estimasi boolean generated always as (
  model_listrik in ('token', 'meteran') and estimasi_listrik is not null
) stored;

comment on column tipe_kamar.bayar_dimuka_bulan is 'Months of rent paid up front at move-in; NULL = not known. Not the same as durasi_minimal.';
comment on column tipe_kamar.biaya_sekali is 'One-off entry fees [{nama, jumlah|null}]; jumlah NULL = amount not known.';
comment on column tipe_kamar.total_lengkap is 'Every mandatory monthly fee has an amount.';
comment on column tipe_kamar.total_estimasi is 'Total includes a usage-based electricity estimate.';

-- Prices without a check date are as old as the survey.
update tipe_kamar t
set harga_dikonfirmasi_pada = coalesce(k.disurvei_pada::timestamptz, k.dibuat_pada)
from kos k
where k.id = t.kos_id and t.harga_dikonfirmasi_pada is null;

-- Any price change re-stamps the check date, whoever made it.
create or replace function stempel_harga()
returns trigger
language plpgsql
as $$
begin
  if (new.harga_bulanan, new.harga_tahunan, new.deposit, new.model_listrik, new.estimasi_listrik,
      new.biaya_ac, new.biaya_air, new.biaya_lain, new.biaya_sekali, new.bayar_dimuka_bulan)
     is distinct from
     (old.harga_bulanan, old.harga_tahunan, old.deposit, old.model_listrik, old.estimasi_listrik,
      old.biaya_ac, old.biaya_air, old.biaya_lain, old.biaya_sekali, old.bayar_dimuka_bulan)
     and new.harga_dikonfirmasi_pada is not distinct from old.harga_dikonfirmasi_pada
  then
    new.harga_dikonfirmasi_pada := now();
  end if;
  return new;
end;
$$;

drop trigger if exists tipe_kamar_stempel_harga on tipe_kamar;
create trigger tipe_kamar_stempel_harga
  before update on tipe_kamar
  for each row execute function stempel_harga();

-- ---------------------------------------------------------------- kos_penilaian
alter table kos_penilaian add column if not exists kamar_diukur text;
comment on column kos_penilaian.kamar_diukur is 'Room the noise test was done in, e.g. "Tipe Standar, lantai 2".';

-- ---------------------------------------------------------------- kos_skor
-- Same formula and weights as before except transparansi, which now scores
-- how completely the costs are disclosed. Per room type, four checks:
--   1. bayar_dimuka_bulan is known (with durasi_minimal, which is NOT NULL)
--   2. total_lengkap (every mandatory monthly fee has a number; usage-based
--      electricity has an estimate)
--   3. deposit terms are clear: no deposit, or both deposit_kembali and
--      ketentuan_deposit are recorded; every one-off fee has an amount
--   4. prices were checked in the last 90 days
-- transparansi = 5 × (checks met / 4), averaged over the kos's room types,
-- two decimals. The old fee-share number is porsi_biaya_tambahan (0–1, the
-- headline room's non-rent share of its total) and is not part of the score.
-- lib/scoring.ts mirrors this; npm run cek:skor-db compares the two.
create or replace view kos_skor
with (security_invoker = on)
as
with termurah as (
  select distinct on (kos_id) kos_id, harga_bulanan, total_bulanan
  from tipe_kamar
  order by kos_id, total_bulanan, harga_bulanan
),
fas as (
  select kf.kos_id, count(*)::integer as n
  from kos_fasilitas kf
  join fasilitas f on f.id = kf.fasilitas_id
  where f.bisa_difilter
  group by kf.kos_id
),
dasar as (
  select
    k.id as kos_id,
    t.harga_bulanan,
    t.total_bulanan,
    coalesce(fs.n, 0) as n_fasilitas,
    t.total_bulanan / 250000 as ember
  from kos k
  join termurah t on t.kos_id = k.id
  left join fas fs on fs.kos_id = k.id
  where k.status = 'tayang'
),
peringkat as (
  select
    d.*,
    case
      when count(*) over (partition by ember) = 1 then 0.5
      else (
        (rank() over (partition by ember order by n_fasilitas) - 1)
        + (count(*) over (partition by ember, n_fasilitas) - 1) / 2.0
      ) / (count(*) over (partition by ember) - 1)
    end as persentil
  from dasar d
),
keterbukaan as (
  select
    t.kos_id,
    round(avg(
      1.25 * (
        (t.bayar_dimuka_bulan is not null)::int
        + t.total_lengkap::int
        + (
            (t.deposit = 0 or (t.deposit_kembali is not null and nullif(btrim(t.ketentuan_deposit), '') is not null))
            and biaya_lain_lengkap(t.biaya_sekali)
          )::int
        + (t.harga_dikonfirmasi_pada >= now() - interval '90 days')::int
      )
    ), 2) as nilai
  from tipe_kamar t
  group by t.kos_id
),
komponen as (
  select
    p.kos_id,
    p.n_fasilitas,
    case
      when (n.skor_kamar_mandi is not null)::int
         + (n.skor_dapur is not null)::int
         + (n.skor_koridor is not null)::int >= 2
      then round(
        (coalesce(n.skor_kamar_mandi, 0) + coalesce(n.skor_dapur, 0) + coalesce(n.skor_koridor, 0))::numeric
        / ((n.skor_kamar_mandi is not null)::int + (n.skor_dapur is not null)::int + (n.skor_koridor is not null)::int),
        2)
    end as kebersihan,
    n.skor_kedap::numeric as kedap,
    coalesce(ke.nilai, 0) as transparansi,
    round(1 + 4 * p.persentil, 2) as fasilitas,
    (
      select round(avg(x), 2)
      from unnest(array[
        case
          when s.landmark_menit_jalan is null then null
          when s.landmark_menit_jalan <= 5 then 5
          when s.landmark_menit_jalan <= 10 then 4
          when s.landmark_menit_jalan <= 15 then 3
          when s.landmark_menit_jalan <= 20 then 2
          else 1
        end,
        s.penerangan,
        case
          when s.kos_id is null then null
          else 1
            + (s.minimarket is not null)::int
            + (s.warung is not null)::int
            + (s.laundry is not null)::int
            + (s.transit is not null)::int
        end
      ]::numeric[]) as x
    ) as sekitar,
    round((p.total_bulanan - p.harga_bulanan)::numeric / p.total_bulanan, 4) as porsi_biaya_tambahan
  from peringkat p
  left join kos_penilaian n on n.kos_id = p.kos_id
  left join kos_sekitar s on s.kos_id = p.kos_id
  left join keterbukaan ke on ke.kos_id = p.kos_id
)
select
  kos_id,
  kebersihan,
  kedap,
  transparansi,
  fasilitas,
  sekitar,
  n_fasilitas,
  case
    when kebersihan is null or kedap is null then null
    else round(
      10 * (
        0.30 * kebersihan / 5
        + 0.20 * kedap / 5
        + 0.20 * transparansi / 5
        + 0.15 * fasilitas / 5
        + coalesce(0.15 * sekitar / 5, 0)
      ) / (0.85 + case when sekitar is null then 0 else 0.15 end),
      1)
  end as skor,
  porsi_biaya_tambahan
from komponen;

-- ---------------------------------------------------------------- kos_kartu
-- The headline room is the cheapest room type that still has a free room
-- (falling back to the cheapest when the kos is full), preferring complete
-- totals. Its price, name and availability travel together, so a card never
-- shows one room's price next to another room's vacancy. kamar_tersedia stays
-- the whole kos's count; kamar_acuan_tersedia is the headline room's.
create or replace view kos_kartu
with (security_invoker = on)
as
with acuan as (
  select distinct on (kos_id) *
  from tipe_kamar
  order by kos_id, (kamar_tersedia = 0), (not total_lengkap), total_bulanan, harga_bulanan, id
),
tersedia as (
  select kos_id, sum(kamar_tersedia)::integer as kamar_tersedia, count(*)::integer as jumlah_tipe
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
  sk.landmark_menit_jalan,
  exists (select 1 from kos_media m where m.kos_id = k.id and m.jenis = 'foto360') as ada_360,
  t.id as kamar_id,
  t.nama as kamar_nama,
  t.kamar_tersedia::integer as kamar_acuan_tersedia,
  t.total_kamar::integer as kamar_acuan_total,
  coalesce(v.jumlah_tipe, 0) as jumlah_tipe_kamar,
  t.total_lengkap,
  t.total_estimasi,
  to_jsonb(t) as kamar
from kos k
join area a on a.id = k.area_id
join acuan t on t.kos_id = k.id
left join tersedia v on v.kos_id = k.id
left join kos_skor s on s.kos_id = k.id
left join catatan_surveyor c on c.kos_id = k.id
left join foto f on f.kos_id = k.id
left join kos_sekitar sk on sk.kos_id = k.id;

grant select on kos_skor, kos_kartu to anon, authenticated;
