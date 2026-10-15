"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { IconPutar } from "@/components/ui/Icon";
import { KosCard, KosCardSkeleton, type KosKartu } from "@/components/kos/KosCard";
import { restSelect } from "@/lib/supabase/rest";
import type { TipeKamar } from "@/lib/biaya";
import { formatRupiah } from "@/lib/format";
import { HANYA_DI_TAB, hapusSimpan, segarkanSimpan, setBanding, tersimpanPermanen, toggleSimpan, useHanyaDiTab, useSimpanan, type Simpanan } from "@/lib/simpan";
import { MAKS_TAUTAN_SIMPANAN, adalahUuid, bacaKunciKos, hrefBanding, tulisKunciKos, type KunciKos } from "@/lib/kos/kunci-banding";
import { tampilkanToast } from "@/lib/toast";

const hidrasi = () => () => {};
const useSudahHidrasi = () => useSyncExternalStore(hidrasi, () => true, () => false);

type Urut = "terbaru" | "termurah";

type Muatan = { kunci: string; kos: KosKartu[]; kamar: TipeKamar[]; gagal: boolean };

// /disimpan — works signed out. Each card says what changed since the save.
// A failed fetch is a failed fetch: it never turns into "sudah tidak tayang"
// or "kamar sudah tidak ada", and never suggests deleting a save.
export function DaftarSimpanan({ dariTautan = [] }: { dariTautan?: KunciKos[] }) {
  const simpanan = useSimpanan();
  const hanyaDiTab = useHanyaDiTab("simpan");
  const siap = useSudahHidrasi();
  const router = useRouter();
  const [urut, setUrut] = useState<Urut>("terbaru");
  const [disalin, setDisalin] = useState(false);
  const [coba, setCoba] = useState(0);
  const kunci = `${simpanan.map((s) => `${s.id}:${s.kamarId ?? ""}`).join(",")}|${coba}`;
  const [data, setData] = useState<Muatan | null>(null);

  useEffect(() => {
    const daftar = kunci.split("|")[0];
    if (!daftar) return;
    let batal = false;
    const ids = [...new Set(daftar.split(",").map((k) => k.split(":")[0]))].join(",");
    const kamarIds = daftar.split(",").map((k) => k.split(":")[1]).filter(Boolean).join(",");
    Promise.all([
      restSelect("kos_kartu", { select: "*", id: `in.(${ids})` }),
      kamarIds ? restSelect("tipe_kamar", { select: "*", id: `in.(${kamarIds})` }) : Promise.resolve({ data: [] as TipeKamar[], error: null }),
    ]).then(([kos, kamar]) => !batal && setData({ kunci, kos: kos.data ?? [], kamar: kamar.data ?? [], gagal: Boolean(kos.error || kamar.error) }));
    return () => {
      batal = true;
    };
  }, [kunci]);

  if (dariTautan.length > 0) return <DariTautan kunci={dariTautan} />;

  if (!siap) {
    return (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {Array.from({ length: 3 }, (_, i) => <li key={i}><KosCardSkeleton /></li>)}
      </ul>
    );
  }

  if (simpanan.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-biru-100 bg-putih p-6">
        <p className="text-h2 text-arang-900">Belum ada kos tersimpan.</p>
        <p className="text-small text-arang-500">Tekan tombol <b className="text-arang-900">Simpan</b> di kartu atau halaman kos mana pun; tombolnya berubah menjadi <b className="text-arang-900">Tersimpan</b>. Simpanan tersimpan di perangkat ini saja, tanpa perlu akun, dan tidak dikirim ke server kami.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/#preset" className={buttonClasses({ variant: "primary" })}>Mulai dari preset</Link>
          <Link href="/cari" className={buttonClasses({ variant: "secondary" })}>Cari kos</Link>
        </div>
      </div>
    );
  }

  const memuat = data?.kunci !== kunci;
  const sekarang = new Date();
  // A save remembers the room type that was on screen; show that room.
  const kosDari = (s: Simpanan) => {
    const kartu = data?.kos.find((k) => k.id === s.id);
    const kamar = s.kamarId ? data?.kamar.find((t) => t.id === s.kamarId) : undefined;
    return kartu && kamar ? kartuDenganKamar(kartu, kamar) : kartu;
  };
  const terurut = [...simpanan].sort((a, b) => {
    if (urut === "termurah") return (kosDari(a)?.total_bulanan ?? a.total_bulanan ?? Infinity) - (kosDari(b)?.total_bulanan ?? b.total_bulanan ?? Infinity);
    return (b.disimpan_pada || "").localeCompare(a.disimpan_pada || "");
  });

  const bandingkan = () => {
    const tiga = terurut.slice(0, 3);
    setBanding(tiga.map((s) => ({ id: s.id, slug: s.slug, nama: s.nama, kamarId: s.kamarId, kamarNama: s.kamarNama })));
    router.push(hrefBanding(tiga.map((s) => ({ kos: s.slug || s.id, kamar: s.kamarId }))));
  };

  // The link carries each saved room type, so the person opening it sees the same room and total.
  const bagikan = async () => {
    const isi = tulisKunciKos(simpanan.slice(0, MAKS_TAUTAN_SIMPANAN).map((s) => ({ kos: s.slug || s.id, kamar: s.kamarId })));
    const url = `${window.location.origin}/disimpan?kos=${isi}`;
    try {
      if (navigator.share) return await navigator.share({ title: "Kos yang kusimpan", url });
      await navigator.clipboard.writeText(url);
      setDisalin(true);
      window.setTimeout(() => setDisalin(false), 2500);
    } catch {
      // User dismissed the share sheet.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-arang-500">
          {hanyaDiTab ? `${simpanan.length} kos tersimpan sementara di tab ini. ${HANYA_DI_TAB}` : `${simpanan.length} kos tersimpan di perangkat ini (tidak dikirim ke server).`}
        </p>
        <div className="flex flex-wrap gap-2">
          {simpanan.length >= 2 && (
            <Button variant="secondary" size="sm" onClick={bandingkan}>
              Bandingkan {Math.min(simpanan.length, 3)} teratas
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={bagikan}>{disalin ? "Tautan disalin" : "Bagikan daftar"}</Button>
        </div>
      </div>
      {simpanan.length >= 2 && (
        <div className="flex gap-2" role="group" aria-label="Urutkan">
          <Chip selected={urut === "terbaru"} onClick={() => setUrut("terbaru")}>Terbaru disimpan</Chip>
          <Chip selected={urut === "termurah"} onClick={() => setUrut("termurah")}>Termurah</Chip>
        </div>
      )}
      {!memuat && data?.gagal ? (
        <GagalMuat jumlah={simpanan.length} cobaLagi={() => setCoba((c) => c + 1)}>
          <ul className="divide-y divide-biru-100 rounded-2xl border border-biru-100 bg-putih">
            {terurut.map((s) => (
              <li key={s.id} className="flex flex-col gap-0.5 px-4 py-3">
                {s.slug ? (
                  <Link href={s.kamarId ? `/kos/${s.slug}?kamar=${s.kamarId}` : `/kos/${s.slug}`} className="self-start rounded-sm text-body font-bold text-biru-600 hover:underline">
                    {s.nama || "Kos tersimpan"}
                  </Link>
                ) : (
                  <span className="text-body font-bold text-arang-900">{s.nama || "Kos tersimpan"}</span>
                )}
                <span className="text-small text-arang-500">
                  {s.kamarNama ? `Kamar ${s.kamarNama}` : "Kamar dipilih otomatis"}
                  {s.total_bulanan != null && `, ${formatRupiah(s.total_bulanan)}/bln saat disimpan`}
                </span>
              </li>
            ))}
          </ul>
        </GagalMuat>
      ) : (
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={memuat}>
        {terurut.map((s) => {
          const kos = kosDari(s);
          if (memuat) return <li key={s.id}><KosCardSkeleton /></li>;
          if (!kos) return <li key={s.id}><TidakTayang s={s} /></li>;
          return (
            <li key={s.id} className="flex flex-col gap-2">
              {s.kamarId && kos.kamar_id !== s.kamarId && (
                <p className="text-micro text-arang-500">Tipe kamar yang kamu simpan sudah tidak ada; ini tipe yang tersedia sekarang.</p>
              )}
              <Perubahan s={s} kos={kos} />
              <KosCard kos={kos} sekarang={sekarang} />
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}

function GagalMuat({ jumlah, cobaLagi, children }: { jumlah?: number; cobaLagi: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-merah-100 bg-putih p-6">
        <p className="text-body font-bold text-arang-900">Harga dan ketersediaan terbaru belum bisa dimuat.</p>
        <p className="text-small text-arang-500">
          {jumlah != null ? `Daftarmu (${jumlah} kos) tetap aman di perangkat ini. ` : ""}Cek koneksi internet, lalu coba lagi.
        </p>
        <Button variant="primary" onClick={cobaLagi}>
          <IconPutar className="size-4" /> Coba lagi
        </Button>
      </div>
      {children}
    </div>
  );
}

// A list opened from a shared link. Nothing is written until the user says so.
// Each entry shows the room type that was shared; a room that no longer
// exists is said so, never swapped silently.
function DariTautan({ kunci }: { kunci: KunciKos[] }) {
  const router = useRouter();
  const simpanan = useSimpanan();
  const [coba, setCoba] = useState(0);
  const kunciMuat = `${tulisKunciKos(kunci)}|${coba}`;
  const [muat, setMuat] = useState<Muatan | null>(null);
  useEffect(() => {
    let batal = false;
    const daftar = bacaKunciKos(kunciMuat.split("|")[0], MAKS_TAUTAN_SIMPANAN);
    const slugs = daftar.filter((k) => !adalahUuid(k.kos)).map((k) => k.kos);
    const ids = daftar.filter((k) => adalahUuid(k.kos)).map((k) => k.kos);
    const kamarIds = daftar.flatMap((k) => (k.kamar ? [k.kamar] : []));
    const atau = [slugs.length ? `slug.in.(${slugs.join(",")})` : "", ids.length ? `id.in.(${ids.join(",")})` : ""].filter(Boolean).join(",");
    Promise.all([
      restSelect("kos_kartu", { select: "*", or: `(${atau})`, status: "eq.tayang" }),
      kamarIds.length ? restSelect("tipe_kamar", { select: "*", id: `in.(${kamarIds.join(",")})` }) : Promise.resolve({ data: [] as TipeKamar[], error: null }),
    ]).then(([kos, kamar]) => !batal && setMuat({ kunci: kunciMuat, kos: kos.data ?? [], kamar: kamar.data ?? [], gagal: Boolean(kos.error || kamar.error) }));
    return () => {
      batal = true;
    };
  }, [kunciMuat]);

  const siap = muat?.kunci === kunciMuat;
  const baris = siap
    ? kunci.flatMap((k) => {
        const kartu = muat.kos.find((x) => x.slug === k.kos || x.id === k.kos);
        if (!kartu) return [];
        const kamar = k.kamar ? muat.kamar.find((t) => t.id === k.kamar && t.kos_id === kartu.id) : undefined;
        return [{ kunci: k, kos: kamar ? kartuDenganKamar(kartu, kamar) : kartu, kamarHilang: Boolean(k.kamar && !kamar) }];
      })
    : [];
  const tidakTayang = kunci.length - baris.length;
  const belumAda = baris.filter((b) => !simpanan.some((s) => s.id === b.kos.id));
  const simpanSemua = () => {
    belumAda.forEach(({ kos: k, kamarHilang }) =>
      toggleSimpan({
        id: k.id ?? "",
        slug: k.slug ?? "",
        nama: k.nama ?? "",
        kamarId: kamarHilang ? null : k.kamar_id,
        kamarNama: kamarHilang ? null : k.kamar_nama,
        total_bulanan: k.total_bulanan,
        kamar_tersedia: k.kamar_acuan_tersedia,
      }),
    );
    tampilkanToast({ teks: tersimpanPermanen("simpan") ? `${belumAda.length} kos disimpan ke perangkat ini.` : `${belumAda.length} kos disimpan sementara. ${HANYA_DI_TAB}` });
    router.replace("/disimpan");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-biru-100 bg-putih p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-arang-900">
          Daftar dari tautan yang dibagikan{siap && !muat.gagal ? `, ${baris.length} kos dengan tipe kamar yang dipilih pengirim` : ""}.
        </p>
        <div className="flex flex-wrap gap-2">
          {belumAda.length > 0 && !muat?.gagal && (
            <Button variant="primary" size="sm" onClick={simpanSemua}>
              Simpan {belumAda.length} kos ke perangkat ini
            </Button>
          )}
          <Link href="/disimpan" className={buttonClasses({ variant: "ghost", size: "sm" })}>Lihat simpananku</Link>
        </div>
      </div>
      {!siap ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: Math.min(kunci.length, 3) }, (_, i) => <li key={i}><KosCardSkeleton /></li>)}
        </ul>
      ) : muat.gagal ? (
        <GagalMuat cobaLagi={() => setCoba((c) => c + 1)} />
      ) : (
        <>
          {baris.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {baris.map((b) => (
                <li key={`${b.kunci.kos}:${b.kunci.kamar ?? ""}`} className="flex flex-col gap-2">
                  {b.kamarHilang && <p className="text-micro text-arang-500">Tipe kamar yang dibagikan sudah tidak ada; ini tipe yang tersedia sekarang.</p>}
                  <KosCard kos={b.kos} />
                </li>
              ))}
            </ul>
          )}
          {tidakTayang > 0 && (
            <p className="text-small text-arang-500">
              {baris.length === 0 ? "Kos di tautan ini sudah tidak tayang." : `${tidakTayang} kos di tautan ini sudah tidak tayang.`}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Perubahan({ s, kos }: { s: Simpanan; kos: KosKartu }) {
  const catatan: Array<{ teks: string; tone: "baik" | "bahaya" | "peringatan" }> = [];
  if (s.total_bulanan != null && kos.total_bulanan != null && kos.total_bulanan !== s.total_bulanan) {
    const beda = kos.total_bulanan - s.total_bulanan;
    catatan.push({ teks: `Harga ${beda > 0 ? "naik" : "turun"} ${formatRupiah(Math.abs(beda))} sejak disimpan`, tone: beda > 0 ? "bahaya" : "baik" });
  }
  const sekarangTersedia = kos.kamar_acuan_tersedia;
  if (s.kamar_tersedia != null && sekarangTersedia != null) {
    if (s.kamar_tersedia > 0 && sekarangTersedia === 0) catatan.push({ teks: "Sekarang penuh", tone: "bahaya" });
    if (s.kamar_tersedia === 0 && sekarangTersedia > 0) catatan.push({ teks: "Kamar tersedia lagi", tone: "baik" });
  }
  if (catatan.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {catatan.map((c) => <Badge key={c.teks} tone={c.tone}>{c.teks}</Badge>)}
      <button type="button" onClick={() => segarkanSimpan({ id: kos.id ?? s.id, slug: kos.slug ?? s.slug, nama: kos.nama ?? s.nama, total_bulanan: kos.total_bulanan, kamar_tersedia: kos.kamar_acuan_tersedia })} className="sentuh relative rounded-sm text-micro text-arang-500 hover:text-biru-600 hover:underline">
        Oke, sudah lihat
      </button>
    </div>
  );
}

function TidakTayang({ s }: { s: Simpanan }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-2xl border border-arang-500/20 bg-kertas-50 p-4">
      <p className="text-body font-bold text-arang-900">{s.nama || "Kos tersimpan"}</p>
      <p className="text-small text-arang-500">Kos ini sudah tidak tayang di Kos Bahagia.</p>
      <Button variant="ghost" size="sm" className="mt-auto self-start" onClick={() => hapusSimpan(s.id)}>
        Hapus dari simpanan
      </Button>
    </div>
  );
}

/** The card row, re-pointed at a specific room type (price, name, vacancy together). */
function kartuDenganKamar(kartu: KosKartu, kamar: TipeKamar): KosKartu {
  return {
    ...kartu,
    kamar: kamar as unknown as KosKartu["kamar"],
    kamar_id: kamar.id,
    kamar_nama: kamar.nama,
    harga_bulanan: kamar.harga_bulanan,
    total_bulanan: kamar.total_bulanan,
    total_lengkap: kamar.total_lengkap,
    total_estimasi: kamar.total_estimasi,
    kamar_acuan_tersedia: kamar.kamar_tersedia,
    kamar_acuan_total: kamar.total_kamar,
  };
}
