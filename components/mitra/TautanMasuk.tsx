"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The "Masuk" link in the mitra header, hidden on the sign-in page itself.
export function TautanMasuk({ href }: { href: string }) {
  const pathname = usePathname();
  if (pathname.endsWith("/masuk")) return null;
  return (
    <Link href={href} className="h-10 rounded-lg px-3 text-small leading-10 font-bold text-biru-600 hover:bg-kertas-50">
      Masuk
    </Link>
  );
}
