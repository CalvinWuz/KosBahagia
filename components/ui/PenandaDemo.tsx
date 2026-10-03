import { MODE_DEMO, TEKS_DEMO } from "@/lib/demo";
import { cn } from "@/lib/cn";

// "Data contoh" marker for places where trust is at stake (survey numbers,
// surveyor notes, the hero example). Renders nothing outside the prototype.
export function PenandaDemo({ className, teks = TEKS_DEMO.label }: { className?: string; teks?: string }) {
  if (!MODE_DEMO) return null;
  return (
    <span className={cn("inline-flex items-center rounded-full border border-arang-500/30 bg-putih px-2 py-0.5 text-micro font-bold text-arang-900", className)}>
      {teks}
    </span>
  );
}
