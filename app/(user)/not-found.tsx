import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";

// Rendered for notFound() calls on the renter surface (unknown kos, area).
export default function TidakDitemukan() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-h1 text-arang-900">Halaman ini tidak ada</h1>
      <p className="text-body text-arang-500">
        Mungkin kosnya sudah tidak tayang, atau tautannya salah ketik.
      </p>
      <Link href="/cari" className={buttonClasses({ variant: "primary" })}>
        Cari kos lain
      </Link>
      <Link href="/" className="text-small font-bold text-biru-600 hover:underline">
        Ke beranda
      </Link>
    </div>
  );
}
