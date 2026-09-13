"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { mitraBrowser } from "@/lib/supabase/mitra-client";
import { ajukanKoreksi, hapusFoto, simpanKos, tambahFoto, type DataEditKos, type Hasil } from "@/lib/mitra/aksi";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/cn";

const input = "h-12 w-full rounded-xl border-2 border-arang-500/30 bg-putih px-3 text-body text-arang-900 focus:border-biru-500";
const select = input;

export type FotoEditor = { id: string; url: string; keterangan: string | null };
export type KamarEdit = { id: string; nama: string; harga_bulanan: number; deposit: number; harga_tahunan: number | null; total_bulanan: number | null };

export function EditorKos({
  kosId,
  ownerId,
  awal,
  kamar,
  foto,
}: {
  kosId: string;
  ownerId: string;
  awal: DataEditKos;
  kamar: KamarEdit[];
  foto: FotoEditor[];
}) {
  const [data, setData] = useState<DataEditKos>(awal);
  const [status, setStatus] = useState<{ sibuk: boolean; hasil: Hasil | null }>({ sibuk: false, hasil: null });
  const [fotoStatus, setFotoStatus] = useState<string | null>(null);
  const berkas = useRef<HTMLInputElement>(null);

  const ubahKamar = (id: string, bidang: "harga_bulanan" | "deposit" | "harga_tahunan", nilai: string) =>
    setData((d) => ({ ...d, kamar: d.kamar.map((k) => (k.id === id ? { ...k, [bidang]: nilai === "" ? (bidang === "harga_tahunan" ? null : 0) : Number(nilai.replace(/\D/g, "")) } : k)) }));
  const ubahAturan = <K extends keyof DataEditKos["aturan"]>(k: K, v: DataEditKos["aturan"][K]) => setData((d) => ({ ...d, aturan: { ...d.aturan, [k]: v } }));

  const simpan = async () => {
    setStatus({ sibuk: true, hasil: null });
    setStatus({ sibuk: false, hasil: await simpanKos(kosId, data) });
  };

  const unggah = async (file: File) => {
    setFotoStatus("Mengunggah…");
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${ownerId}/${kosId}/${Date.now()}.${ext}`;
    const { error } = await mitraBrowser().storage.from("foto-kos").upload(path, file, { contentType: file.type });
    if (error) return setFotoStatus("Foto belum terunggah. Maksimal 8 MB, format JPG/PNG/WebP.");
    const { data: pub } = mitraBrowser().storage.from("foto-kos").getPublicUrl(path);
    const dim = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1600, h: 1200 });
      img.src = URL.createObjectURL(file);
    });
    const hasil = await tambahFoto(kosId, pub.publicUrl, dim.w, dim.h, null);
    setFotoStatus(hasil.ok ? "Foto ditambahkan." : hasil.pesan);
  };

  return (
    <div className="flex flex-col gap-8">
      <Bagian judul="Deskripsi" keterangan="Ceritakan yang tidak terlihat di foto: suasana, penghuni, jarak ke tempat penting.">
        <textarea value={data.deskripsi} onChange={(e) => setData((d) => ({ ...d, deskripsi: e.target.value }))} rows={4} maxLength={800} className="w-full rounded-xl border-2 border-arang-500/30 bg-putih px-3 py-2 text-body text-arang-900 focus:border-biru-500" />
      </Bagian>

      <Bagian judul="Harga" keterangan="Yang tampil ke penyewa adalah total termasuk listrik dan air dari survei; ubah sewanya di sini.">
        <ul className="flex flex-col gap-3">
          {data.kamar.map((k) => {
            const asal = kamar.find((x) => x.id === k.id);
            return (
              <li key={k.id} className="rounded-xl border border-arang-500/20 p-3">
                <p className="text-body font-bold text-arang-900">{asal?.nama}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-small text-arang-900">Sewa per bulan</span>
                    <input inputMode="numeric" value={k.harga_bulanan || ""} onChange={(e) => ubahKamar(k.id, "harga_bulanan", e.target.value)} className={cn(input, "tabular-nums")} />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-small text-arang-900">Deposit</span>
                    <input inputMode="numeric" value={k.deposit || ""} onChange={(e) => ubahKamar(k.id, "deposit", e.target.value)} className={cn(input, "tabular-nums")} placeholder="0" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-small text-arang-900">Harga tahunan (opsional)</span>
                    <input inputMode="numeric" value={k.harga_tahunan ?? ""} onChange={(e) => ubahKamar(k.id, "harga_tahunan", e.target.value)} className={cn(input, "tabular-nums")} placeholder="kosongkan jika tidak ada" />
                  </label>
                </div>
                {asal?.total_bulanan != null && (
                  <p className="mt-2 text-micro text-arang-500">Tampil ke penyewa sekarang: {formatRupiah(asal.total_bulanan)} per bulan (total).</p>
                )}
              </li>
            );
          })}
        </ul>
      </Bagian>

      <Bagian judul="Aturan">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-small text-arang-900">Jam malam (kosongkan jika tidak ada)</span>
            <input type="time" value={data.aturan.jam_malam ?? ""} onChange={(e) => ubahAturan("jam_malam", e.target.value || null)} className={input} />
          </label>
          <Pilih label="Tamu" nilai={data.aturan.tamu} onChange={(v) => ubahAturan("tamu", v as DataEditKos["aturan"]["tamu"])} opsi={[["boleh", "Boleh sampai ke kamar"], ["ruang_tamu", "Hanya di ruang tamu"], ["tidak", "Tidak menerima tamu"]]} />
          <Pilih label="Tamu lawan jenis" nilai={data.aturan.lawan_jenis} onChange={(v) => ubahAturan("lawan_jenis", v as DataEditKos["aturan"]["lawan_jenis"])} opsi={[["boleh", "Boleh sampai ke kamar"], ["ruang_tamu", "Hanya di ruang tamu"], ["tidak", "Tidak boleh"]]} />
          <Pilih label="Pasangan" nilai={data.aturan.pasangan} onChange={(v) => ubahAturan("pasangan", v as DataEditKos["aturan"]["pasangan"])} opsi={[["boleh", "Boleh"], ["surat_nikah", "Boleh dengan surat nikah"], ["tidak", "Tidak boleh"]]} />
          <Pilih label="Merokok" nilai={data.aturan.merokok} onChange={(v) => ubahAturan("merokok", v as DataEditKos["aturan"]["merokok"])} opsi={[["kamar", "Boleh di kamar"], ["luar", "Di luar saja"], ["dilarang", "Dilarang"]]} />
          <div className="flex flex-col gap-2 sm:col-span-2">
            {([["anak", "Boleh bawa anak"], ["hewan", "Boleh hewan peliharaan"], ["masak_di_kamar", "Boleh masak di kamar"]] as const).map(([k, label]) => (
              <label key={k} className="flex min-h-12 items-center gap-3 text-body text-arang-900">
                <input type="checkbox" checked={data.aturan[k]} onChange={(e) => ubahAturan(k, e.target.checked)} className="size-6 accent-biru-500" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </Bagian>

      {status.hasil && (
        <p role="status" className={cn("rounded-xl p-3 text-body font-bold", status.hasil.ok ? "bg-daun-100 text-daun-700" : "bg-merah-100 text-merah-700")}>{status.hasil.pesan}</p>
      )}
      <Button variant="primary" size="lg" className="w-full sm:w-auto" loading={status.sibuk} onClick={simpan}>Simpan perubahan</Button>

      <Bagian judul="Foto" keterangan="Foto survei kami tetap tampil; foto Bapak/Ibu ditambahkan setelahnya.">
        <ul className="grid grid-cols-3 gap-2">
          {foto.map((f) => (
            <li key={f.id} className="relative overflow-hidden rounded-xl bg-kertas-50">
              <div className="relative aspect-[4/3]">
                <Image src={f.url} alt={f.keterangan ?? "Foto kos"} fill sizes="200px" className="object-cover" />
              </div>
              <button type="button" onClick={() => hapusFoto(kosId, f.id)} className="absolute top-1 right-1 rounded-full bg-arang-900/70 px-2 py-1 text-micro font-bold text-putih">
                Hapus
              </button>
            </li>
          ))}
        </ul>
        <input ref={berkas} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && unggah(e.target.files[0])} />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => berkas.current?.click()}>Tambah foto</Button>
          {fotoStatus && <span className="text-small text-arang-500" role="status">{fotoStatus}</span>}
        </div>
      </Bagian>
    </div>
  );
}

export function FormKoreksi({ kosId, bidang }: { kosId: string; bidang: Array<[string, string]> }) {
  const [pilihan, setPilihan] = useState(bidang[0]?.[0] ?? "");
  const [pesan, setPesan] = useState("");
  const [status, setStatus] = useState<{ sibuk: boolean; hasil: Hasil | null }>({ sibuk: false, hasil: null });
  const kirim = async () => {
    setStatus({ sibuk: true, hasil: null });
    const hasil = await ajukanKoreksi(kosId, pilihan, pesan);
    setStatus({ sibuk: false, hasil });
    if (hasil.ok) setPesan("");
  };
  return (
    <div className="flex flex-col gap-3">
      <Pilih label="Bagian yang perlu dikoreksi" nilai={pilihan} onChange={setPilihan} opsi={bidang} />
      <label className="flex flex-col gap-1">
        <span className="text-small text-arang-900">Apa yang berbeda dari kondisi sekarang?</span>
        <textarea value={pesan} onChange={(e) => setPesan(e.target.value)} rows={3} className="w-full rounded-xl border-2 border-arang-500/30 bg-putih px-3 py-2 text-body text-arang-900 focus:border-biru-500" />
      </label>
      {status.hasil && <p role="status" className={cn("text-small font-bold", status.hasil.ok ? "text-daun-700" : "text-merah-700")}>{status.hasil.pesan}</p>}
      <Button variant="secondary" loading={status.sibuk} onClick={kirim} className="self-start">Ajukan koreksi</Button>
    </div>
  );
}

function Bagian({ judul, keterangan, children }: { judul: string; keterangan?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-h2 text-arang-900">{judul}</h2>
        {keterangan && <p className="text-small text-arang-500">{keterangan}</p>}
      </div>
      {children}
    </section>
  );
}

function Pilih({ label, nilai, onChange, opsi }: { label: string; nilai: string; onChange: (v: string) => void; opsi: Array<[string, string]> }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-small text-arang-900">{label}</span>
      <select value={nilai} onChange={(e) => onChange(e.target.value)} className={select}>
        {opsi.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
