/**
 * Utility function to merge Tailwind classes.
 * Simple implementation for basic class merging.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format date of birth to password string (ddmmyyyy)
 * Supports YYYY-MM-DD, DD/MM/YYYY, and raw digits
 */
export function formatBirthdayToPassword(dob: string | null | undefined): string {
  if (!dob) return "12345678";
  
  // Remove all non-numeric characters
  const digits = dob.replace(/\D/g, '');
  
  // If format is YYYY-MM-DD (Supabase default for DATE)
  if (dob.includes('-')) {
    const parts = dob.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD -> DDMMYYYY
      return `${parts[2].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[0]}`;
    }
  }
  
  // If format is DD/MM/YYYY
  if (dob.includes('/')) {
    const parts = dob.split('/');
    if (parts.length === 3) {
      // DD/MM/YYYY -> DDMMYYYY
      return `${parts[0].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[2]}`;
    }
  }

  // If already 8 digits, handle YYYYMMDD -> DDMMYYYY
  if (digits.length === 8) {
    if (digits.startsWith('20') || digits.startsWith('19')) {
      return digits.substring(6, 8) + digits.substring(4, 6) + digits.substring(0, 4);
    }
    return digits;
  }
  
  return "12345678";
}
