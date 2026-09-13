"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

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
    void supabaseBrowser().from("kunjungan_kos").insert({ kos_id: kosId }).then(() => undefined);
  }, [kosId]);
  return null;
}
