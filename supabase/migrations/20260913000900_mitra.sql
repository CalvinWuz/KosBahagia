-- Task 08 · owner (mitra) surface.
--   pendaftaran_mitra      the short application form (anon insert only)
--   kunjungan_kos          detail-page views (anon insert; owner reads own)
--   permintaan_koreksi     owner asks the survey team to fix a measured field
--   tautan_ketersediaan    one-tap capability links sent by WhatsApp
--   pengingat_wa           log of reminder messages (which channel works)
--   kos.deskripsi          owner-written description
--   catat_ketersediaan     honours kb.sumber so token updates log as bot_wa
--   *_via_tautan           read/update availability with a link token
--   statistik_mitra        the numbers on the dashboard

create extension if not exists pgcrypto with schema extensions;

alter table kos add column if not exists deskripsi text;

-- ---------------------------------------------------------------- tables
create table if not exists pendaftaran_mitra (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  whatsapp      text not null check (whatsapp ~ '^62[0-9]{8,13}$'),
  nama_kos      text not null,
  alamat        text not null,
  jumlah_kamar  smallint not null check (jumlah_kamar between 1 and 500),
  status        text not null default 'baru',
  dibuat_pada   timestamptz not null default now()
);

create table if not exists kunjungan_kos (
  id           bigint generated always as identity primary key,
  kos_id       uuid not null references kos (id) on delete cascade,
  dibuat_pada  timestamptz not null default now()
);
create index if not exists kunjungan_kos_idx on kunjungan_kos (kos_id, dibuat_pada desc);

create table if not exists permintaan_koreksi (
  id           uuid primary key default gen_random_uuid(),
  kos_id       uuid not null references kos (id) on delete cascade,
  owner_id     uuid not null references owner (id) on delete cascade,
  bidang       text not null,
  pesan        text not null,
  status       text not null default 'baru',
  dibuat_pada  timestamptz not null default now()
);
create index if not exists permintaan_koreksi_kos_idx on permintaan_koreksi (kos_id, dibuat_pada desc);

create table if not exists tautan_ketersediaan (
  id             uuid primary key default gen_random_uuid(),
  kos_id         uuid not null references kos (id) on delete cascade,
  owner_id       uuid references owner (id) on delete cascade,
  token_hash     text not null unique,
  kadaluarsa     timestamptz not null,
  dipakai_pada   timestamptz,
  dibuat_pada    timestamptz not null default now()
);

create table if not exists pengingat_wa (
  id           bigint generated always as identity primary key,
  kos_id       uuid not null references kos (id) on delete cascade,
  owner_id     uuid references owner (id) on delete set null,
  whatsapp     text not null,
  pesan        text not null,
  status       text not null default 'dikirim',
  dikirim_pada timestamptz not null default now()
);
create index if not exists pengingat_wa_kos_idx on pengingat_wa (kos_id, dikirim_pada desc);

-- ---------------------------------------------------------------- RLS
alter table pendaftaran_mitra    enable row level security;
alter table kunjungan_kos        enable row level security;
alter table permintaan_koreksi   enable row level security;
alter table tautan_ketersediaan  enable row level security;
alter table pengingat_wa         enable row level security;

drop policy if exists pendaftaran_kirim on pendaftaran_mitra;
create policy pendaftaran_kirim on pendaftaran_mitra for insert to anon, authenticated with check (true);

drop policy if exists kunjungan_catat on kunjungan_kos;
create policy kunjungan_catat on kunjungan_kos for insert to anon, authenticated with check (kos_tayang(kos_id));
drop policy if exists kunjungan_baca_pemilik on kunjungan_kos;
create policy kunjungan_baca_pemilik on kunjungan_kos for select to authenticated using (punya_kos(kos_id));

drop policy if exists koreksi_buat_pemilik on permintaan_koreksi;
create policy koreksi_buat_pemilik on permintaan_koreksi for insert to authenticated
  with check (owner_id = auth.uid() and punya_kos(kos_id));
