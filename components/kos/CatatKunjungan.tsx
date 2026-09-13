"use client";

import { useEffect } from "react";
import { restInsert } from "@/lib/supabase/rest";

// One row per kos per browser session; feeds the owner's "dilihat bulan ini".
export function CatatKunjungan({ kosId }: { kosId: string }) {
  useEffect(() => {
    const kunci = `kb:kunjungan:${kosId}`;
    try {
      if (sessionStorage.getItem(kunci)) return;
      sessionStorage.setItem(kunci, "1");
    } catch {
      // No storage: still count the view.
    }
    void restInsert("kunjungan_kos", { kos_id: kosId });
  }, [kosId]);
  return null;
}
