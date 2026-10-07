import Link from "next/link";
import { Bantuan } from "@/components/ui/Bantuan";

// One explanation of every distance on the site, opened from the results
// header and the detail page: straight-line distance to the search point,
// walking minutes recorded by the surveyor, and what the route drawings are.
export function BantuanJarak({ className }: { className?: string }) {
  return (
    <Bantuan label="Cara jarak dihitung" judul="Cara jarak dihitung" className={className}>
      <p>
        <b>Jarak garis lurus.</b> Saat kamu mencari dari kampus, stasiun, atau titik di peta, kartu menulis jarak garis lurus dari
        koordinat kos ke titik itu. Urutan <b>Terdekat</b> memakai jarak yang sama. Ini bukan panjang rute jalan.
      </p>
      <p>
        <b>Menit jalan kaki dan jarak ke patokan.</b> Dicatat surveyor saat survei, dari patokan terdekat (kampus atau stasiun) ke kos.
        Kartu hanya menampilkan menitnya bila patokannya sama dengan tujuan pencarianmu, supaya tidak tertukar dengan tempat lain.
      </p>
      <p>
        <b>Peta di halaman kos.</b> Ilustrasi rute berisi patokan yang dilewati, bukan peta berskala. Di peta asli, garis putus-putus
        hanya arah lurus, bukan rute jalan kaki.
      </p>
      <p>
        Kalau datanya belum ada, kami menulis <b>Belum dicatat</b>, bukan perkiraan.{" "}
        <Link href="/cara-kami-menilai#jarak" className="font-bold text-biru-600 hover:underline">Cara kami menilai</Link>
      </p>
    </Bantuan>
  );
}
