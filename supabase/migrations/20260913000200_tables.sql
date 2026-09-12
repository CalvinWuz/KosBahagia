-- Task 02 · tables, constraints, indexes, housekeeping triggers.
-- Money is integer rupiah. Rubric scores are smallint 1–5 and NULLABLE:
-- a missing measurement stays NULL and is never defaulted.

-- Sum of the mandatory items in tipe_kamar.biaya_lain. Immutable so it can
-- feed the generated total_bulanan column. Items look like
-- {"nama": "Sampah", "jumlah": 20000, "wajib": true}; wajib defaults to true.
create or replace function biaya_lain_wajib(biaya jsonb)
returns integer
language sql
immutable
parallel safe
as $$
  select coalesce(sum((b ->> 'jumlah')::integer), 0)::integer
  from jsonb_array_elements(coalesce(biaya, '[]'::jsonb)) as b
  where coalesce((b ->> 'wajib')::boolean, true);
$$;

-- ---------------------------------------------------------------- area
create table if not exists area (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  nama           text not null,
  tipe           tipe_area not null,
  lokasi         geography(Point, 4326) not null,
  deskripsi      text,
  seo_judul      text,
  seo_deskripsi  text
);

-- ---------------------------------------------------------------- owner
-- One row per authenticated owner. Renters never get a row anywhere.
create table if not exists owner (
  id                 uuid primary key references auth.users (id) on delete cascade,
  nama               text not null,
  whatsapp           text not null,
  terverifikasi_pada timestamptz
);

-- ---------------------------------------------------------------- kos
create table if not exists kos (
  id                              uuid primary key default gen_random_uuid(),
  slug                            text not null unique,
  nama                            text not null,
  alamat                          text not null,
  rt_rw                           text,
  lokasi                          geography(Point, 4326) not null,
  area_id                         uuid not null references area (id),
  tipe                            tipe_kos not null,
  jumlah_kamar                    smallint,
  jumlah_lantai                   smallint,
  ada_lift                        boolean not null default false,
  tahun_bangunan                  smallint,
  kontak_nama                     text not null,
  whatsapp                        text not null,
  penjaga                         jenis_penjaga,
  status                          status_kos not null default 'draft',
  tier                            tier_kos not null default 'free',
  owner_id                        uuid references owner (id) on delete set null,
  disurvei_pada                   date,
  surveyor                        text,
  ketersediaan_dikonfirmasi_pada  timestamptz,
  dibuat_pada                     timestamptz not null default now(),
  diubah_pada                     timestamptz not null default now(),
  -- E.164 digits without "+", ready for wa.me links.
  constraint kos_whatsapp_format check (whatsapp ~ '^62[0-9]{8,13}$'),
  -- Nothing goes live without a named surveyor and a survey date.
  constraint kos_tayang_harus_disurvei check (
    status <> 'tayang' or (disurvei_pada is not null and surveyor is not null)
  )
);

-- ---------------------------------------------------------------- tipe_kamar
create table if not exists tipe_kamar (
  id                  uuid primary key default gen_random_uuid(),
  kos_id              uuid not null references kos (id) on delete cascade,
  nama                text not null,
  ukuran              text,
  harga_bulanan       integer not null check (harga_bulanan > 0),
  harga_tahunan       integer,
  durasi_minimal      smallint not null default 1,
  deposit             integer not null default 0,
  deposit_kembali     opsi_deposit_kembali,
  model_listrik       model_listrik not null,
  estimasi_listrik    integer,   -- flat fee, or surveyor's monthly estimate; NULL when termasuk
  boleh_ac            boolean not null default false,
  biaya_ac            integer,   -- monthly AC surcharge when boleh_ac
  biaya_air           integer,   -- NULL or 0 = termasuk
  laundry             opsi_laundry not null default 'tidak_ada',
  biaya_laundry       integer,
  parkir_motor        boolean not null default false,
  biaya_parkir_motor  integer,
  parkir_mobil        boolean not null default false,
  biaya_parkir_mobil  integer,
  biaya_lain          jsonb not null default '[]'::jsonb,
  kamar_tersedia      smallint not null default 0,
  total_kamar         smallint not null default 1,
  -- The headline number. Rent + electricity + water + AC surcharge + mandatory
  -- other fees. Optional spend (laundry, parking) is deliberately excluded.
  total_bulanan       integer generated always as (
    harga_bulanan
    + case when model_listrik = 'termasuk' then 0 else coalesce(estimasi_listrik, 0) end
    + coalesce(biaya_air, 0)
    + case when boleh_ac then coalesce(biaya_ac, 0) else 0 end
    + biaya_lain_wajib(biaya_lain)
  ) stored,
  constraint tipe_kamar_tersedia_masuk_akal check (kamar_tersedia between 0 and total_kamar),
  constraint tipe_kamar_biaya_lain_array check (jsonb_typeof(biaya_lain) = 'array')
);

