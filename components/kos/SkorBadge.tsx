import { cn } from "@/lib/cn";
import { formatSkor } from "@/lib/format";

// Skor Bahagia pill. The number is the message; colour only reinforces it.
// null renders "Belum dinilai" — never a guessed number.
export function SkorBadge({
  skor,
  size = "sm",
  className,
}: {
  skor: number | null | undefined;
  size?: "sm" | "lg";
  className?: string;
}) {
  const dinilai = skor != null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg font-bold whitespace-nowrap tabular-nums",
        size === "lg" ? "px-3 py-1.5 text-h2" : "px-2 py-0.5 text-small",
        !dinilai && "bg-arang-500/10 text-arang-500",
        dinilai && skor >= 8 && "bg-daun-100 text-daun-700",
        dinilai && skor < 8 && "bg-biru-100 text-biru-600",
        className,
      )}
      aria-label={dinilai ? `Skor Bahagia ${formatSkor(skor)} dari 10` : "Belum dinilai"}
    >
      {dinilai ? (
        <>
          {formatSkor(skor)}
          <span className={cn("font-medium opacity-80", size === "lg" ? "text-small" : "text-micro")}>/10</span>
        </>
      ) : (
        "Belum dinilai"
      )}
    </span>
  );
}
