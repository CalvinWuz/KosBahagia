"use client";

import Image from "next/image";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { IconClose } from "./Icon";

// Full-screen photo. Headless UI supplies the focus trap and Escape.
export function Lightbox({ open, onClose, src, alt, keterangan }: { open: boolean; onClose: () => void; src: string; alt: string; keterangan?: string | null }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-arang-900/90 transition-opacity duration-200 ease-out data-closed:opacity-0" />
      <div className="fixed inset-0 flex flex-col">
        <DialogPanel transition className="flex h-full w-full flex-col transition-opacity duration-200 ease-out data-closed:opacity-0">
          <header className="flex items-center justify-between gap-3 px-4 py-3 text-putih">
            <DialogTitle className="min-w-0 truncate text-small font-bold">{keterangan ?? alt}</DialogTitle>
            <button type="button" onClick={onClose} aria-label="Tutup" className="grid size-10 shrink-0 place-items-center rounded-full text-putih hover:bg-putih/20 focus-visible:outline-putih">
              <IconClose />
            </button>
          </header>
          <div className="relative min-h-0 flex-1">
            <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
