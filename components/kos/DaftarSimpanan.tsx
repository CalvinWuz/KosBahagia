"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { KosCard, KosCardSkeleton, type KosKartu } from "@/components/kos/KosCard";
import { restSelect } from "@/lib/supabase/rest";
import type { TipeKamar } from "@/lib/biaya";
import { formatRupiah } from "@/lib/format";
import { hapusSimpan, segarkanSimpan, setBanding, toggleSimpan, useSimpanan, type Simpanan } from "@/lib/simpan";
import { hrefBanding } from "@/lib/kos/kunci-banding";
import { tampilkanToast } from "@/lib/toast";

const hidrasi = () => () => {};
const useSudahHidrasi = () => useSyncExternalStore(hidrasi, () => true, () => false);

type Urut = "terbaru" | "termurah";

// /disimpan — works signed out. Each card says what changed since the save.
export function DaftarSimpanan({ dariTautan = [] }: { dariTautan?: string[] }) {
  const simpanan = useSimpanan();
  const siap = useSudahHidrasi();
  const router = useRouter();
  const [urut, setUrut] = useState<Urut>("terbaru");
  const [disalin, setDisalin] = useState(false);
  const kunci = simpanan.map((s) => `${s.id}:${s.kamarId ?? ""}`).join(",");
  const [data, setData] = useState<{ kunci: string; kos: KosKartu[]; kamar: TipeKamar[] } | null>(null);

  useEffect(() => {
    if (!kunci) return;
    let batal = false;
    const ids = [...new Set(kunci.split(",").map((k) => k.split(":")[0]))].join(",");
    const kamarIds = kunci.split(",").map((k) => k.split(":")[1]).filter(Boolean).join(",");
    Promise.all([
      restSelect("kos_kartu", { select: "*", id: `in.(${ids})` }),
      kamarIds ? restSelect("tipe_kamar", { select: "*", id: `in.(${kamarIds})` }) : Promise.resolve({ data: [] as TipeKamar[], error: null }),
    ]).then(([kos, kamar]) => !batal && setData({ kunci, kos: kos.data ?? [], kamar: kamar.data ?? [] }));
    return () => {
      batal = true;
    };
  }, [kunci]);

  if (dariTautan.length > 0) return <DariTautan slugs={dariTautan} />;

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
        <p className="text-small text-arang-500">Tekan ikon hati di kartu kos mana pun. Simpanan tersimpan di perangkat ini saja, tanpa perlu akun, dan tidak dikirim ke server kami.</p>
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

  const bagikan = async () => {
    const slugs = simpanan.map((s) => s.slug).filter(Boolean);
    const url = `${window.location.origin}/disimpan?kos=${slugs.join(",")}`;
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
        <p className="text-small text-arang-500">{simpanan.length} kos tersimpan di perangkat ini (tidak dikirim ke server).</p>
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
    </div>
  );
}

// A list opened from a shared link. Nothing is written until the user says so.
function DariTautan({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  const simpanan = useSimpanan();
  const [kos, setKos] = useState<KosKartu[] | null>(null);
  const kunciSlug = slugs.join(",");
  useEffect(() => {
    let batal = false;
    restSelect("kos_kartu", { select: "*", slug: `in.(${kunciSlug})`, status: "eq.tayang" }).then(({ data }) => !batal && setKos(data ?? []));
    return () => {
      batal = true;
    };
  }, [kunciSlug]);

  const belumAda = (kos ?? []).filter((k) => !simpanan.some((s) => s.id === k.id));
  const simpanSemua = () => {
    belumAda.forEach((k) => toggleSimpan({ id: k.id ?? "", slug: k.slug ?? "", nama: k.nama ?? "", total_bulanan: k.total_bulanan, kamar_tersedia: k.kamar_tersedia }));
    tampilkanToast({ teks: `${belumAda.length} kos disimpan ke perangkat ini.` });
    router.replace("/disimpan");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-biru-100 bg-putih p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-arang-900">
          Daftar dari tautan yang dibagikan{kos ? `, ${kos.length} kos` : ""}.
        </p>
        <div className="flex flex-wrap gap-2">
          {belumAda.length > 0 && (
            <Button variant="primary" size="sm" onClick={simpanSemua}>
              Simpan {belumAda.length} kos ke perangkat ini
            </Button>
          )}
          <Link href="/disimpan" className={buttonClasses({ variant: "ghost", size: "sm" })}>Lihat simpananku</Link>
        </div>
      </div>
      {kos === null ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: Math.min(slugs.length, 3) }, (_, i) => <li key={i}><KosCardSkeleton /></li>)}
        </ul>
      ) : kos.length === 0 ? (
        <p className="text-small text-arang-500">Kos di tautan ini sudah tidak tayang.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kos.map((k) => <li key={k.id}><KosCard kos={k} /></li>)}
        </ul>
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
