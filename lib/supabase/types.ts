export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      area: {
        Row: {
          deskripsi: string | null
          id: string
          lokasi: unknown
          nama: string
          seo_deskripsi: string | null
          seo_judul: string | null
          slug: string
          tipe: Database["public"]["Enums"]["tipe_area"]
        }
        Insert: {
          deskripsi?: string | null
          id?: string
          lokasi: unknown
          nama: string
          seo_deskripsi?: string | null
          seo_judul?: string | null
          slug: string
          tipe: Database["public"]["Enums"]["tipe_area"]
        }
        Update: {
          deskripsi?: string | null
          id?: string
          lokasi?: unknown
          nama?: string
          seo_deskripsi?: string | null
          seo_judul?: string | null
          slug?: string
          tipe?: Database["public"]["Enums"]["tipe_area"]
        }
        Relationships: []
      }
      catatan_surveyor: {
        Row: {
          hal_baik: string[]
          kesan_pemilik: string | null
          kos_id: string
          perlu_diketahui: string[]
          red_flags: string[]
        }
        Insert: {
          hal_baik?: string[]
          kesan_pemilik?: string | null
          kos_id: string
          perlu_diketahui?: string[]
          red_flags?: string[]
        }
        Update: {
          hal_baik?: string[]
          kesan_pemilik?: string | null
          kos_id?: string
          perlu_diketahui?: string[]
          red_flags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "catatan_surveyor_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catatan_surveyor_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catatan_surveyor_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      fasilitas: {
        Row: {
          bisa_difilter: boolean
          id: string
          ikon: string | null
          kategori: Database["public"]["Enums"]["kategori_fasilitas"]
          nama: string
          slug: string
        }
        Insert: {
          bisa_difilter?: boolean
          id?: string
          ikon?: string | null
          kategori: Database["public"]["Enums"]["kategori_fasilitas"]
          nama: string
          slug: string
        }
        Update: {
          bisa_difilter?: boolean
          id?: string
          ikon?: string | null
          kategori?: Database["public"]["Enums"]["kategori_fasilitas"]
          nama?: string
          slug?: string
        }
        Relationships: []
      }
      klik_wa: {
        Row: {
          dibuat_pada: string
          id: number
          kos_id: string
          referrer: string | null
          sumber: Database["public"]["Enums"]["sumber_klik"]
        }
        Insert: {
          dibuat_pada?: string
          id?: never
          kos_id: string
          referrer?: string | null
          sumber: Database["public"]["Enums"]["sumber_klik"]
        }
        Update: {
          dibuat_pada?: string
          id?: never
          kos_id?: string
          referrer?: string | null
          sumber?: Database["public"]["Enums"]["sumber_klik"]
        }
        Relationships: [
          {
            foreignKeyName: "klik_wa_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klik_wa_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "klik_wa_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      kos: {
        Row: {
          ada_lift: boolean
          alamat: string
          area_id: string
          deskripsi: string | null
          dibuat_pada: string
          disurvei_pada: string | null
          diubah_pada: string
          id: string
          jumlah_kamar: number | null
          jumlah_lantai: number | null
          ketersediaan_dikonfirmasi_pada: string | null
          kontak_nama: string
          lokasi: unknown
          nama: string
          owner_id: string | null
          penjaga: Database["public"]["Enums"]["jenis_penjaga"] | null
          rt_rw: string | null
          slug: string
          status: Database["public"]["Enums"]["status_kos"]
          surveyor: string | null
          tahun_bangunan: number | null
          tier: Database["public"]["Enums"]["tier_kos"]
          tipe: Database["public"]["Enums"]["tipe_kos"]
          whatsapp: string
        }
        Insert: {
          ada_lift?: boolean
          alamat: string
          area_id: string
          deskripsi?: string | null
          dibuat_pada?: string
          disurvei_pada?: string | null
          diubah_pada?: string
          id?: string
          jumlah_kamar?: number | null
          jumlah_lantai?: number | null
          ketersediaan_dikonfirmasi_pada?: string | null
          kontak_nama: string
          lokasi: unknown
          nama: string
          owner_id?: string | null
          penjaga?: Database["public"]["Enums"]["jenis_penjaga"] | null
          rt_rw?: string | null
          slug: string
          status?: Database["public"]["Enums"]["status_kos"]
          surveyor?: string | null
          tahun_bangunan?: number | null
          tier?: Database["public"]["Enums"]["tier_kos"]
          tipe: Database["public"]["Enums"]["tipe_kos"]
          whatsapp: string
        }
        Update: {
          ada_lift?: boolean
          alamat?: string
          area_id?: string
          deskripsi?: string | null
          dibuat_pada?: string
          disurvei_pada?: string | null
          diubah_pada?: string
          id?: string
          jumlah_kamar?: number | null
          jumlah_lantai?: number | null
          ketersediaan_dikonfirmasi_pada?: string | null
          kontak_nama?: string
          lokasi?: unknown
          nama?: string
          owner_id?: string | null
          penjaga?: Database["public"]["Enums"]["jenis_penjaga"] | null
          rt_rw?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["status_kos"]
          surveyor?: string | null
          tahun_bangunan?: number | null
          tier?: Database["public"]["Enums"]["tier_kos"]
          tipe?: Database["public"]["Enums"]["tipe_kos"]
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "kos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area_publik"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner"
            referencedColumns: ["id"]
          },
        ]
      }
      kos_aturan: {
        Row: {
          anak: boolean
          hewan: boolean
          jam_malam: string | null
          kos_id: string
          lawan_jenis: Database["public"]["Enums"]["opsi_tamu"]
          masak_di_kamar: boolean
          mayoritas_penghuni: string | null
          merokok: Database["public"]["Enums"]["opsi_merokok"]
          pasangan: Database["public"]["Enums"]["opsi_pasangan"]
          suasana: string | null
          tamu: Database["public"]["Enums"]["opsi_tamu"]
        }
        Insert: {
          anak?: boolean
          hewan?: boolean
          jam_malam?: string | null
          kos_id: string
          lawan_jenis?: Database["public"]["Enums"]["opsi_tamu"]
          masak_di_kamar?: boolean
          mayoritas_penghuni?: string | null
          merokok?: Database["public"]["Enums"]["opsi_merokok"]
          pasangan?: Database["public"]["Enums"]["opsi_pasangan"]
          suasana?: string | null
          tamu?: Database["public"]["Enums"]["opsi_tamu"]
        }
        Update: {
          anak?: boolean
          hewan?: boolean
          jam_malam?: string | null
          kos_id?: string
          lawan_jenis?: Database["public"]["Enums"]["opsi_tamu"]
          masak_di_kamar?: boolean
          mayoritas_penghuni?: string | null
          merokok?: Database["public"]["Enums"]["opsi_merokok"]
          pasangan?: Database["public"]["Enums"]["opsi_pasangan"]
          suasana?: string | null
          tamu?: Database["public"]["Enums"]["opsi_tamu"]
        }
        Relationships: [
          {
            foreignKeyName: "kos_aturan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_aturan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_aturan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      kos_fasilitas: {
        Row: {
          fasilitas_id: string
          kos_id: string
        }
        Insert: {
          fasilitas_id: string
          kos_id: string
        }
        Update: {
          fasilitas_id?: string
          kos_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kos_fasilitas_fasilitas_id_fkey"
            columns: ["fasilitas_id"]
            isOneToOne: false
            referencedRelation: "fasilitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_fasilitas_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_fasilitas_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_fasilitas_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      kos_media: {
        Row: {
          blurhash: string | null
          id: string
          jenis: Database["public"]["Enums"]["jenis_media"]
          keterangan: string | null
          kos_id: string
          lebar: number
          tinggi: number
          tur: Json | null
          url: string
          urutan: number
        }
        Insert: {
          blurhash?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_media"]
          keterangan?: string | null
          kos_id: string
          lebar: number
          tinggi: number
          tur?: Json | null
          url: string
          urutan?: number
        }
        Update: {
          blurhash?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_media"]
          keterangan?: string | null
          kos_id?: string
          lebar?: number
          tinggi?: number
          tur?: Json | null
          url?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "kos_media_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_media_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_media_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      kos_penilaian: {
        Row: {
          db_ambient: number | null
          db_tes: number | null
          frekuensi_bersih: string | null
          frekuensi_sampah: string | null
          hadap_jalan_raya: boolean | null
          kamar_diukur: string | null
          kos_id: string
          material_tembok: string | null
          pembersih: string | null
          skor_dapur: number | null
          skor_kamar_mandi: number | null
          skor_kedap: number | null
          skor_koridor: number | null
          sumber_bising: string[]
        }
        Insert: {
          db_ambient?: number | null
          db_tes?: number | null
          frekuensi_bersih?: string | null
          frekuensi_sampah?: string | null
          hadap_jalan_raya?: boolean | null
          kamar_diukur?: string | null
          kos_id: string
          material_tembok?: string | null
          pembersih?: string | null
          skor_dapur?: number | null
          skor_kamar_mandi?: number | null
          skor_kedap?: number | null
          skor_koridor?: number | null
          sumber_bising?: string[]
        }
        Update: {
          db_ambient?: number | null
          db_tes?: number | null
          frekuensi_bersih?: string | null
          frekuensi_sampah?: string | null
          hadap_jalan_raya?: boolean | null
          kamar_diukur?: string | null
          kos_id?: string
          material_tembok?: string | null
          pembersih?: string | null
          skor_dapur?: number | null
          skor_kamar_mandi?: number | null
          skor_kedap?: number | null
          skor_koridor?: number | null
          sumber_bising?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "kos_penilaian_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_penilaian_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_penilaian_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      kos_sekitar: {
        Row: {
          akses: Database["public"]["Enums"]["akses_jalan"]
          kos_id: string
          landmark_jarak_m: number
          landmark_menit_jalan: number | null
          landmark_nama: string
          laundry: Json | null
          minimarket: Json | null
          penerangan: number | null
          rawan_banjir: boolean | null
          rute: Json
          transit: Json | null
          warung: Json | null
        }
        Insert: {
          akses?: Database["public"]["Enums"]["akses_jalan"]
          kos_id: string
          landmark_jarak_m: number
          landmark_menit_jalan?: number | null
          landmark_nama: string
          laundry?: Json | null
          minimarket?: Json | null
          penerangan?: number | null
          rawan_banjir?: boolean | null
          rute?: Json
          transit?: Json | null
          warung?: Json | null
        }
        Update: {
          akses?: Database["public"]["Enums"]["akses_jalan"]
          kos_id?: string
          landmark_jarak_m?: number
          landmark_menit_jalan?: number | null
          landmark_nama?: string
          laundry?: Json | null
          minimarket?: Json | null
          penerangan?: number | null
          rawan_banjir?: boolean | null
          rute?: Json
          transit?: Json | null
          warung?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kos_sekitar_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_sekitar_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kos_sekitar_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: true
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      kunjungan_kos: {
        Row: {
          dibuat_pada: string
          id: number
          kos_id: string
        }
        Insert: {
          dibuat_pada?: string
          id?: never
          kos_id: string
        }
        Update: {
          dibuat_pada?: string
          id?: never
          kos_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kunjungan_kos_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kunjungan_kos_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kunjungan_kos_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      laporan_user: {
        Row: {
          catatan: string | null
          dibuat_pada: string
          id: number
          jenis: Database["public"]["Enums"]["jenis_laporan"]
          kos_id: string
        }
        Insert: {
          catatan?: string | null
          dibuat_pada?: string
          id?: never
          jenis: Database["public"]["Enums"]["jenis_laporan"]
          kos_id: string
        }
        Update: {
          catatan?: string | null
          dibuat_pada?: string
          id?: never
          jenis?: Database["public"]["Enums"]["jenis_laporan"]
          kos_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "laporan_user_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_user_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laporan_user_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
      log_ketersediaan: {
        Row: {
          dibuat_pada: string
          id: number
          kamar_tersedia: number
          kos_id: string
          sumber: Database["public"]["Enums"]["sumber_ketersediaan"]
          tipe_kamar_id: string | null
        }
        Insert: {
          dibuat_pada?: string
          id?: never
          kamar_tersedia: number
          kos_id: string
          sumber: Database["public"]["Enums"]["sumber_ketersediaan"]
          tipe_kamar_id?: string | null
        }
        Update: {
          dibuat_pada?: string
          id?: never
          kamar_tersedia?: number
          kos_id?: string
          sumber?: Database["public"]["Enums"]["sumber_ketersediaan"]
          tipe_kamar_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_ketersediaan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_ketersediaan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_ketersediaan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
          {
            foreignKeyName: "log_ketersediaan_tipe_kamar_id_fkey"
            columns: ["tipe_kamar_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["kamar_id"]
          },
          {
            foreignKeyName: "log_ketersediaan_tipe_kamar_id_fkey"
            columns: ["tipe_kamar_id"]
            isOneToOne: false
            referencedRelation: "tipe_kamar"
            referencedColumns: ["id"]
          },
        ]
      }
      owner: {
        Row: {
          id: string
          nama: string
          terverifikasi_pada: string | null
          whatsapp: string
        }
        Insert: {
          id: string
          nama: string
          terverifikasi_pada?: string | null
          whatsapp: string
        }
        Update: {
          id?: string
          nama?: string
          terverifikasi_pada?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      pendaftaran_mitra: {
        Row: {
          alamat: string
          dibuat_pada: string
          id: string
          jumlah_kamar: number
          nama: string
          nama_kos: string
          status: string
          whatsapp: string
        }
        Insert: {
          alamat: string
          dibuat_pada?: string
          id?: string
          jumlah_kamar: number
          nama: string
          nama_kos: string
          status?: string
          whatsapp: string
        }
        Update: {
          alamat?: string
          dibuat_pada?: string
          id?: string
          jumlah_kamar?: number
          nama?: string
          nama_kos?: string
          status?: string
          whatsapp?: string
        }
        Relationships: []
      }
      pengingat_wa: {
        Row: {
          dikirim_pada: string
          id: number
          kos_id: string
          owner_id: string | null
          pesan: string
          status: string
          whatsapp: string
        }
        Insert: {
          dikirim_pada?: string
          id?: never
          kos_id: string
          owner_id?: string | null
          pesan: string
          status?: string
          whatsapp: string
        }
        Update: {
          dikirim_pada?: string
          id?: never
          kos_id?: string
          owner_id?: string | null
          pesan?: string
          status?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengingat_wa_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengingat_wa_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengingat_wa_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
          {
            foreignKeyName: "pengingat_wa_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner"
            referencedColumns: ["id"]
          },
        ]
      }
      permintaan_koreksi: {
        Row: {
          bidang: string
          dibuat_pada: string
          id: string
          kos_id: string
          owner_id: string
          pesan: string
          status: string
        }
        Insert: {
          bidang: string
          dibuat_pada?: string
          id?: string
          kos_id: string
          owner_id: string
          pesan: string
          status?: string
        }
        Update: {
          bidang?: string
          dibuat_pada?: string
          id?: string
          kos_id?: string
          owner_id?: string
          pesan?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "permintaan_koreksi_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permintaan_koreksi_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permintaan_koreksi_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
          {
            foreignKeyName: "permintaan_koreksi_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner"
            referencedColumns: ["id"]
          },
        ]
      }
      tautan_ketersediaan: {
        Row: {
          dibuat_pada: string
          dipakai_pada: string | null
          id: string
          kadaluarsa: string
          kos_id: string
          owner_id: string | null
          token_hash: string
        }
        Insert: {
          dibuat_pada?: string
          dipakai_pada?: string | null
          id?: string
          kadaluarsa: string
          kos_id: string
          owner_id?: string | null
          token_hash: string
        }
        Update: {
          dibuat_pada?: string
          dipakai_pada?: string | null
          id?: string
          kadaluarsa?: string
          kos_id?: string
          owner_id?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "tautan_ketersediaan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tautan_ketersediaan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tautan_ketersediaan_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
          {
            foreignKeyName: "tautan_ketersediaan_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner"
            referencedColumns: ["id"]
          },
        ]
      }
      tipe_kamar: {
        Row: {
          bayar_dimuka_bulan: number | null
          biaya_ac: number | null
          biaya_air: number | null
          biaya_lain: Json
          biaya_laundry: number | null
          biaya_parkir_mobil: number | null
          biaya_parkir_motor: number | null
          biaya_sekali: Json
          boleh_ac: boolean
          deposit: number
          deposit_kembali:
            | Database["public"]["Enums"]["opsi_deposit_kembali"]
            | null
          durasi_minimal: number
          estimasi_listrik: number | null
          harga_bulanan: number
          harga_dikonfirmasi_pada: string | null
          harga_tahunan: number | null
          id: string
          kamar_mandi_dalam: boolean | null
          kamar_tersedia: number
          ketentuan_deposit: string | null
          kos_id: string
          laundry: Database["public"]["Enums"]["opsi_laundry"]
          model_listrik: Database["public"]["Enums"]["model_listrik"]
          nama: string
          parkir_mobil: boolean
          parkir_motor: boolean
          total_bulanan: number | null
          total_estimasi: boolean | null
          total_kamar: number
          total_lengkap: boolean | null
          ukuran: string | null
        }
        Insert: {
          bayar_dimuka_bulan?: number | null
          biaya_ac?: number | null
          biaya_air?: number | null
          biaya_lain?: Json
          biaya_laundry?: number | null
          biaya_parkir_mobil?: number | null
          biaya_parkir_motor?: number | null
          biaya_sekali?: Json
          boleh_ac?: boolean
          deposit?: number
          deposit_kembali?:
            | Database["public"]["Enums"]["opsi_deposit_kembali"]
            | null
          durasi_minimal?: number
          estimasi_listrik?: number | null
          harga_bulanan: number
          harga_dikonfirmasi_pada?: string | null
          harga_tahunan?: number | null
          id?: string
          kamar_mandi_dalam?: boolean | null
          kamar_tersedia?: number
          ketentuan_deposit?: string | null
          kos_id: string
          laundry?: Database["public"]["Enums"]["opsi_laundry"]
          model_listrik: Database["public"]["Enums"]["model_listrik"]
          nama: string
          parkir_mobil?: boolean
          parkir_motor?: boolean
          total_bulanan?: number | null
          total_estimasi?: boolean | null
          total_kamar?: number
          total_lengkap?: boolean | null
          ukuran?: string | null
        }
        Update: {
          bayar_dimuka_bulan?: number | null
          biaya_ac?: number | null
          biaya_air?: number | null
          biaya_lain?: Json
          biaya_laundry?: number | null
          biaya_parkir_mobil?: number | null
          biaya_parkir_motor?: number | null
          biaya_sekali?: Json
          boleh_ac?: boolean
          deposit?: number
          deposit_kembali?:
            | Database["public"]["Enums"]["opsi_deposit_kembali"]
            | null
          durasi_minimal?: number
          estimasi_listrik?: number | null
          harga_bulanan?: number
          harga_dikonfirmasi_pada?: string | null
          harga_tahunan?: number | null
          id?: string
          kamar_mandi_dalam?: boolean | null
          kamar_tersedia?: number
          ketentuan_deposit?: string | null
          kos_id?: string
          laundry?: Database["public"]["Enums"]["opsi_laundry"]
          model_listrik?: Database["public"]["Enums"]["model_listrik"]
          nama?: string
          parkir_mobil?: boolean
          parkir_motor?: boolean
          total_bulanan?: number | null
          total_estimasi?: boolean | null
          total_kamar?: number
          total_lengkap?: boolean | null
          ukuran?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipe_kamar_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipe_kamar_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_kartu"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipe_kamar_kos_id_fkey"
            columns: ["kos_id"]
            isOneToOne: false
            referencedRelation: "kos_skor"
            referencedColumns: ["kos_id"]
          },
        ]
      }
    }
    Views: {
      area_publik: {
        Row: {
          deskripsi: string | null
          id: string | null
          lat: number | null
          lng: number | null
          nama: string | null
          seo_deskripsi: string | null
          seo_judul: string | null
          slug: string | null
          tipe: Database["public"]["Enums"]["tipe_area"] | null
        }
        Insert: {
          deskripsi?: string | null
          id?: string | null
          lat?: never
          lng?: never
          nama?: string | null
          seo_deskripsi?: string | null
          seo_judul?: string | null
          slug?: string | null
          tipe?: Database["public"]["Enums"]["tipe_area"] | null
        }
        Update: {
          deskripsi?: string | null
          id?: string | null
          lat?: never
          lng?: never
          nama?: string | null
          seo_deskripsi?: string | null
          seo_judul?: string | null
          slug?: string | null
          tipe?: Database["public"]["Enums"]["tipe_area"] | null
        }
        Relationships: []
      }
      kos_kartu: {
        Row: {
          ada_360: boolean | null
          area_nama: string | null
          area_slug: string | null
          disurvei_pada: string | null
          foto_blurhash: string | null
          foto_lebar: number | null
          foto_tinggi: number | null
          foto_url: string | null
          harga_bulanan: number | null
          id: string | null
          jumlah_red_flags: number | null
          jumlah_tipe_kamar: number | null
          kamar: Json | null
          kamar_acuan_tersedia: number | null
          kamar_acuan_total: number | null
          kamar_id: string | null
          kamar_nama: string | null
          kamar_tersedia: number | null
          ketersediaan_dikonfirmasi_pada: string | null
          landmark_menit_jalan: number | null
          landmark_nama: string | null
          lat: number | null
          lng: number | null
          nama: string | null
          perlu_dikonfirmasi: boolean | null
          rincian: Json | null
          skor: number | null
          skor_kebersihan: number | null
          skor_kedap: number | null
          slug: string | null
          status: Database["public"]["Enums"]["status_kos"] | null
          tier: Database["public"]["Enums"]["tier_kos"] | null
          tipe: Database["public"]["Enums"]["tipe_kos"] | null
          total_bulanan: number | null
          total_estimasi: boolean | null
          total_lengkap: boolean | null
        }
        Relationships: []
      }
      kos_skor: {
        Row: {
          fasilitas: number | null
          kebersihan: number | null
          kedap: number | null
          kos_id: string | null
          n_fasilitas: number | null
          porsi_biaya_tambahan: number | null
          sekitar: number | null
          skor: number | null
          transparansi: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      area_radius_m: {
        Args: { p_tipe: Database["public"]["Enums"]["tipe_area"] }
        Returns: number
      }
      area_tetangga: {
        Args: { p_limit?: number; p_slug: string }
        Returns: {
          jarak_m: number
          jumlah_kos: number
          nama: string
          slug: string
          tipe: Database["public"]["Enums"]["tipe_area"]
        }[]
      }
      baca_ketersediaan_via_tautan: {
        Args: { p_token: string }
        Returns: {
          dikonfirmasi_pada: string
          kamar_tersedia: number
          kos_id: string
          kos_nama: string
          nama: string
          tipe_kamar_id: string
          total_kamar: number
        }[]
      }
      biaya_lain_lengkap: { Args: { biaya: Json }; Returns: boolean }
      biaya_lain_wajib: { Args: { biaya: Json }; Returns: number }
      buat_tautan_ketersediaan: { Args: { p_kos_id: string }; Returns: string }
      cari_kos: {
        Args: {
          p_aturan?: Json
          p_fasilitas?: string[]
          p_harga_max?: number
          p_harga_min?: number
          p_lat: number
          p_limit?: number
          p_lng: number
          p_min_kebersihan?: number
          p_min_kedap?: number
          p_offset?: number
          p_q?: string
          p_radius_m?: number
          p_tipe?: Database["public"]["Enums"]["tipe_kos"]
          p_urut?: string
        }
        Returns: {
          ada_360: boolean
          foto_blurhash: string
          foto_lebar: number
          foto_tinggi: number
          foto_url: string
          harga_bulanan: number
          id: string
          jarak_m: number
          jumlah_red_flags: number
          kamar_tersedia: number
          ketersediaan_dikonfirmasi_pada: string
          landmark_menit_jalan: number
          landmark_nama: string
          lat: number
          lng: number
          nama: string
          perlu_dikonfirmasi: boolean
          rincian: Json
          skor: number
          skor_kebersihan: number
          skor_kedap: number
          slug: string
          tier: Database["public"]["Enums"]["tier_kos"]
          tipe: Database["public"]["Enums"]["tipe_kos"]
          total_bulanan: number
          total_count: number
        }[]
      }
      cari_kos_v3: {
        Args: {
          p_aturan?: Json
          p_fasilitas?: string[]
          p_harga_max?: number
          p_harga_min?: number
          p_lat: number
          p_limit?: number
          p_lng: number
          p_min_kebersihan?: number
          p_min_kedap?: number
          p_offset?: number
          p_q?: string
          p_radius_m?: number
          p_tipe?: Database["public"]["Enums"]["tipe_kos"]
          p_urut?: string
        }
        Returns: {
          ada_360: boolean
          foto_blurhash: string
          foto_lebar: number
          foto_tinggi: number
          foto_url: string
          harga_bulanan: number
          id: string
          jarak_m: number
          jumlah_red_flags: number
          jumlah_tipe_kamar: number
          kamar: Json
          kamar_acuan_tersedia: number
          kamar_acuan_total: number
          kamar_id: string
          kamar_nama: string
          kamar_tersedia: number
          ketersediaan_dikonfirmasi_pada: string
          landmark_menit_jalan: number
          landmark_nama: string
          lat: number
          lng: number
          nama: string
          perlu_dikonfirmasi: boolean
          skor: number
          skor_kebersihan: number
          skor_kedap: number
          slug: string
          tier: Database["public"]["Enums"]["tier_kos"]
          tipe: Database["public"]["Enums"]["tipe_kos"]
          total_bulanan: number
          total_count: number
          total_estimasi: boolean
          total_lengkap: boolean
        }[]
      }
      cari_saran: {
        Args: { p_limit?: number; q: string }
        Returns: {
          jenis: string
          keterangan: string
          nama: string
          slug: string
        }[]
      }
      konfirmasi_ketersediaan: {
        Args: { p_kos_id: string }
        Returns: undefined
      }
      kos_cocok: {
        Args: {
          p_aturan?: Json
          p_fasilitas?: string[]
          p_harga_max?: number
          p_harga_min?: number
          p_lat: number
          p_lng: number
          p_min_kebersihan?: number
          p_min_kedap?: number
          p_q?: string
          p_radius_m?: number
          p_tipe?: Database["public"]["Enums"]["tipe_kos"]
        }
        Returns: {
          ada_360: boolean
          foto_blurhash: string
          foto_lebar: number
          foto_tinggi: number
          foto_url: string
          harga_bulanan: number
          id: string
          jarak_m: number
          jumlah_red_flags: number
          jumlah_tipe_kamar: number
          kamar: Json
          kamar_acuan_tersedia: number
          kamar_acuan_total: number
          kamar_id: string
          kamar_nama: string
          kamar_tersedia: number
          ketersediaan_dikonfirmasi_pada: string
          landmark_menit_jalan: number
          landmark_nama: string
          lat: number
          lng: number
          nama: string
          perlu_dikonfirmasi: boolean
          skor: number
          skor_kebersihan: number
          skor_kedap: number
          slug: string
          tier: Database["public"]["Enums"]["tier_kos"]
          tipe: Database["public"]["Enums"]["tipe_kos"]
          total_bulanan: number
          total_estimasi: boolean
          total_lengkap: boolean
        }[]
      }
      kos_promosi: {
        Args: {
          p_aturan?: Json
          p_fasilitas?: string[]
          p_harga_max?: number
          p_harga_min?: number
          p_lat: number
          p_limit?: number
          p_lng: number
          p_min_kebersihan?: number
          p_min_kedap?: number
          p_q?: string
          p_radius_m?: number
          p_tipe?: Database["public"]["Enums"]["tipe_kos"]
        }
        Returns: {
          ada_360: boolean
          foto_blurhash: string
          foto_lebar: number
          foto_tinggi: number
          foto_url: string
          harga_bulanan: number
          id: string
          jarak_m: number
          jumlah_red_flags: number
          jumlah_tipe_kamar: number
          kamar: Json
          kamar_acuan_tersedia: number
          kamar_acuan_total: number
          kamar_id: string
          kamar_nama: string
          kamar_tersedia: number
          ketersediaan_dikonfirmasi_pada: string
          landmark_menit_jalan: number
          landmark_nama: string
          lat: number
          lng: number
          nama: string
          perlu_dikonfirmasi: boolean
          skor: number
          skor_kebersihan: number
          skor_kedap: number
          slug: string
          tier: Database["public"]["Enums"]["tier_kos"]
          tipe: Database["public"]["Enums"]["tipe_kos"]
          total_bulanan: number
          total_estimasi: boolean
          total_lengkap: boolean
        }[]
      }
      kos_tayang: { Args: { p_kos_id: string }; Returns: boolean }
      median_area_bulan_ini: {
        Args: { p_kos_id: string }
        Returns: {
          median_klik: number
          median_kunjungan: number
        }[]
      }
      perbarui_ketersediaan_via_tautan: {
        Args: { p_perubahan: Json; p_token: string }
        Returns: number
      }
      posisi_di_area: { Args: { p_kos_id: string }; Returns: number }
      punya_kos: { Args: { p_kos_id: string }; Returns: boolean }
      statistik_area: {
        Args: { p_slug: string }
        Returns: {
          jumlah_campur: number
          jumlah_kos: number
          jumlah_putra: number
          jumlah_putri: number
          jumlah_tanpa_jam_malam: number
          max_total: number
          median_total: number
          min_total: number
          model_listrik_umum: string
          persen_km_dalam: number
          rata_harga_makan: number
        }[]
      }
    }
    Enums: {
      akses_jalan: "motor" | "mobil" | "jalan_kaki"
      jenis_laporan: "penuh" | "harga_beda" | "tutup" | "lainnya"
      jenis_media: "foto" | "foto360" | "patokan"
      jenis_penjaga: "pemilik" | "harian" | "tidak_tetap" | "tidak_ada"
      kategori_fasilitas: "kamar" | "bersama"
      model_listrik: "termasuk" | "token" | "flat" | "meteran"
      opsi_deposit_kembali: "ya" | "tidak" | "sebagian"
      opsi_laundry: "termasuk" | "tidak_ada" | "berbayar"
      opsi_merokok: "kamar" | "luar" | "dilarang"
      opsi_pasangan: "boleh" | "tidak" | "surat_nikah"
      opsi_tamu: "boleh" | "ruang_tamu" | "tidak"
      status_kos: "draft" | "tayang" | "arsip"
      sumber_ketersediaan: "survei" | "pemilik" | "bot_wa" | "laporan_user"
      sumber_klik: "detail" | "kartu" | "banding"
      tier_kos: "free" | "premium" | "spotlight"
      tipe_area: "kecamatan" | "kampus" | "stasiun"
      tipe_kos: "putra" | "putri" | "campur"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      akses_jalan: ["motor", "mobil", "jalan_kaki"],
      jenis_laporan: ["penuh", "harga_beda", "tutup", "lainnya"],
      jenis_media: ["foto", "foto360", "patokan"],
      jenis_penjaga: ["pemilik", "harian", "tidak_tetap", "tidak_ada"],
      kategori_fasilitas: ["kamar", "bersama"],
      model_listrik: ["termasuk", "token", "flat", "meteran"],
      opsi_deposit_kembali: ["ya", "tidak", "sebagian"],
      opsi_laundry: ["termasuk", "tidak_ada", "berbayar"],
      opsi_merokok: ["kamar", "luar", "dilarang"],
      opsi_pasangan: ["boleh", "tidak", "surat_nikah"],
      opsi_tamu: ["boleh", "ruang_tamu", "tidak"],
      status_kos: ["draft", "tayang", "arsip"],
      sumber_ketersediaan: ["survei", "pemilik", "bot_wa", "laporan_user"],
      sumber_klik: ["detail", "kartu", "banding"],
      tier_kos: ["free", "premium", "spotlight"],
      tipe_area: ["kecamatan", "kampus", "stasiun"],
      tipe_kos: ["putra", "putri", "campur"],
    },
  },
} as const

