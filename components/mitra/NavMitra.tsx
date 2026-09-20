import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { keluar } from "@/lib/mitra/aksi";
import { TautanMasuk } from "./TautanMasuk";

const MENU = [
  { href: "/dashboard", label: "Ringkasan" },
  { href: "/dashboard/ketersediaan", label: "Ketersediaan" },
  { href: "/dashboard/statistik", label: "Statistik" },
  { href: "/dashboard/paket", label: "Paket" },
];

// Calm, dense, utilitarian. No illustration. Big enough for a thumb at 200 %.
export function NavMitra({ dasar, masuk, nama }: { dasar: string; masuk: boolean; nama?: string | null }) {
  return (
    <header className="border-b border-arang-500/20 bg-putih">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <Link href={`${dasar}/`} aria-label="Kos Bahagia Mitra, ke halaman depan" className="flex items-center gap-2 rounded-sm text-arang-900">
          <Logo className="size-6" />
          <span className="text-small font-bold">Kos Bahagia</span>
          <span className="text-small text-arang-500">Mitra</span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          {masuk ? (
            <>
              {nama && <span className="hidden text-small text-arang-500 sm:inline">{nama}</span>}
              <form action={keluar}>
                <button type="submit" className="h-10 rounded-lg px-3 text-small font-bold text-arang-900 hover:bg-kertas-50">
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <TautanMasuk href={`${dasar}/masuk`} />
          )}
        </div>
      </div>
      {masuk && (
        <nav aria-label="Menu dashboard" className="border-t border-arang-500/10 bg-putih">
          <ul className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MENU.map((m) => (
              <li key={m.href} className="shrink-0">
                <Link href={`${dasar}${m.href}`} className="block px-3 py-3 text-small font-bold text-arang-900 hover:text-biru-600">
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
