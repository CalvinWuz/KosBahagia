import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { formatWaktuRelatif } from "@/lib/format";
import { mitraServer } from "@/lib/supabase/mitra";
import { dasarMitra } from "@/lib/mitra/dasar";
import { AWAL_BULAN, wajibSesi } from "@/lib/mitra/sesi";

export const metadata: Metadata = { title: "Ringkasan" };

const JENIS_LAPORAN: Record<string, string> = { penuh: "Penyewa bilang sudah penuh", harga_beda: "Harga di lapangan beda", tutup: "Kos dilaporkan tutup", lainnya: "Laporan lain" };

// One screen: rooms left, last confirmed, views and WhatsApp clicks this
// month, pending reports. Everything the owner needs to decide what to do.
export default async function Ringkasan() {
  const dasar = await dasarMitra();
  const sesi = await wajibSesi(`${dasar}/dashboard`);
  const db = await mitraServer();
  const ids = sesi.kos.map((k) => k.id);
  const awal = AWAL_BULAN();
  const sekarang = new Date();
  const batasLaporan = new Date(sekarang.getTime() - 30 * 86_400_000).toISOString();
  const [kunjungan, klik, laporan] = ids.length
    ? await Promise.all([
        db.from("kunjungan_kos").select("kos_id").in("kos_id", ids).gte("dibuat_pada", awal),
        db.from("klik_wa").select("kos_id").in("kos_id", ids).gte("dibuat_pada", awal),
        db.from("laporan_user").select("id, kos_id, jenis, catatan, dibuat_pada").in("kos_id", ids).gte("dibuat_pada", batasLaporan).order("dibuat_pada", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];
  const hitung = (rows: Array<{ kos_id: string }> | null, id: string) => (rows ?? []).filter((r) => r.kos_id === id).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 pb-16">
      <div>
        <h1 className="text-h1 text-arang-900">Ringkasan</h1>
        <p className="text-small text-arang-500">Bulan ini, semua kos Bapak/Ibu.</p>
      </div>

      {sesi.kos.length === 0 ? (
        <div className="rounded-2xl border border-arang-500/20 bg-putih p-5">
          <p className="text-body font-bold text-arang-900">Belum ada kos yang tertaut ke akun ini.</p>
          <p className="mt-1 text-small text-arang-500">Setelah survei, tim kami menautkan kos ke nomor WhatsApp Bapak/Ibu. Belum disurvei? Daftarkan dulu.</p>
          <Link href={`${dasar}/daftar`} className={buttonClasses({ variant: "primary", className: "mt-3" })}>Daftarkan kos</Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {sesi.kos.map((k) => {
            const kosong = k.tipe_kamar.reduce((a, t) => a + t.kamar_tersedia, 0);
            const basi = !k.ketersediaan_dikonfirmasi_pada || sekarang.getTime() - new Date(k.ketersediaan_dikonfirmasi_pada).getTime() > 30 * 86_400_000;
            const laporanKos = (laporan.data ?? []).filter((l) => l.kos_id === k.id);
            return (
              <li key={k.id} className="rounded-2xl border border-arang-500/20 bg-putih p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-h2 text-arang-900">{k.nama}</h2>
                    <p className="text-small text-arang-500">
                      {k.status === "tayang" ? "Tayang" : k.status === "draft" ? "Belum tayang" : "Diarsipkan"}, paket {k.tier}
                    </p>
                  </div>
                  {basi ? <Badge tone="bahaya">Perlu dikonfirmasi</Badge> : <Badge tone="baik">Ketersediaan terkonfirmasi</Badge>}
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Angka label="Kamar kosong" nilai={String(kosong)} merah={kosong === 0} />
                  <Angka label="Dikonfirmasi" nilai={k.ketersediaan_dikonfirmasi_pada ? formatWaktuRelatif(k.ketersediaan_dikonfirmasi_pada, sekarang) : "belum"} />
                  <Angka label="Dilihat bulan ini" nilai={String(hitung(kunjungan.data, k.id))} />
                  <Angka label="Chat WhatsApp" nilai={String(hitung(klik.data, k.id))} />
                </dl>

                {laporanKos.length > 0 && (
                  <div className="mt-3 rounded-xl border border-merah-700/30 bg-merah-100 p-3">
                    <p className="text-small font-bold text-merah-700">{laporanKos.length} laporan penyewa menunggu</p>
                    <ul className="mt-1 flex flex-col gap-1 text-small text-arang-900">
                      {laporanKos.slice(0, 3).map((l) => (
                        <li key={l.id}>{JENIS_LAPORAN[l.jenis] ?? l.jenis}, {formatWaktuRelatif(l.dibuat_pada, sekarang)}{l.catatan ? `: ${l.catatan}` : ""}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`${dasar}/dashboard/ketersediaan?kos=${k.id}`} className={buttonClasses({ variant: "primary" })}>Perbarui ketersediaan</Link>
                  <Link href={`${dasar}/dashboard/kos/${k.id}`} className={buttonClasses({ variant: "secondary" })}>Ubah harga dan foto</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Angka({ label, nilai, merah = false }: { label: string; nilai: string; merah?: boolean }) {
  return (
    <div className="rounded-xl bg-kertas-50 p-3">
      <dt className="text-micro text-arang-500">{label}</dt>
      <dd className={`text-h2 tabular-nums ${merah ? "text-merah-700" : "text-arang-900"}`}>{nilai}</dd>
    </div>
  );
}
