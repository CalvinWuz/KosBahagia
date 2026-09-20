"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { IconChevronDown, IconClose, IconDaftar, IconFilter, IconKembali, IconPeta, IconPutar } from "@/components/ui/Icon";
import { KosCard, KosCardSkeleton } from "@/components/kos/KosCard";
import { restKlien } from "@/lib/supabase/rest";
import { bacaCariParams, hrefCari, jumlahFilterAktif, tanpaFilter, type CariParams, type UrutCari } from "@/lib/cari-params";
import { ambilHasil, type HasilKos } from "@/lib/cari/ambil";
import { saranLonggar, terdekatDiLuar, type SaranLonggar, type Terdekat } from "@/lib/cari/longgar";
import { tentukanPusat, type AreaPublik } from "@/lib/cari/pusat";
import { lepasLapisAktif, useKembali } from "@/lib/navigasi";
import { cn } from "@/lib/cn";
import type { FasilitasFilter } from "./FilterSheet";
import type { AreaPeta } from "./PetaHasil";
import type { AreaRingkas, PilihanCari } from "./saran";

// Headless UI rides in with the sheets; keep them out of the first paint.
const FilterSheet = dynamic(() => import("./FilterSheet").then((m) => m.FilterSheet));
const PencarianSheet = dynamic(() => import("./PencarianSheet").then((m) => m.PencarianSheet));

// The map bundle only loads when the map is first shown.
const PetaHasil = dynamic(() => import("./PetaHasil"), {
  ssr: false,
  loading: () => <div className="grid h-full w-full place-items-center bg-biru-100 text-small text-arang-500">Memuat peta…</div>,
});

export type DataHasil = { kunci: string; hasil: HasilKos[]; total: number; error?: string };
export type ModeRiwayat = "push" | "replace";

type Props = {
  awal: DataHasil;
  areas: AreaPublik[];
  fasilitas: FasilitasFilter[];
  /** ISO timestamp of the server render; keeps freshness stamps consistent. */
  sekarang: string;
};

const URUT: Array<{ nilai: UrutCari; label: string }> = [
  { nilai: "relevan", label: "Paling relevan" },
  { nilai: "termurah", label: "Termurah" },
  { nilai: "terdekat", label: "Terdekat" },
  { nilai: "skor", label: "Skor tertinggi" },
];

