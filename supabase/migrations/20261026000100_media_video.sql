-- Short room-tour video on kos_media (the premium tier's "short video").
--
-- For jenis = 'video' rows, `url` is the MP4 (H.264, faststart, no audio),
-- lebar/tinggi its frame size, blurhash its poster's, and `tur` carries
-- what the player needs before anything downloads:
--   { "poster_url": "…-poster.webp", "durasi_detik": 21, "ukuran_bytes": 1722000 }
-- Search and the cards keep reading jenis = 'foto' only.

alter type jenis_media add value if not exists 'video';

comment on column kos_media.tur is
  'foto360: {titik, preview_url, ukuran_bytes, hotspot[{ke, yaw, pitch, label}]}; video: {poster_url, durasi_detik, ukuran_bytes}';
