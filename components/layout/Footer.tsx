import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { MITRA_URL } from "@/lib/site";

const jelajah = [
  { href: "/cari", label: "Cari kos" },
  { href: "/cara-kami-menilai", label: "Cara kami menilai" },
  { href: "/banding", label: "Bandingkan kos" },
  { href: "/disimpan", label: "Kos tersimpan" },
];

// The single bridge to the mitra surface is the last link in this footer.
export function Footer() {
  return (
    <footer className="border-t border-biru-100 bg-putih">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.5fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 text-biru-500">
            <Logo />
            <span className="text-h2 text-biru-600">Kos Bahagia</span>
          </div>
          <p className="mt-3 text-small text-arang-500">
            Setiap kos di sini sudah kami datangi dan cek langsung. Biaya
            bulanan yang kamu lihat adalah biaya sebenarnya.
          </p>
        </div>

        <nav aria-label="Jelajah">
          <h2 className="text-small font-bold text-arang-900">Jelajah</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {jelajah.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-sm text-small text-arang-500 hover:text-biru-600 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-biru-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-micro text-arang-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kos Bahagia</p>
          <a
            href={MITRA_URL}
            className="rounded-sm font-medium text-arang-500 hover:text-biru-600 hover:underline"
          >
            Punya kos? Gabung jadi mitra
          </a>
        </div>
      </div>
    </footer>
  );
}
