-- Task 02 · row level security.
-- Public (anon) reads everything about a kos that is tayang. Owners write
-- their own commercial data. Survey data (kos_penilaian, kos_sekitar,
-- catatan_surveyor) is service-role only: no policy = no access.
-- klik_wa and laporan_user are insert-only for everyone, readable by nobody
-- but the service role.

alter table area              enable row level security;
alter table owner             enable row level security;
alter table kos               enable row level security;
alter table tipe_kamar        enable row level security;
alter table kos_penilaian     enable row level security;
alter table fasilitas         enable row level security;
alter table kos_fasilitas     enable row level security;
alter table kos_aturan        enable row level security;
alter table kos_sekitar       enable row level security;
alter table kos_media         enable row level security;
alter table catatan_surveyor  enable row level security;
alter table log_ketersediaan  enable row level security;
alter table laporan_user      enable row level security;
alter table klik_wa           enable row level security;

-- Helper: is the current user the owner of this kos?
create or replace function punya_kos(p_kos_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from kos where id = p_kos_id and owner_id = auth.uid()
  );
$$;

-- Helper: is this kos visible to the public?
create or replace function kos_tayang(p_kos_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from kos where id = p_kos_id and status = 'tayang'
  );
$$;

-- ---------------------------------------------------------------- reference data
drop policy if exists area_baca_publik on area;
create policy area_baca_publik on area for select using (true);

drop policy if exists fasilitas_baca_publik on fasilitas;
create policy fasilitas_baca_publik on fasilitas for select using (true);

-- ---------------------------------------------------------------- owner
drop policy if exists owner_baca_sendiri on owner;
create policy owner_baca_sendiri on owner for select to authenticated
  using (id = auth.uid());
drop policy if exists owner_buat_sendiri on owner;
create policy owner_buat_sendiri on owner for insert to authenticated
  with check (id = auth.uid());
drop policy if exists owner_ubah_sendiri on owner;
create policy owner_ubah_sendiri on owner for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------- kos
drop policy if exists kos_baca_publik on kos;
create policy kos_baca_publik on kos for select
  using (status = 'tayang' or owner_id = auth.uid());
drop policy if exists kos_buat_pemilik on kos;
create policy kos_buat_pemilik on kos for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists kos_ubah_pemilik on kos;
create policy kos_ubah_pemilik on kos for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists kos_hapus_pemilik on kos;
create policy kos_hapus_pemilik on kos for delete to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------- owner-editable children
-- tipe_kamar, kos_fasilitas, kos_aturan, kos_media: public read when the
-- kos is tayang; full write for the owner.
drop policy if exists tipe_kamar_baca on tipe_kamar;
create policy tipe_kamar_baca on tipe_kamar for select
  using (kos_tayang(kos_id) or punya_kos(kos_id));
drop policy if exists tipe_kamar_tulis on tipe_kamar;
create policy tipe_kamar_tulis on tipe_kamar for all to authenticated
  using (punya_kos(kos_id)) with check (punya_kos(kos_id));

drop policy if exists kos_fasilitas_baca on kos_fasilitas;
create policy kos_fasilitas_baca on kos_fasilitas for select
  using (kos_tayang(kos_id) or punya_kos(kos_id));
drop policy if exists kos_fasilitas_tulis on kos_fasilitas;
create policy kos_fasilitas_tulis on kos_fasilitas for all to authenticated
  using (punya_kos(kos_id)) with check (punya_kos(kos_id));

drop policy if exists kos_aturan_baca on kos_aturan;
create policy kos_aturan_baca on kos_aturan for select
  using (kos_tayang(kos_id) or punya_kos(kos_id));
drop policy if exists kos_aturan_tulis on kos_aturan;
create policy kos_aturan_tulis on kos_aturan for all to authenticated
  using (punya_kos(kos_id)) with check (punya_kos(kos_id));

drop policy if exists kos_media_baca on kos_media;
create policy kos_media_baca on kos_media for select
  using (kos_tayang(kos_id) or punya_kos(kos_id));
drop policy if exists kos_media_tulis on kos_media;
create policy kos_media_tulis on kos_media for all to authenticated
  using (punya_kos(kos_id)) with check (punya_kos(kos_id));

-- ---------------------------------------------------------------- survey data
-- Read-only for everyone (owner included); written only by the service role.
drop policy if exists kos_penilaian_baca on kos_penilaian;
create policy kos_penilaian_baca on kos_penilaian for select
  using (kos_tayang(kos_id) or punya_kos(kos_id));

drop policy if exists kos_sekitar_baca on kos_sekitar;
create policy kos_sekitar_baca on kos_sekitar for select
  using (kos_tayang(kos_id) or punya_kos(kos_id));

drop policy if exists catatan_surveyor_baca on catatan_surveyor;
create policy catatan_surveyor_baca on catatan_surveyor for select
  using (kos_tayang(kos_id) or punya_kos(kos_id));

-- ---------------------------------------------------------------- logs
-- Availability history: owner may read their own; writes happen through the
-- catat_ketersediaan trigger (security definer) or the service role.
drop policy if exists log_ketersediaan_baca_pemilik on log_ketersediaan;
create policy log_ketersediaan_baca_pemilik on log_ketersediaan for select to authenticated
  using (punya_kos(kos_id));

-- Insert-only for anonymous and signed-in users. Nobody reads these back
-- except the service role.
drop policy if exists klik_wa_catat on klik_wa;
create policy klik_wa_catat on klik_wa for insert to anon, authenticated
  with check (kos_tayang(kos_id));

drop policy if exists laporan_user_catat on laporan_user;
create policy laporan_user_catat on laporan_user for insert to anon, authenticated
  with check (kos_tayang(kos_id));

-- Owners can see the lead count for their own kos (the thing we sell them).
drop policy if exists klik_wa_baca_pemilik on klik_wa;
create policy klik_wa_baca_pemilik on klik_wa for select to authenticated
  using (punya_kos(kos_id));

-- ---------------------------------------------------------------- grants
-- Supabase's default privileges hand every new table to anon/authenticated.
-- Start from zero and grant exactly what each role needs; RLS then narrows
-- rows within those grants.
revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on area, fasilitas, kos, tipe_kamar, kos_fasilitas, kos_aturan, kos_media,
  kos_penilaian, kos_sekitar, catatan_surveyor, kos_skor to anon, authenticated;
grant insert on klik_wa, laporan_user to anon, authenticated;
grant insert, update, delete on kos, tipe_kamar, kos_fasilitas, kos_aturan, kos_media to authenticated;
grant select, insert, update on owner to authenticated;
grant select on log_ketersediaan, klik_wa to authenticated;
