"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";

// Page-to-page motion. Next.js navigations are React transitions, so a
// <ViewTransition> around the page content animates them through the
// browser's View Transitions API (no library, no timers that hold the
// navigation back). Keyed by pathname: a new path is an exit + enter pair
// (a short crossfade, CSS in app/globals.css), while a query change on the
// same path (filters, sort, page, map/list, ?kamar=) is an in-place update
// with update="none", so the results never blink while filtering.
//
// Links that go deeper (a kos card, a preset) pass transitionTypes={["maju"]}
// and get a 6 px rise on top of the fade; anything without a known
// direction, including the browser's back button, is a plain crossfade.
// The header, banner and footer sit outside this boundary and do not move.
// Browsers without the API navigate normally, without animation.
export function TransisiHalaman({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition
      key={pathname}
      enter={{ maju: "halaman-maju", default: "halaman-masuk" }}
      exit={{ default: "halaman-keluar" }}
      update="none"
      default="none"
    >
      <div>{children}</div>
    </ViewTransition>
  );
}
