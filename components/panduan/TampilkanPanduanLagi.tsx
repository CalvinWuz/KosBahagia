"use client";

import { useState } from "react";
import { tampilkanPanduanLagi } from "@/lib/panduan";

// For someone who closed the short guide and wants it back on the homepage
// and the results page.
export function TampilkanPanduanLagi() {
  const [selesai, setSelesai] = useState(false);
  return (
    <p className="text-small text-arang-500">
      Panduan singkat di beranda sudah kamu tutup?{" "}
      <button
        type="button"
        onClick={() => {
          tampilkanPanduanLagi();
          setSelesai(true);
        }}
        className="sentuh relative rounded-sm font-bold text-biru-600 hover:underline"
      >
        Tampilkan lagi
      </button>
      <span role="status" className="ml-1">{selesai ? "Panduan singkat akan tampil lagi di beranda dan hasil pencarian." : ""}</span>
    </p>
  );
}
