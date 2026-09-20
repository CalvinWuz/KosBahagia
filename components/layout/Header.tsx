"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useSimpanan } from "@/lib/simpan";
import { Logo } from "@/components/ui/Logo";
import { IconBookmark, IconSearch } from "@/components/ui/Icon";

const PencarianSheet = dynamic(() => import("@/components/cari/PencarianSheet").then((m) => m.PencarianSheet));

// User-surface header: logo, a search entry that opens the search sheet,
// and the saved-items shortcut with a count. Nothing here mentions owners
// or dashboards. On the homepage the hero owns the search box.
export function Header() {
  const pathname = usePathname();
  const cari = pathname !== "/";
  // /cari and /kos/[slug] have their own top bar on mobile; the global
  // header would only eat vertical space there.
  const punyaBarSendiri = pathname.startsWith("/cari") || pathname.startsWith("/kos/");
  const [buka, setBuka] = useState(false);
  const [pernahBuka, setPernahBuka] = useState(false);
  const jumlahSimpan = useSimpanan().length;

  return (
    <header className={cn("sticky top-0 z-40 border-b border-biru-100 bg-putih", punyaBarSendiri && "hidden lg:block")}>
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
            onClick={(e) => {
              // Without JavaScript the link still lands on /cari.
              e.preventDefault();
              setPernahBuka(true);
              setBuka(true);
            }}
            className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-biru-100 bg-kertas-50 px-4 text-left text-small text-arang-500 transition-colors duration-150 ease-out hover:border-biru-500 hover:bg-putih focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
          >
            <IconSearch className="size-5 shrink-0 text-biru-500" />
            <span className="truncate">Cari kos di mana?</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <Link
          href="/disimpan"
          aria-label={jumlahSimpan > 0 ? `Kos yang kamu simpan, ${jumlahSimpan}` : "Kos yang kamu simpan"}
          className="relative grid size-11 shrink-0 place-items-center rounded-full text-biru-600 transition-colors duration-150 ease-out hover:bg-biru-100"
        >
          <IconBookmark className="size-6" />
          {jumlahSimpan > 0 && (
            <span aria-hidden="true" className="absolute top-1 right-1 grid min-w-4.5 place-items-center rounded-full bg-biru-500 px-1 text-[0.625rem] leading-4 font-bold text-putih tabular-nums">
              {jumlahSimpan > 9 ? "9+" : jumlahSimpan}
            </span>
          )}
        </Link>
      </div>

      {pernahBuka && <PencarianSheet open={buka} onClose={() => setBuka(false)} />}
    </header>
  );
}
