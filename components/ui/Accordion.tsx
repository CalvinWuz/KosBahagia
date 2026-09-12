"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
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
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
};

// Height animates via grid-template-rows (0fr → 1fr), which needs no JS
// measurement. The panel is `inert` while closed so hidden content is
// neither focusable nor read out.
export function AccordionItem({
  title,
  defaultOpen = false,
  children,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const buttonId = `${id}-tombol`;
  const panelId = `${id}-panel`;

  return (
    <div>
      <h3 className="m-0 text-body font-bold">
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-body font-bold text-arang-900 transition-colors duration-150 ease-out hover:bg-kertas-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-biru-500"
        >
          <span>{title}</span>
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
