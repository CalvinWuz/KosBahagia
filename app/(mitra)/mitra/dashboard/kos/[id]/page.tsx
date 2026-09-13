import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorKos, FormKoreksi } from "@/components/mitra/EditorKos";
import { mitraServer } from "@/lib/supabase/mitra";
import { dasarMitra } from "@/lib/mitra/dasar";
import { wajibSesi } from "@/lib/mitra/sesi";
import type { DataEditKos } from "@/lib/mitra/aksi";

export const metadata: Metadata = { title: "Ubah kos" };

function tanggal(iso: string | null) {
  return iso ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "";
}

// Owners edit what is theirs: description, prices, rules, photos. Everything
// we measured is read-only here and goes through a correction request.
export default async function UbahKos({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, dasar] = await Promise.all([params, dasarMitra()]);
  const sesi = await wajibSesi(`${dasar}/dashboard/kos/${id}`);
  const kos = sesi.kos.find((k) => k.id === id);
  if (!kos) notFound();

  const db = await mitraServer();
  const [aturan, foto, penilaian, catatan, koreksi] = await Promise.all([
    db.from("kos_aturan").select("*").eq("kos_id", id).maybeSingle(),
    db.from("kos_media").select("id, url, keterangan").eq("kos_id", id).eq("jenis", "foto").order("urutan"),
    db.from("kos_penilaian").select("*").eq("kos_id", id).maybeSingle(),
    db.from("catatan_surveyor").select("*").eq("kos_id", id).maybeSingle(),
    db.from("permintaan_koreksi").select("bidang, pesan, status, dibuat_pada").eq("kos_id", id).order("dibuat_pada", { ascending: false }).limit(5),
  ]);

  const awal: DataEditKos = {
    deskripsi: kos.deskripsi ?? "",
    kamar: kos.tipe_kamar.map((t) => ({ id: t.id, harga_bulanan: t.harga_bulanan, deposit: t.deposit, harga_tahunan: t.harga_tahunan })),
    aturan: {
      jam_malam: aturan.data?.jam_malam ? aturan.data.jam_malam.slice(0, 5) : null,
      tamu: aturan.data?.tamu ?? "ruang_tamu",
      lawan_jenis: aturan.data?.lawan_jenis ?? "tidak",
      pasangan: aturan.data?.pasangan ?? "tidak",
      anak: aturan.data?.anak ?? false,
      hewan: aturan.data?.hewan ?? false,
      masak_di_kamar: aturan.data?.masak_di_kamar ?? false,
      merokok: aturan.data?.merokok ?? "luar",
    },
  };
  const p = penilaian.data;
  const survei: Array<[string, string]> = [
    ["Kebersihan kamar mandi", p?.skor_kamar_mandi != null ? `${p.skor_kamar_mandi}/5` : "belum dicatat"],
    ["Kebersihan dapur", p?.skor_dapur != null ? `${p.skor_dapur}/5` : "belum dicatat"],
    ["Kebersihan koridor", p?.skor_koridor != null ? `${p.skor_koridor}/5` : "belum dicatat"],
    ["Kedap suara", p?.skor_kedap != null ? `${p.skor_kedap}/5` : "belum dicatat"],
    ["Desibel sunyi / saat tes", p?.db_ambient != null && p.db_tes != null ? `${p.db_ambient} dB / ${p.db_tes} dB` : "belum dicatat"],
    ["Material tembok", p?.material_tembok ?? "belum dicatat"],
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-6 pb-16">
      <div>
        <h1 className="text-h1 text-arang-900">{kos.nama}</h1>
        <p className="text-small text-arang-500">Paket {kos.tier}. Paket diatur tim kami, bukan dari halaman ini.</p>
      </div>

      <EditorKos
        kosId={id}
        ownerId={sesi.user.id}
        awal={awal}
        kamar={kos.tipe_kamar.map((t) => ({ id: t.id, nama: t.nama, harga_bulanan: t.harga_bulanan, deposit: t.deposit, harga_tahunan: t.harga_tahunan, total_bulanan: t.total_bulanan }))}
        foto={foto.data ?? []}
      />

      <section className="rounded-2xl border border-arang-500/20 bg-kertas-50 p-4" aria-labelledby="survei">
        <h2 id="survei" className="text-h2 text-arang-900">Hasil survei (hanya bisa dibaca)</h2>
        <p className="mt-1 text-small text-arang-500">
          Diukur tim Kos Bahagia saat kunjungan{kos.disurvei_pada ? ` ${tanggal(kos.disurvei_pada)}` : ""}{kos.surveyor ? ` oleh ${kos.surveyor}` : ""}. Angka ini yang membuat penyewa percaya, jadi tidak bisa diubah dari dashboard. Kalau kondisinya sudah berubah, ajukan koreksi dan tim kami datang lagi.
        </p>
        <dl className="mt-3 divide-y divide-arang-500/10 rounded-xl border border-arang-500/10 bg-putih px-3">
          {survei.map(([l, v]) => (
            <div key={l} className="flex justify-between gap-3 py-2 text-small">
              <dt className="text-arang-500">{l}</dt>
              <dd className="text-arang-900">{v}</dd>
            </div>
          ))}
        </dl>
        {catatan.data && (
          <div className="mt-3 rounded-xl border border-arang-500/10 bg-putih p-3 text-small">
            <p className="font-bold text-arang-900">Catatan surveyor</p>
            <ul className="mt-1 list-disc pl-5 text-arang-900">
              {catatan.data.hal_baik.map((h) => <li key={h}>{h}</li>)}
              {catatan.data.perlu_diketahui.map((h) => <li key={h}>{h}</li>)}
            </ul>
            {catatan.data.red_flags.length > 0 && (
              <>
                <p className="mt-2 font-bold text-merah-700">Catatan keselamatan (tampil ke penyewa, tidak bisa disembunyikan)</p>
                <ul className="mt-1 list-disc pl-5 text-merah-700">
                  {catatan.data.red_flags.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
        <div className="mt-4">
          <h3 className="text-body font-bold text-arang-900">Ajukan koreksi</h3>
          <p className="mb-2 text-small text-arang-500">Membuat tugas untuk tim survei; datanya tidak berubah sampai kami cek ulang.</p>
          <FormKoreksi kosId={id} bidang={[["kebersihan", "Kebersihan"], ["kedap_suara", "Kedap suara / desibel"], ["material_tembok", "Material tembok"], ["catatan", "Catatan surveyor"], ["red_flags", "Catatan keselamatan"], ["lainnya", "Lainnya"]]} />
          {(koreksi.data ?? []).length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-small text-arang-500">
              {(koreksi.data ?? []).map((k, i) => (
                <li key={i}>{tanggal(k.dibuat_pada)}: {k.bidang}, status {k.status}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
