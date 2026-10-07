import { cn } from "@/lib/cn";
import { formatSkor } from "@/lib/format";

// Skor Bahagia pill. The number is the message; colour only reinforces it.
// null renders "Belum dinilai" — never a guessed number. `label` spells out
// which score it is where the badge stands alone (card photos), so /10 is
// never confused with the /5 rubric scores next to it.
export function SkorBadge({
  skor,
  size = "sm",
  label = false,
  className,
}: {
  skor: number | null | undefined;
  size?: "sm" | "lg";
  label?: boolean;
  className?: string;
}) {
  const dinilai = skor != null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg font-bold tabular-nums",
        // The labelled badge sits on a photo: let it wrap rather than be cut off with enlarged text.
        label ? "flex-wrap" : "whitespace-nowrap",
        size === "lg" ? "px-3 py-1.5 text-h2" : "px-2 py-0.5 text-small",
        !dinilai && "bg-arang-500/10 text-arang-500",
        dinilai && skor >= 8 && "bg-daun-100 text-daun-700",
        dinilai && skor < 8 && "bg-biru-100 text-biru-600",
        className,
      )}
      aria-label={dinilai ? `Skor Bahagia ${formatSkor(skor)} dari 10` : "Skor Bahagia belum dinilai"}
    >
      {dinilai ? (
        <>
          {label && <span className={cn("mr-0.5 font-medium", size === "lg" ? "text-small" : "text-micro")}>Skor Bahagia</span>}
          {formatSkor(skor)}
          <span className={cn("font-medium", size === "lg" ? "text-small" : "text-micro")}>/10</span>
        </>
      ) : label ? (
        "Skor Bahagia belum dinilai"
      ) : (
        "Belum dinilai"
      )}
    </span>
  );
}
