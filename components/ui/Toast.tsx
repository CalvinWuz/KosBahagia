"use client";

import Link from "next/link";
import { tutupToast, useToast } from "@/lib/toast";
import { IconClose } from "./Icon";

// Bottom-centre toast, one at a time. It stacks above the detail page's chat
// bar and the compare tray (heights from lib/ruang-bawah.ts), so it never
// covers the tray or the "Chat pemilik" button.
export function Toaster() {
  const toasts = useToast();
  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" aria-atomic="true" className="di-atas-tray pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl bg-arang-900 px-4 py-3 text-small text-putih shadow-xl motion-safe:animate-muncul"
        >
          <p className="min-w-0 flex-1">{t.teks}</p>
          {t.aksi && (
            <Link href={t.aksi.href} onClick={() => tutupToast(t.id)} className="sentuh relative shrink-0 rounded-sm font-bold text-biru-100 underline-offset-2 hover:underline">
              {t.aksi.label}
            </Link>
          )}
          <button
            type="button"
            onClick={() => tutupToast(t.id)}
            aria-label="Tutup"
            className="sentuh relative grid size-8 shrink-0 place-items-center rounded-full text-putih/70 hover:bg-putih/10 hover:text-putih"
          >
            <IconClose className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
