"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { KosCard, KosCardSkeleton, type KosKartu } from "@/components/kos/KosCard";
import { restSelect } from "@/lib/supabase/rest";
import { formatRupiah } from "@/lib/format";
import { hapusSimpan, segarkanSimpan, setBanding, useSimpanan, type Simpanan } from "@/lib/simpan";

const hidrasi = () => () => {};
const useSudahHidrasi = () => useSyncExternalStore(hidrasi, () => true, () => false);

// /disimpan — works signed out. Each card says what changed since the save.
export function DaftarSimpanan() {
  const simpanan = useSimpanan();
  const siap = useSudahHidrasi();
  const router = useRouter();
  const kunci = simpanan.map((s) => s.id).join(",");
  const [data, setData] = useState<{ kunci: string; kos: KosKartu[] } | null>(null);

  useEffect(() => {
    if (!kunci) return;
    let batal = false;
    restSelect("kos_kartu", { select: "*", id: `in.(${kunci})` }).then(({ data }) => !batal && setData({ kunci, kos: data ?? [] }));
    return () => {
      batal = true;
    };
  }, [kunci]);

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
        <p className="text-small text-arang-500">Tekan ikon hati di kartu kos mana pun. Simpanan tersimpan di HP ini, tanpa perlu akun.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/#preset" className={buttonClasses({ variant: "primary" })}>Mulai dari preset</Link>
          <Link href="/cari" className={buttonClasses({ variant: "secondary" })}>Cari kos</Link>
        </div>
      </div>
    );
  }

  const memuat = data?.kunci !== kunci;
  const sekarang = new Date();
  const bandingkan = () => {
    setBanding(simpanan.slice(0, 3).map((s) => ({ id: s.id, slug: s.slug, nama: s.nama })));
    router.push(`/banding?kos=${simpanan.slice(0, 3).map((s) => s.slug || s.id).join(",")}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-small text-arang-500">{simpanan.length} kos tersimpan di HP ini.</p>
        {simpanan.length >= 2 && (
          <Button variant="secondary" size="sm" onClick={bandingkan}>
            Bandingkan {Math.min(simpanan.length, 3)} teratas
          </Button>
        )}
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy={memuat}>
        {simpanan.map((s) => {
          const kos = data?.kos.find((k) => k.id === s.id);
          if (memuat) return <li key={s.id}><KosCardSkeleton /></li>;
          if (!kos) return <li key={s.id}><TidakTayang s={s} /></li>;
          return (
            <li key={s.id} className="flex flex-col gap-2">
              <Perubahan s={s} kos={kos} />
              <KosCard kos={kos} sekarang={sekarang} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Perubahan({ s, kos }: { s: Simpanan; kos: KosKartu }) {
  const catatan: Array<{ teks: string; tone: "baik" | "bahaya" | "peringatan" }> = [];
  if (s.total_bulanan != null && kos.total_bulanan != null && kos.total_bulanan !== s.total_bulanan) {
    const beda = kos.total_bulanan - s.total_bulanan;
    catatan.push({ teks: `Harga ${beda > 0 ? "naik" : "turun"} ${formatRupiah(Math.abs(beda))} sejak disimpan`, tone: beda > 0 ? "bahaya" : "baik" });
  }
  if (s.kamar_tersedia != null && kos.kamar_tersedia != null) {
    if (s.kamar_tersedia > 0 && kos.kamar_tersedia === 0) catatan.push({ teks: "Sekarang penuh", tone: "bahaya" });
    if (s.kamar_tersedia === 0 && kos.kamar_tersedia > 0) catatan.push({ teks: "Kamar tersedia lagi", tone: "baik" });
  }
  if (catatan.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {catatan.map((c) => <Badge key={c.teks} tone={c.tone}>{c.teks}</Badge>)}
      <button type="button" onClick={() => segarkanSimpan({ id: kos.id ?? s.id, slug: kos.slug ?? s.slug, nama: kos.nama ?? s.nama, total_bulanan: kos.total_bulanan, kamar_tersedia: kos.kamar_tersedia })} className="rounded-sm text-micro text-arang-500 hover:text-biru-600 hover:underline">
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
