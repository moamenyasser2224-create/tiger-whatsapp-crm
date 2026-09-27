/**
 * Input sanitization to prevent XSS (Cross-Site Scripting) attacks
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Strip script tags and content inside
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip style tags and content inside
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip iframe, object, embed
    .replace(/<(iframe|object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
    // Strip dangerous attributes (onload, onerror, onclick, javascript: urls)
    .replace(/\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:[^"'\s>]+/gi, '')
    // Replace raw HTML tag characters with safe entities
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}
