"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Bagian = { id: string; label: string };

/** The section chips: which block is on screen, and jump to any of them. */
export function useBagianAktif(bagian: Bagian[]): string | null {
  const [aktif, setAktif] = useState<string | null>(null);
  useEffect(() => {
    const terlihat = new Map<string, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) terlihat.set(e.target.id, e.boundingClientRect.top);
          else terlihat.delete(e.target.id);
        }
        // The topmost visible block wins.
        let pilih: string | null = null;
        let atas = Number.POSITIVE_INFINITY;
        for (const [id, top] of terlihat) {
          if (top < atas) {
            atas = top;
            pilih = id;
          }
        }
        if (pilih) setAktif(pilih);
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );
    for (const b of bagian) {
      const el = document.getElementById(b.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [bagian]);
  return aktif;
}

// Sticky chip row under the mobile detail header; a plain list in the
// desktop sidebar. Same data, same active state.
export function NavBagian({ bagian, className, tampilan = "chip" }: { bagian: Bagian[]; className?: string; tampilan?: "chip" | "daftar" }) {
  const aktif = useBagianAktif(bagian);
  const rel = useRef<HTMLUListElement>(null);

  // Keep the active chip in view as the page scrolls.
  useEffect(() => {
    if (!aktif || tampilan !== "chip") return;
    const el = rel.current?.querySelector<HTMLElement>(`[data-id="${aktif}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [aktif, tampilan]);

  const lompat = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history.replaceState(window.history.state, "", `#${id}`);
  };

  if (tampilan === "daftar") {
    return (
      <nav aria-label="Bagian halaman" className={className}>
        <ul className="flex flex-col">
          {bagian.map((b) => (
            <li key={b.id}>
              <a
                href={`#${b.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  lompat(b.id);
                }}
                aria-current={aktif === b.id ? "location" : undefined}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-small transition-colors duration-150 ease-out hover:bg-biru-100 hover:text-biru-600",
                  aktif === b.id ? "bg-biru-100 font-bold text-biru-600" : "text-arang-900",
                )}
              >
                {b.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Bagian halaman" className={className}>
      <ul ref={rel} className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {bagian.map((b) => (
          <li key={b.id} data-id={b.id} className="shrink-0">
            <a
              href={`#${b.id}`}
              onClick={(e) => {
                e.preventDefault();
                lompat(b.id);
              }}
              aria-current={aktif === b.id ? "location" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-small whitespace-nowrap transition-colors duration-150 ease-out",
                aktif === b.id ? "border-biru-500 bg-biru-100 font-bold text-biru-600" : "border-arang-500/20 bg-putih text-arang-900",
              )}
            >
              {b.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
