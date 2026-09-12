-- Task 02 · extensions and enum types.
-- Enums mirror the field-survey rubric one-to-one so survey sheets can be
-- entered without reshaping. Wrapped so the migration re-runs cleanly.

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;

do $$ begin
  create type tipe_area as enum ('kecamatan', 'kampus', 'stasiun');
  create type tipe_kos as enum ('putra', 'putri', 'campur');
  create type jenis_penjaga as enum ('pemilik', 'harian', 'tidak_tetap', 'tidak_ada');
  create type status_kos as enum ('draft', 'tayang', 'arsip');
  create type tier_kos as enum ('free', 'premium', 'spotlight');
  create type opsi_deposit_kembali as enum ('ya', 'tidak', 'sebagian');
  create type model_listrik as enum ('termasuk', 'token', 'flat', 'meteran');
  create type opsi_laundry as enum ('termasuk', 'tidak_ada', 'berbayar');
  create type kategori_fasilitas as enum ('kamar', 'bersama');
  create type opsi_tamu as enum ('boleh', 'ruang_tamu', 'tidak');
  create type opsi_pasangan as enum ('boleh', 'tidak', 'surat_nikah');
  create type opsi_merokok as enum ('kamar', 'luar', 'dilarang');
  create type akses_jalan as enum ('motor', 'mobil', 'jalan_kaki');
  create type jenis_media as enum ('foto', 'foto360', 'patokan');
  create type sumber_ketersediaan as enum ('survei', 'pemilik', 'bot_wa', 'laporan_user');
  create type jenis_laporan as enum ('penuh', 'harga_beda', 'tutup', 'lainnya');
  create type sumber_klik as enum ('detail', 'kartu', 'banding');
exception
  when duplicate_object then null;
end $$;
