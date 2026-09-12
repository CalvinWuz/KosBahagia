"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { IconBookmark, IconSearch } from "@/components/ui/Icon";

// User-surface header: logo, a compact search entry that opens /cari, and
// the saved-items shortcut. Nothing here mentions owners or dashboards.
// On the homepage the hero owns the search box, so the entry is hidden there.
export function Header() {
  const cari = usePathname() !== "/";
  return (
    <header className="sticky top-0 z-40 border-b border-biru-100 bg-putih">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          aria-label="Kos Bahagia, ke beranda"
          className="flex shrink-0 items-center gap-2 rounded-lg text-biru-500"
        >
          <Logo />
          <span className={cn("text-h2 text-biru-600", cari && "hidden sm:inline")}>
            Kos Bahagia
          </span>
        </Link>

        {cari ? (
          <Link
            href="/cari"
            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-biru-100 bg-kertas-50 px-4 text-small text-arang-500 transition-colors duration-150 ease-out hover:border-biru-500 hover:bg-putih"
          >
            <IconSearch className="size-5 shrink-0 text-biru-500" />
            <span className="truncate">Cari kos di mana?</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <Link
          href="/disimpan"
          aria-label="Kos yang kamu simpan"
          className="grid size-11 shrink-0 place-items-center rounded-full text-biru-600 transition-colors duration-150 ease-out hover:bg-biru-100"
        >
          <IconBookmark className="size-6" />
        </Link>
      </div>
    </header>
  );
}
