/**
 * Request body size limiting — prevents oversized payload attacks.
 *
 * Next.js API routes don't have built-in body size limits by default.
 * This utility enforces a maximum body size on all POST/PUT endpoints.
 */

export const MAX_BODY_SIZE = 1024 * 100; // 100KB default
export const MAX_EXPORT_BODY_SIZE = 1024 * 500; // 500KB for export endpoints
export const MAX_IMPORT_BODY_SIZE = 1024 * 1024; // 1MB for import endpoints

/**
 * Validate that the request body does not exceed the size limit.
 * Returns null if OK, or an error message if too large.
 */
export function validateBodySize(
  contentLength: string | null,
  maxSize: number = MAX_BODY_SIZE
): string | null {
  if (!contentLength) return null; // No Content-Length header — let body parser handle

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return null;

  if (size > maxSize) {
    return `Request body too large (${size} bytes). Maximum allowed: ${maxSize} bytes.`;
  }

  return null;
}
