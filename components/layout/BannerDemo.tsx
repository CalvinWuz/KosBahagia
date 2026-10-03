import Link from "next/link";
import { MODE_DEMO } from "@/lib/demo";

// One line above everything while the site runs on sample data. Not sticky:
// it scrolls away with the page and never covers content.
export function BannerDemo() {
  if (!MODE_DEMO) return null;
  return (
    <aside aria-label="Pemberitahuan prototipe" className="border-b border-arang-500/20 bg-arang-900 px-4 py-2 text-center text-small text-putih">
      <b>Prototipe.</b> Semua kos, foto, nomor WhatsApp, dan hasil survei di situs ini adalah data contoh.{" "}
      <Link href="/cara-kami-menilai#data-contoh" prefetch={false} className="font-bold underline underline-offset-2 hover:no-underline focus-visible:outline-putih">
        Tentang data contoh
      </Link>
    </aside>
  );
}