drop policy if exists koreksi_baca_pemilik on permintaan_koreksi;
create policy koreksi_baca_pemilik on permintaan_koreksi for select to authenticated using (owner_id = auth.uid());

-- Owners may read the user reports for their own kos (dashboard "laporan menunggu").
drop policy if exists laporan_user_baca_pemilik on laporan_user;
create policy laporan_user_baca_pemilik on laporan_user for select to authenticated using (punya_kos(kos_id));

-- tautan_ketersediaan and pengingat_wa: service role only (no policies).

revoke all on pendaftaran_mitra, kunjungan_kos, permintaan_koreksi, tautan_ketersediaan, pengingat_wa from anon, authenticated;
grant insert on pendaftaran_mitra to anon, authenticated;
grant insert on kunjungan_kos to anon, authenticated;
grant select on kunjungan_kos, laporan_user to authenticated;
grant select, insert on permintaan_koreksi to authenticated;

-- ---------------------------------------------------------------- availability source
-- The trigger from task 02 now honours a transaction-local setting so a
-- token-based update is logged as bot_wa rather than pemilik/survei.
create or replace function catat_ketersediaan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sumber_pilihan text := nullif(current_setting('kb.sumber', true), '');
begin
  if new.kamar_tersedia is distinct from old.kamar_tersedia then
    insert into log_ketersediaan (kos_id, tipe_kamar_id, kamar_tersedia, sumber)
    values (
      new.kos_id,
      new.id,
      new.kamar_tersedia,
      coalesce(
        sumber_pilihan::sumber_ketersediaan,
        case when auth.uid() is null then 'survei'::sumber_ketersediaan else 'pemilik'::sumber_ketersediaan end
      )
    );
    update kos set ketersediaan_dikonfirmasi_pada = now() where id = new.kos_id;
  end if;
  return new;
end;
$$;