-- ---------------------------------------------------------------- kos_penilaian
create table if not exists kos_penilaian (
  kos_id            uuid primary key references kos (id) on delete cascade,
  skor_kamar_mandi  smallint check (skor_kamar_mandi between 1 and 5),
  skor_dapur        smallint check (skor_dapur between 1 and 5),
  skor_koridor      smallint check (skor_koridor between 1 and 5),
  pembersih         text,
  frekuensi_bersih  text,
  frekuensi_sampah  text,
  material_tembok   text,
  db_ambient        smallint,
  db_tes            smallint,
  skor_kedap        smallint check (skor_kedap between 1 and 5),
  hadap_jalan_raya  boolean,
  sumber_bising     text[] not null default '{}'
);

-- ---------------------------------------------------------------- fasilitas
create table if not exists fasilitas (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  nama           text not null,
  kategori       kategori_fasilitas not null,
  ikon           text,
  bisa_difilter  boolean not null default false
);

create table if not exists kos_fasilitas (
  kos_id        uuid not null references kos (id) on delete cascade,
  fasilitas_id  uuid not null references fasilitas (id) on delete cascade,
  primary key (kos_id, fasilitas_id)
);

-- ---------------------------------------------------------------- kos_aturan
create table if not exists kos_aturan (
  kos_id              uuid primary key references kos (id) on delete cascade,
  jam_malam           time,
  tamu                opsi_tamu not null default 'ruang_tamu',
  lawan_jenis         opsi_tamu not null default 'tidak',
  pasangan            opsi_pasangan not null default 'tidak',
  anak                boolean not null default false,
  hewan               boolean not null default false,
  masak_di_kamar      boolean not null default false,
  merokok             opsi_merokok not null default 'luar',
  mayoritas_penghuni  text,
  suasana             text
);

-- ---------------------------------------------------------------- kos_sekitar
create table if not exists kos_sekitar (
  kos_id                uuid primary key references kos (id) on delete cascade,
  landmark_nama         text not null,
  landmark_jarak_m      integer not null,
  landmark_menit_jalan  smallint,
  rute                  jsonb not null default '[]'::jsonb,
  minimarket            jsonb,
  warung                jsonb,
  laundry               jsonb,
  transit               jsonb,
  akses                 akses_jalan not null default 'motor',
  penerangan            smallint check (penerangan between 1 and 5),
  rawan_banjir          boolean
);

-- ---------------------------------------------------------------- kos_media
create table if not exists kos_media (
  id          uuid primary key default gen_random_uuid(),
  kos_id      uuid not null references kos (id) on delete cascade,
  jenis       jenis_media not null default 'foto',
  url         text not null,
  keterangan  text,
  urutan      smallint not null default 0,
  lebar       integer not null check (lebar > 0),
  tinggi      integer not null check (tinggi > 0),
  blurhash    text
);

-- ---------------------------------------------------------------- catatan_surveyor
create table if not exists catatan_surveyor (
  kos_id           uuid primary key references kos (id) on delete cascade,
  hal_baik         text[] not null default '{}',
  perlu_diketahui  text[] not null default '{}',
  kesan_pemilik    text,
  red_flags        text[] not null default '{}'
);

-- ---------------------------------------------------------------- logs
create table if not exists log_ketersediaan (
  id              bigint generated always as identity primary key,
  kos_id          uuid not null references kos (id) on delete cascade,
  tipe_kamar_id   uuid references tipe_kamar (id) on delete set null,
  kamar_tersedia  smallint not null,
  sumber          sumber_ketersediaan not null,
  dibuat_pada     timestamptz not null default now()
);