const langgananDesktop = (cb: () => void) => {
  const mq = window.matchMedia("(min-width: 1024px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useDesktop = () =>
  useSyncExternalStore(langgananDesktop, () => window.matchMedia("(min-width: 1024px)").matches, () => false);

// Results first, filters narrow them afterwards. All filter state lives in
// the URL, so links are shareable and the back button restores the
// previous state; every URL change refetches in the browser.
export function HasilPencarian({ awal, areas, fasilitas, sekarang }: Props) {
  const sp = useSearchParams();
  const kunci = sp.toString();
  const params = useMemo(() => bacaCariParams(sp), [sp]);
  const pusat = useMemo(() => tentukanPusat(params, areas), [params, areas]);
  const sekarangDate = useMemo(() => new Date(sekarang), [sekarang]);
  const desktop = useDesktop();
  const router = useRouter();
  const kembali = useKembali("/");

  const [data, setData] = useState<DataHasil>(awal);
  const [memuatLagi, setMemuatLagi] = useState(false);
  const [bukaFilter, setBukaFilter] = useState(false);
  const [pernahBukaFilter, setPernahBukaFilter] = useState(false);
  const [bukaCari, setBukaCari] = useState(false);
  const [pernahBukaCari, setPernahBukaCari] = useState(false);
  const [terpilih, setTerpilih] = useState<string | null>(null);
  const [disorot, setDisorot] = useState<string | null>(null);
  // Tagged with the centre it belongs to, so a new centre drops a stale prompt.
  const kunciPusat = `${pusat.lat},${pusat.lng}`;
  const [geserState, setGeserState] = useState<{ kunci: string; area: AreaPeta } | null>(null);
  const geser = geserState?.kunci === kunciPusat ? geserState.area : null;
  const setGeser = useCallback((a: AreaPeta | null) => setGeserState(a ? { kunci: kunciPusat, area: a } : null), [kunciPusat]);
  const [saran, setSaran] = useState<{ kunci: string; longgar: SaranLonggar | null; terdekat: Terdekat } | null>(null);

  const peta = params.tampil === "peta";
  const memuat = data.kunci !== kunci;
  const { hasil, total } = data;
  const jumlahFilter = jumlahFilterAktif(params);
  const adaLagi = hasil.length < total;
  const areaPopuler = useMemo<AreaRingkas[]>(
    () => areas.filter((a) => a.slug && a.nama).map((a) => ({ slug: a.slug as string, nama: a.nama as string, tipe: a.tipe ?? "" })),
    [areas],
  );

  // URL changed (chip, sheet, back button) → fetch page one.
  useEffect(() => {
    if (data.kunci === kunci) return;
    let batal = false;
    ambilHasil(restKlien, params, pusat)
      .then((r) => !batal && setData({ kunci, ...r }))
      .catch((e: unknown) => !batal && setData({ kunci, hasil: [], total: 0, error: e instanceof Error ? e.message : String(e) }));
    return () => {
      batal = true;
    };
  }, [kunci, params, pusat, data.kunci]);

  // Zero results → work out which single filter to relax, plus 3 nearest beyond the radius.
  useEffect(() => {
    if (memuat || data.error || total > 0 || saran?.kunci === kunci) return;
    let batal = false;
    Promise.all([saranLonggar(restKlien, params, pusat), terdekatDiLuar(restKlien, params, pusat)])
      .then(([longgar, terdekat]) => !batal && setSaran({ kunci, longgar, terdekat }))
      .catch(() => !batal && setSaran({ kunci, longgar: null, terdekat: { hasil: [], tanpaFilter: true } }));
    return () => {
      batal = true;
    };
  }, [memuat, data.error, total, saran?.kunci, kunci, params, pusat]);

  // One history entry per real change from the chips, so the back button
  // walks through filter states. While the filter sheet is open every
  // change replaces instead, so one sheet session is one step (the sheet
  // itself keeps the entry when it closes).
  const terapkan = useCallback(
    (ubah: (p: CariParams) => CariParams, mode: ModeRiwayat = "push") => {
      const href = hrefCari(ubah({ ...params, hal: 1 }));
      if (href === `${window.location.pathname}${window.location.search}`) return;
      if (mode === "replace") window.history.replaceState(null, "", href);
      else window.history.pushState(null, "", href);
    },
    [params],
  );
  // The sheet applies with replace; remember that it did, so its history
  // entry is kept when the sheet closes (one session = one step).
  const berubahDiSheet = useRef(false);
  const terapkanDiSheet = useCallback(
    (ubah: (p: CariParams) => CariParams) => {
      berubahDiSheet.current = true;
      terapkan(ubah, "replace");
    },
    [terapkan],
  );

  // Picking an area/campus from the search sheet keeps the current filters.
  // Replace, not push: the sheet's own history entry becomes the new search.
  const pilihDariSheet = (item: PilihanCari) => {
    const url = new URL(item.href, window.location.origin);
    lepasLapisAktif();
    if (url.pathname !== "/cari") {
      router.replace(item.href);
      return;
    }
    const baru = bacaCariParams(url.searchParams);
    terapkan((p) => ({ ...p, area: baru.area, q: baru.q, radius: undefined, lat: undefined, lng: undefined }), "replace");
  };

  const muatLagi = useCallback(async () => {
    if (memuat || memuatLagi || !adaLagi) return;
    setMemuatLagi(true);
    try {
      const r = await ambilHasil(restKlien, params, pusat, { offset: hasil.length });
      setData((d) => (d.kunci === kunci ? { ...d, hasil: [...d.hasil, ...r.hasil], total: r.total } : d));
    } catch {
      // Button stays visible; the user can try again.
    } finally {
      setMemuatLagi(false);
    }
  }, [memuat, memuatLagi, adaLagi, params, pusat, hasil.length, kunci]);

  // Infinite scroll with the button as the accessible fallback.
  const sentinel = useRef<HTMLDivElement>(null);
  const muatLagiRef = useRef(muatLagi);
  useEffect(() => {
    muatLagiRef.current = muatLagi;
  });
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries[0]?.isIntersecting && muatLagiRef.current(), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cobaLagi = () => setData((d) => ({ ...d, kunci: `${d.kunci}#ulang${Date.now()}`, error: undefined }));

  const fas = new Set(params.fasilitas ?? []);
  const cepat = [
    { label: "Semua", aktif: jumlahFilter === 0, klik: () => terapkan(tanpaFilter) },
    { label: "≤ Rp1,5 jt", aktif: params.harga_max === 1_500_000, klik: () => terapkan((p) => ({ ...p, harga_max: p.harga_max === 1_500_000 ? undefined : 1_500_000 })) },
    { label: "Kamar mandi dalam", aktif: fas.has("kamar-mandi-dalam"), klik: () => terapkan((p) => ({ ...p, fasilitas: fas.has("kamar-mandi-dalam") ? (p.fasilitas ?? []).filter((x) => x !== "kamar-mandi-dalam") : [...(p.fasilitas ?? []), "kamar-mandi-dalam"] })) },
    { label: "Bersih", aktif: (params.kebersihan ?? 0) >= 4, klik: () => terapkan((p) => ({ ...p, kebersihan: (p.kebersihan ?? 0) >= 4 ? undefined : 4 })) },
    { label: "Kedap suara", aktif: (params.kedap ?? 0) >= 4, klik: () => terapkan((p) => ({ ...p, kedap: (p.kedap ?? 0) >= 4 ? undefined : 4 })) },
  ];

  const tampilkanPeta = desktop || peta;
  const kosTerpilih = terpilih ? hasil.find((k) => k.id === terpilih) : undefined;

  const petaBlok = tampilkanPeta && (
    <div className="relative h-full w-full">
      <PetaHasil pusat={pusat} kos={hasil} terpilih={terpilih} onPilih={setTerpilih} disorot={disorot} onGeser={setGeser} />
      {geser && (
        <div className="absolute inset-x-0 top-3 z-10 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            className="shadow-lg"
            onClick={() => {
              terapkan((p) => ({ ...p, area: undefined, q: undefined, lat: geser.lat, lng: geser.lng, radius: geser.radius }));
              setGeser(null);
            }}
          >
            <IconPutar className="size-4" /> Cari di area peta ini
          </Button>
        </div>
      )}
      {kosTerpilih && (
        <div className="absolute inset-x-3 bottom-3 z-10">
          <KosCard kos={kosTerpilih} sekarang={sekarangDate} ringkas className="shadow-xl" />
          <button
            type="button"
            onClick={() => setTerpilih(null)}
            aria-label="Tutup kartu"
            className="absolute -top-3 -right-1 grid size-8 place-items-center rounded-full border border-biru-100 bg-putih text-arang-500 shadow hover:text-biru-600"
          >
            <IconClose className="size-4" />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,720px)_minmax(0,1fr)]">
      <div className="min-w-0">
        {/* Sticky top: back · area (tap to change) · map toggle / filter + chips */}
        <div className="sticky top-0 z-30 border-b border-biru-100 bg-putih lg:top-16">
          <div className="flex h-14 items-center gap-1 px-2 sm:px-4">
            <button
              type="button"
              onClick={kembali}
              aria-label="Kembali"
              className="grid size-10 shrink-0 place-items-center rounded-full text-arang-900 hover:bg-biru-100 lg:hidden"
            >
              <IconKembali />
            </button>
            <h1 className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => {
                  setPernahBukaCari(true);
                  setBukaCari(true);
                }}
                aria-label={`Area: ${pusat.nama}. Ganti area atau kampus`}
                className="flex h-10 max-w-full items-center gap-1 rounded-full px-2 text-body font-bold text-arang-900 hover:bg-biru-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
              >
                <span className="truncate">{pusat.nama}</span>
                <IconChevronDown className="size-4 shrink-0 text-biru-600" />
              </button>
            </h1>
            <button
              type="button"
              aria-pressed={peta}
              onClick={() => terapkan((p) => ({ ...p, tampil: p.tampil === "peta" ? undefined : "peta" }), "replace")}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-biru-100 px-3 text-small font-bold text-biru-600 hover:bg-biru-100 lg:hidden"
            >
              {peta ? <IconDaftar className="size-4" /> : <IconPeta className="size-4" />}
              {peta ? "Daftar" : "Peta"}
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 pb-2">
            <button
              type="button"
              onClick={() => {
                berubahDiSheet.current = false;
                setPernahBukaFilter(true);
                setBukaFilter(true);
              }}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-small font-bold whitespace-nowrap transition-colors duration-150 ease-out",
                jumlahFilter > 0 ? "border-biru-500 bg-biru-100 text-biru-600" : "border-arang-500/30 bg-putih text-arang-900 hover:border-biru-500",
              )}
            >
              <IconFilter className="size-4" />
              Filter
              {jumlahFilter > 0 && <span className="rounded-full bg-biru-600 px-1.5 text-micro text-putih tabular-nums">{jumlahFilter}</span>}
            </button>
            <div className="relative min-w-0 flex-1">
              <ul className="flex gap-2 overflow-x-auto pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Filter cepat">
                {cepat.map((c) => (
                  <li key={c.label} className="shrink-0">
                    <Chip selected={c.aktif} onClick={c.klik}>{c.label}</Chip>
                  </li>
                ))}
              </ul>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-putih to-transparent" />
            </div>
          </div>
        </div>

        {/* Mobile: map replaces the list under the same header */}
        {peta && !desktop && <div className="h-[calc(100dvh-6.5rem)] lg:hidden">{petaBlok}</div>}

        <div className={cn("px-4 py-3", peta && "hidden lg:block")}>
          <div className="flex items-center justify-between gap-3 pb-3">
            <p className="text-small text-arang-900 tabular-nums" aria-live="polite" aria-atomic="true">
              {data.error ? "Gagal memuat" : memuat ? "Menghitung…" : `${total} kos`}
            </p>
            <label className="flex items-center gap-1 text-small text-arang-500">
              <span className="sr-only">Urutkan</span>
              <select
                value={params.urut ?? "relevan"}
                onChange={(e) => terapkan((p) => ({ ...p, urut: e.target.value as UrutCari }))}
                className="h-9 rounded-lg border border-transparent bg-putih pr-1 text-small font-bold text-biru-600 hover:border-biru-100"
              >
                {URUT.map((u) => (
                  <option key={u.nilai} value={u.nilai}>{u.label}</option>
                ))}
              </select>
            </label>
          </div>

          {data.error ? (
            <div className="flex flex-col items-start gap-3 rounded-2xl border border-merah-100 bg-putih p-6">
              <p className="text-body font-bold text-arang-900">Hasil tidak bisa dimuat.</p>
              <p className="text-small text-arang-500">Koneksi ke server pencarian gagal. Cek internet kamu, lalu coba lagi.</p>
              <Button variant="primary" onClick={cobaLagi}>
                <IconPutar className="size-4" /> Coba lagi
              </Button>
            </div>
          ) : memuat && hasil.length === 0 ? (
            <DaftarSkeleton />
          ) : !memuat && total === 0 ? (
            <Kosong kunci={kunci} saran={saran} params={params} sekarang={sekarangDate} />
          ) : (
            <>
              <h2 className="sr-only">Hasil pencarian</h2>
              <ul className={cn("grid gap-4 sm:grid-cols-2", memuat && "opacity-60")} aria-busy={memuat}>
                {hasil.map((k, i) => (
                  <li key={k.id}>
                    <KosCard kos={k} sekarang={sekarangDate} prioritas={i < 2} onSorot={desktop ? setDisorot : undefined} />
                  </li>
                ))}
                {memuatLagi && Array.from({ length: 4 }, (_, i) => (
                  <li key={`s-${i}`}><KosCardSkeleton /></li>
                ))}
              </ul>
              <div ref={sentinel} aria-hidden="true" />
              {adaLagi && (
                <div className="mt-6 flex justify-center">
                  <Button variant="secondary" onClick={muatLagi} loading={memuatLagi}>
                    Muat lebih banyak
                  </Button>
                </div>
              )}
              {!adaLagi && hasil.length > 0 && (
                <p className="mt-6 text-center text-small text-arang-500">Itu semua {total} kos yang cocok.</p>
              )}
            </>
          )}
        </div>
      </div>

      <aside className="hidden lg:block lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]">{desktop && petaBlok}</aside>

      {pernahBukaFilter && (
        <FilterSheet
          open={bukaFilter}
          onClose={() => setBukaFilter(false)}
          params={params}
          total={total}
          memuat={memuat}
          fasilitas={fasilitas}
          terapkan={terapkanDiSheet}
          hrefTerakhir={hrefCari(params)}
          pertahankan={() => berubahDiSheet.current}
        />
      )}
      {pernahBukaCari && (
        <PencarianSheet open={bukaCari} onClose={() => setBukaCari(false)} areaPopuler={areaPopuler} onPilih={pilihDariSheet} title="Ganti area" />
      )}
    </div>
  );
}

