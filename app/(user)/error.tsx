"use client";

import { LaporGalat } from "@/components/ui/LaporGalat";

export default function Galat({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <LaporGalat error={error} reset={reset} />;
}
