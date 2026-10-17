"use client";

import { useState } from "react";
import { tampilkanPanduanLagi } from "@/lib/panduan";
import { KELOMPOK_PENCARI, lupakanStatus } from "@/lib/tutorial-bagian";

// For someone who closed the short offers and wants them back: every renter
// section offers its tutorial once more. Only the offers; saved kos, the
// compare list, filters and the owner surface are untouched. The "Petunjuk
// bagian ini" buttons work either way.
export function TampilkanPanduanLagi() {
  const [selesai, setSelesai] = useState(false);
  return (
    <p className="text-small text-arang-500">
      Sudah menutup tawaran petunjuknya?{" "}
      <button
        type="button"
        onClick={() => {
          tampilkanPanduanLagi();
          lupakanStatus(KELOMPOK_PENCARI);
          setSelesai(true);
        }}
        className="sentuh relative rounded-sm font-bold text-biru-600 hover:underline"
      >
        Tawarkan lagi
      </button>
      <span role="status" className="ml-1">
        {selesai ? "Petunjuk singkat akan ditawarkan sekali lagi di beranda, Pencarian, halaman kos, Simpanan, dan Bandingkan." : ""}
      </span>
    </p>
  );
}
