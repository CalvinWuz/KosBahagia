"use client";

import { useEffect, useRef } from "react";

// Focus return for dialogs. Headless UI restores focus on close, but our
// dialogs also pop a history entry (phone back button), and the re-render
// that follows can leave focus on <body> — a keyboard user then starts over
// at the top of the page. This remembers the last element focused outside
// any dialog and puts focus back on it when the dialog closes, unless focus
// already landed somewhere sensible.

let terakhirDiLuar: HTMLElement | null = null;
const diLuarDialog = (el: Element | null): el is HTMLElement => el instanceof HTMLElement && el !== document.body && !el.closest('[role="dialog"]');

// Installed from the root layout (lib/navigasi imports this module), so it
// is already listening when the opener gets focus. Loading it together with
// the dialog is too late: by then the opener has lost focus (the dialog makes
// the page inert), and the first open of every sheet would land on <body>.
// Pointer presses count too, because Safari does not focus a clicked button.
if (typeof document !== "undefined") {
  if (diLuarDialog(document.activeElement)) terakhirDiLuar = document.activeElement;
  document.addEventListener(
    "focusin",
    (e) => {
      const el = e.target as Element | null;
      if (diLuarDialog(el)) terakhirDiLuar = el;
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
    (e) => {
      const el = (e.target as Element | null)?.closest?.('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? null;
      if (diLuarDialog(el)) terakhirDiLuar = el;
    },
    true,
  );
}

export function useKembalikanFokus(open: boolean) {
  const pemicu = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open) {
      pemicu.current = terakhirDiLuar;
      return;
    }
    const el = pemicu.current;
    if (!el) return;
    // After the leave transition and the history pop have settled.
    const t = window.setTimeout(() => {
      const aktif = document.activeElement;
      if ((!aktif || aktif === document.body) && el.isConnected) el.focus({ preventScroll: true });
    }, 350);
    return () => window.clearTimeout(t);
  }, [open]);
}
