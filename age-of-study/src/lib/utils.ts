/**
 * Utility function to merge Tailwind classes.
 * Simple implementation for basic class merging.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
