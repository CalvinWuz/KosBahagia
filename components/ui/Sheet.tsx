"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { cn } from "@/lib/cn";
import { useLapisRiwayat } from "@/lib/navigasi";
import { useKembalikanFokus } from "@/lib/fokus";
import { IconClose } from "./Icon";

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Sticky actions row under the scrollable body, e.g. "Lihat 84 kos". */
  footer?: ReactNode;
  /** Full-screen on mobile (search, pickers). Still a side panel on desktop. */
  penuh?: boolean;
  /**
   * Every sheet adds one history entry while open so the phone's back
   * button closes it. A sheet that changes the URL live (filters) passes
   * the current href here so back-close keeps those changes.
   */
  hrefTerakhir?: string;
  /** See useLapisRiwayat: keep the history entry on a button-close. */
  pertahankan?: () => boolean;
  children: ReactNode;
  className?: string;
};

// Bottom sheet below 768px, right-hand side panel above. Headless UI Dialog
// supplies the focus trap, Escape/backdrop close, scroll lock and focus
// restore; everything visible is ours.
export function Sheet({
  open,
  onClose,
  title,
  footer,
  penuh = false,
  hrefTerakhir,
  pertahankan,
  children,
  className,
}: SheetProps) {
  useLapisRiwayat({ open, onClose, hrefTerakhir, pertahankan });
  useKembalikanFokus(open);
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-arang-900/50 transition-opacity duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-end md:items-stretch md:justify-end">
        <DialogPanel
          transition
          className={cn(
            "flex w-full flex-col bg-putih shadow-2xl transition-transform duration-250 ease-out data-closed:translate-y-full",
            penuh ? "h-dvh" : "max-h-[85dvh] rounded-t-2xl",
            "md:h-full md:max-h-none md:w-105 md:max-w-full md:rounded-none md:data-closed:translate-x-full md:data-closed:translate-y-0",
            className,
          )}
        >
          {!penuh && (
            <div
              className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-biru-100 md:hidden"
              aria-hidden="true"
            />
          )}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-biru-100 px-4 py-3">
            <DialogTitle className="text-h2 text-arang-900">{title}</DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={`Tutup ${title.toLowerCase()}`}
              className="grid size-11 shrink-0 place-items-center rounded-full text-arang-500 transition-colors duration-150 ease-out hover:bg-biru-100 hover:text-biru-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500"
            >
              <IconClose />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            {children}
          </div>
          {footer && (
            <div className="shrink-0 border-t border-biru-100 bg-putih px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
