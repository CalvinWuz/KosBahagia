// Joins class names, dropping falsy entries. Deliberately tiny — no
// tailwind-merge; callers should not pass conflicting utilities.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