-- Owners confirming "still the same" must also re-stamp freshness.
create or replace function konfirmasi_ketersediaan(p_kos_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update kos set ketersediaan_dikonfirmasi_pada = now()
  where id = p_kos_id and owner_id = auth.uid();
  insert into log_ketersediaan (kos_id, tipe_kamar_id, kamar_tersedia, sumber)
  select kos_id, id, kamar_tersedia, 'pemilik'
  from tipe_kamar where kos_id = p_kos_id and exists (select 1 from kos where id = p_kos_id and owner_id = auth.uid());
$$;
grant execute on function konfirmasi_ketersediaan to authenticated;

-- ---------------------------------------------------------------- capability links
-- Service role mints a link; the raw token is returned once and only its
-- hash is stored. Valid 7 days, reusable until then (owners tap it twice).
create or replace function buat_tautan_ketersediaan(p_kos_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  token text := encode(gen_random_bytes(24), 'hex');
begin
  insert into tautan_ketersediaan (kos_id, owner_id, token_hash, kadaluarsa)
  select id, owner_id, encode(digest(token, 'sha256'), 'hex'), now() + interval '7 days'
  from kos where id = p_kos_id;
  return token;
end;
$$;
revoke execute on function buat_tautan_ketersediaan from public, anon, authenticated;

create or replace function baca_ketersediaan_via_tautan(p_token text)
returns table (kos_id uuid, kos_nama text, tipe_kamar_id uuid, nama text, kamar_tersedia smallint, total_kamar smallint, dikonfirmasi_pada timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select k.id, k.nama, t.id, t.nama, t.kamar_tersedia, t.total_kamar, k.ketersediaan_dikonfirmasi_pada
  from tautan_ketersediaan l
  join kos k on k.id = l.kos_id
  join tipe_kamar t on t.kos_id = k.id
  where l.token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and l.kadaluarsa > now()
  order by t.total_bulanan;
$$;

-- p_perubahan: {"<tipe_kamar_id>": <kamar_tersedia>, ...}
create or replace function perbarui_ketersediaan_via_tautan(p_token text, p_perubahan jsonb)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  tautan tautan_ketersediaan%rowtype;
  n integer := 0;
  r record;
begin
  select * into tautan from tautan_ketersediaan
  where token_hash = encode(digest(p_token, 'sha256'), 'hex') and kadaluarsa > now();
  if not found then
    raise exception 'Tautan tidak berlaku' using errcode = 'invalid_authorization_specification';
  end if;
  perform set_config('kb.sumber', 'bot_wa', true);
  for r in select key::uuid as id, value::text::smallint as jumlah from jsonb_each(p_perubahan) loop
    update tipe_kamar set kamar_tersedia = least(greatest(r.jumlah, 0), total_kamar)
    where id = r.id and kos_id = tautan.kos_id;
    n := n + 1;
  end loop;
  -- "Masih sama" also counts as a confirmation.
  update kos set ketersediaan_dikonfirmasi_pada = now() where id = tautan.kos_id;
  update tautan_ketersediaan set dipakai_pada = now() where id = tautan.id;
  return n;
end;
$$;
grant execute on function baca_ketersediaan_via_tautan, perbarui_ketersediaan_via_tautan to anon, authenticated;

-- ---------------------------------------------------------------- dashboard numbers
-- Runs as the caller: RLS on klik_wa/kunjungan_kos already limits owners to
-- their own kos. The area median is public data (tayang kos), so it is
-- computed with security definer in a helper.
create or replace function median_area_bulan_ini(p_kos_id uuid)
returns table (median_kunjungan numeric, median_klik numeric)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with pusat as (
    select a.lokasi, area_radius_m(a.tipe) as radius from kos k join area a on a.id = k.area_id where k.id = p_kos_id
  ),
  anggota as (
    select k.id from kos k, pusat where k.status = 'tayang' and st_dwithin(k.lokasi, pusat.lokasi, pusat.radius)
  ),
  angka as (
    select m.id,
      (select count(*) from kunjungan_kos v where v.kos_id = m.id and v.dibuat_pada >= date_trunc('month', now())) as kunjungan,
      (select count(*) from klik_wa c where c.kos_id = m.id and c.dibuat_pada >= date_trunc('month', now())) as klik
    from anggota m
  )
  select percentile_cont(0.5) within group (order by kunjungan), percentile_cont(0.5) within group (order by klik) from angka;
$$;
grant execute on function median_area_bulan_ini to authenticated;

-- Position of a kos in its own area's default search (1 = top).
create or replace function posisi_di_area(p_kos_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  with pusat as (
    select st_y(a.lokasi::geometry) as lat, st_x(a.lokasi::geometry) as lng, area_radius_m(a.tipe) as radius
    from kos k join area a on a.id = k.area_id where k.id = p_kos_id
  ),
  hasil as (
    select c.id, row_number() over () as posisi
    from pusat, lateral cari_kos(pusat.lat, pusat.lng, pusat.radius, p_limit => 500) c
  )
  select posisi::integer from hasil where id = p_kos_id;
$$;
grant execute on function posisi_di_area to authenticated;

-- ---------------------------------------------------------------- photos
-- Owners upload into foto-kos/<owner_id>/…; the bucket is public-read so
-- next/image can fetch without signed URLs. Survey photos stay elsewhere.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('foto-kos', 'foto-kos', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists foto_kos_baca on storage.objects;
create policy foto_kos_baca on storage.objects for select using (bucket_id = 'foto-kos');
drop policy if exists foto_kos_unggah on storage.objects;
create policy foto_kos_unggah on storage.objects for insert to authenticated
  with check (bucket_id = 'foto-kos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists foto_kos_hapus on storage.objects;
create policy foto_kos_hapus on storage.objects for delete to authenticated
  using (bucket_id = 'foto-kos' and (storage.foldername(name))[1] = auth.uid()::text);