create table if not exists laporan_user (
  id           bigint generated always as identity primary key,
  kos_id       uuid not null references kos (id) on delete cascade,
  jenis        jenis_laporan not null,
  catatan      text,
  dibuat_pada  timestamptz not null default now()
);

-- Every WhatsApp handoff writes here. This is the number we sell to owners.
create table if not exists klik_wa (
  id           bigint generated always as identity primary key,
  kos_id       uuid not null references kos (id) on delete cascade,
  sumber       sumber_klik not null,
  dibuat_pada  timestamptz not null default now(),
  referrer     text
);

-- ---------------------------------------------------------------- indexes
create index if not exists kos_lokasi_gist on kos using gist (lokasi);
create index if not exists area_lokasi_gist on area using gist (lokasi);
create index if not exists kos_nama_trgm on kos using gin (nama extensions.gin_trgm_ops);
create index if not exists area_nama_trgm on area using gin (nama extensions.gin_trgm_ops);
create index if not exists kos_ketersediaan_idx on kos (ketersediaan_dikonfirmasi_pada);
create index if not exists kos_area_idx on kos (area_id);
create index if not exists kos_status_idx on kos (status);
create index if not exists kos_owner_idx on kos (owner_id);
create index if not exists tipe_kamar_kos_idx on tipe_kamar (kos_id);
create index if not exists kos_media_kos_idx on kos_media (kos_id, urutan);
create index if not exists kos_fasilitas_fasilitas_idx on kos_fasilitas (fasilitas_id);
create index if not exists log_ketersediaan_kos_idx on log_ketersediaan (kos_id, dibuat_pada desc);
create index if not exists klik_wa_kos_idx on klik_wa (kos_id, dibuat_pada desc);
create index if not exists laporan_user_kos_idx on laporan_user (kos_id, dibuat_pada desc);

-- ---------------------------------------------------------------- triggers
create or replace function set_diubah_pada()
returns trigger
language plpgsql
as $$
begin
  new.diubah_pada := now();
  return new;
end;
$$;

drop trigger if exists kos_set_diubah_pada on kos;
create trigger kos_set_diubah_pada
  before update on kos
  for each row execute function set_diubah_pada();

-- Product rule 3: freshness is public. Any change to kamar_tersedia is
-- logged and re-stamps the kos, whoever made it. SECURITY DEFINER so an
-- owner (who cannot write logs directly) still leaves a trail.
create or replace function catat_ketersediaan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.kamar_tersedia is distinct from old.kamar_tersedia then
    insert into log_ketersediaan (kos_id, tipe_kamar_id, kamar_tersedia, sumber)
    values (
      new.kos_id,
      new.id,
      new.kamar_tersedia,
      case when auth.uid() is null then 'survei'::sumber_ketersediaan else 'pemilik'::sumber_ketersediaan end
    );
    update kos set ketersediaan_dikonfirmasi_pada = now() where id = new.kos_id;
  end if;
  return new;
end;
$$;

drop trigger if exists tipe_kamar_catat_ketersediaan on tipe_kamar;
create trigger tipe_kamar_catat_ketersediaan
  after update of kamar_tersedia on tipe_kamar
  for each row execute function catat_ketersediaan();

-- A paid tier never alters survey data, and owners never set their own tier.
-- Only the service role (no JWT, or role = service_role) may touch these.
create or replace function lindungi_kolom_survei()
returns trigger
language plpgsql
as $$
declare
  peran text := coalesce(auth.jwt() ->> 'role', 'service_role');
begin
  if peran <> 'service_role' and (
       new.tier is distinct from old.tier
    or new.surveyor is distinct from old.surveyor
    or new.disurvei_pada is distinct from old.disurvei_pada
  ) then
    raise exception 'tier, surveyor dan disurvei_pada hanya bisa diubah oleh tim Kos Bahagia'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists kos_lindungi_kolom_survei on kos;
create trigger kos_lindungi_kolom_survei
  before update on kos
  for each row execute function lindungi_kolom_survei();
