/**
 * Sanitize HTML content using a strict allowlist of tags.
 * Strips all attributes for maximum safety.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  // Allowlist of safe formatting tags
  const allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'span', 'div', 'blockquote',
    'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'code', 'pre'
  ];

  // 1. Remove script and style blocks entirely first
  let sanitized = html.replace(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gim, "");

  // 2. Use regex to filter tags and strip attributes
  // Match tags: <(/?) (tagname) (attributes)>
  sanitized = sanitized.replace(/<(\/?)(\w+)([^>]*)>/g, (match, closingSlash, tagName) => {
    const lowerTagName = tagName.toLowerCase();
    if (allowedTags.includes(lowerTagName)) {
      // Return the tag without any attributes
      return `<${closingSlash}${lowerTagName}>`;
    }
    // Return empty string for non-allowed tags (strips them)
    return "";
  });

  // 3. Fallback check for any remaining sensitive characters in a suspicious way
  // (Optional: can add more layers here if needed)

  return sanitized;
}
