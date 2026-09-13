-- Task 06 · 360° tour metadata on kos_media.
--
-- For jenis = 'foto360' rows, `url` is the full (6144 px) equirectangular
-- JPEG and `tur` carries what the viewer needs:
--   {
--     "titik": "kamar",                       -- short point name
--     "preview_url": "…-2048.jpg",             -- served first, swapped for url
--     "ukuran_bytes": 4200000,                 -- shown on the trigger
--     "hotspot": [{ "ke": "<kos_media.id>", "yaw": 90, "pitch": 0, "label": "Ke koridor" }]
--   }
-- kos_sekitar.rute is documented in prompts/06 and parsed by lib/kos/rute.ts.

alter table kos_media add column if not exists tur jsonb;

comment on column kos_media.tur is
  'foto360 only: {titik, preview_url, ukuran_bytes, hotspot[{ke, yaw, pitch, label}]}';