export function DaftarSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Memuat hasil">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i}><KosCardSkeleton /></li>
      ))}
    </ul>
  );
}

// Never a dead end: relax the most expensive filter, or show what is nearby.
function Kosong({
  kunci,
  saran,
  params,
  sekarang,
}: {
  kunci: string;
  saran: { kunci: string; longgar: SaranLonggar | null; terdekat: Terdekat } | null;
  params: CariParams;
  sekarang: Date;
}) {
  const siap = saran?.kunci === kunci;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-biru-100 bg-putih p-6">
        <p className="text-h2 text-arang-900">Nggak ada yang pas.</p>
        {siap && saran?.longgar ? (
          <>
            <p className="text-small text-arang-500">Satu perubahan ini paling banyak membuka pilihan:</p>
            <Link href={hrefCari(saran.longgar.params)} className={buttonClasses({ variant: "primary" })}>
              {saran.longgar.label} ({saran.longgar.jumlah} kos)
            </Link>
          </>
        ) : (
          <>
            <p className="text-small text-arang-500">{siap ? "Filter mana pun yang dilonggarkan belum cukup. Mulai dari awal:" : "Coba longgarkan filter."}</p>
            <Link href={hrefCari(tanpaFilter(params))} className={buttonClasses({ variant: "primary" })}>
              Hapus semua filter
            </Link>
          </>
        )}
      </div>
      {siap && saran && saran.terdekat.hasil.length > 0 && (
        <section aria-labelledby="terdekat-luar">
          <h2 id="terdekat-luar" className="text-body font-bold text-arang-900">
            {saran.terdekat.tanpaFilter ? "Terdekat, tanpa filter" : "Terdekat di luar radius"}
          </h2>
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {saran.terdekat.hasil.map((k) => (
              <li key={k.id}><KosCard kos={k} sekarang={sekarang} /></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
