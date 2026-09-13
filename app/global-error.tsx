"use client";

import "./globals.css";
import { LaporGalat } from "@/components/ui/LaporGalat";

// Last-resort 500 when a root layout itself fails; must render html/body.
export default function GalatGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="id">
      <body>
        <LaporGalat error={error} reset={reset} />
      </body>
    </html>
  );
}
