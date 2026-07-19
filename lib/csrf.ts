/**
 * CSRF (Cross-Site Request Forgery) protection.
 *
 * Implements double-submit cookie pattern:
 * 1. On GET requests, server sets a CSRF token cookie
 * 2. On POST/PUT/DELETE, server compares cookie token with header token
 * 3. If they match, the request is legitimate
 *
 * The token is a random hex string, not derived from session — so it
 * cannot be guessed even if the session is compromised.
 */

import { randomBytes } from "crypto";
import { logger } from "@/lib/logger";

const CSRF_COOKIE_NAME = "sunvera-csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const TOKEN_LENGTH = 32; // 32 bytes = 64 hex chars

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
  return randomBytes(TOKEN_LENGTH).toString("hex");
}

/**
 * Get the CSRF cookie name
 */
export function getCSRFCookieName(): string {
  return CSRF_COOKIE_NAME;
}

/**
 * Get the CSRF header name (for client to send)
 */
export function getCSRFHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Validate CSRF token from request
 * Compares the cookie token with the header token using constant-time comparison
 */
export function validateCSRFToken(cookieToken: string | undefined, headerToken: string | undefined): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  let match = true;
  for (let i = 0; i < cookieToken.length; i++) {
    if (cookieToken[i] !== headerToken[i]) {
      match = false;
    }
  }

  if (!match) {
    logger.warn("csrf", "CSRF token mismatch — possible attack attempt");
  }

  return match;
}

/**
 * Check if a request method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}
