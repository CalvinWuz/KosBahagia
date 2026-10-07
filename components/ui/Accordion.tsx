"use client";

import { useCallback, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useBukaSaatDituju } from "@/lib/bagian";
import { IconChevronDown } from "./Icon";

export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "divide-y divide-biru-100 overflow-hidden rounded-2xl border border-biru-100 bg-putih",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type AccordionItemProps = {
  /** Says what opens, e.g. "Lihat rincian biaya bulanan". */
  title: ReactNode;
  /** One line shown under the title while closed, so the gist is readable without opening. */
  ringkasan?: ReactNode;
  defaultOpen?: boolean;
  /** Anchor id of this item (scroll target for "Lihat rincian…" links). */
  id?: string;
  /** Anchors that open this item (its own id is always one): a section chip, a #hash link. */
  bukaUntuk?: readonly string[];
  children: ReactNode;
};

// Height animates via grid-template-rows (0fr → 1fr), which needs no JS
// measurement. The panel is `inert` while closed so hidden content is
// neither focusable nor read out.
export function AccordionItem({
  title,
  ringkasan,
  defaultOpen = false,
  id: anchor,
  bukaUntuk,
  children,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const buttonId = `${id}-tombol`;
  const panelId = `${id}-panel`;
  const buka = useCallback(() => setOpen(true), []);
  useBukaSaatDituju(anchor ? [anchor, ...(bukaUntuk ?? [])] : bukaUntuk, buka);

  return (
    <div id={anchor} className={anchor ? "scroll-mt-28 lg:scroll-mt-20" : undefined}>
      <h3 className="m-0 text-body font-bold">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-body font-bold text-arang-900 transition-colors duration-150 ease-out hover:bg-kertas-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-biru-500"
        >
          <span className="flex min-w-0 flex-col">
            <span>{title}</span>
            {ringkasan && !open && <span className="text-small font-normal text-arang-500">{ringkasan}</span>}
          </span>
          <IconChevronDown
            className={cn(
              "size-5 shrink-0 text-arang-500 transition-transform duration-200 ease-out",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-4 text-body text-arang-900">{children}</div>
        </div>
      </div>
    </div>
  );
}
