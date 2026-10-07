"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import { IconInfo } from "./Icon";

const Sheet = dynamic(() => import("./Sheet").then((m) => m.Sheet));

// The second layer of an explanation: a short line sits next to the number,
// and this button opens the detail in a sheet. A sheet, not a tooltip, so it
// works with a thumb and a keyboard; Escape, the close button and the phone's
// back button close it, and focus returns to this button.
export function Bantuan({
  label,
  judul,
  children,
  className,
}: {
  /** Visible button text, e.g. "Arti skor". */
  label: string;
  /** Sheet title. */
  judul: string;
  children: ReactNode;
  className?: string;
}) {
  const [buka, setBuka] = useState(false);
  const [pernahBuka, setPernahBuka] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setPernahBuka(true);
          setBuka(true);
        }}
        className={cn(
          "sentuh relative inline-flex items-center gap-1 rounded-sm text-small font-bold text-biru-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-biru-500",
          className,
        )}
      >
        <IconInfo className="size-4 shrink-0" />
        {label}
      </button>
      {pernahBuka && (
        <Sheet open={buka} onClose={() => setBuka(false)} title={judul}>
          <div className="flex flex-col gap-4 text-small text-arang-900">{children}</div>
        </Sheet>
      )}
    </>
  );
}
