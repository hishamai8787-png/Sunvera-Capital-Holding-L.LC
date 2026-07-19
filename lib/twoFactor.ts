/**
 * Two-Factor Authentication (2FA) using TOTP.
 *
 * Uses otplib v13 for RFC 6238 compliant TOTP generation/verification.
 * Users scan a QR code with Google Authenticator, Authy, or similar.
 *
 * Required env vars:
 * TOTP_SECRET — Base32 secret for the admin account (generate via generateSecret())
 *
 * Flow:
 * 1. Admin visits /settings → sees 2FA setup with QR code
 * 2. Scans QR with authenticator app
 * 3. Enters 6-digit code to verify
 * 4. Future logins require password + TOTP code
 */

import { TOTP, generateSecret, generateSync, verifySync } from "otplib";
import { logger } from "@/lib/logger";

/**
 * Generate a new TOTP secret (base32 encoded)
 */
export function generateTOTPSecret(): string {
  return generateSecret();
}

/**
 * Generate the OTP auth URI for QR code scanning
 * Format: otpauth://totp/Label?secret=SECRET&issuer=ISSUER
 */
export function generateOTPAuthURI(email: string, secret: string): string {
  const totp = new TOTP();
  return totp.toURI({
    issuer: "Sunvera Capital",
    label: email,
    secret,
  });
}

/**
 * Verify a TOTP token against the secret
 * Returns true if valid, false otherwise
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret });
    return typeof result === "boolean" ? result : (result as { valid: boolean }).valid;
  } catch (err) {
    logger.error("2fa", "TOTP verification failed", { error: String(err) });
    return false;
  }
}

/**
 * Generate the current TOTP token for a secret (used for setup verification)
 */
export function generateCurrentTOTP(secret: string): string {
  return generateSync({ secret });
}

/**
 * Get the TOTP secret from environment (admin account)
 */
export function getTOTPSecret(): string | null {
  const secret = process.env.TOTP_SECRET;
  if (!secret) return null;
  return secret;
}

/**
 * Check if 2FA is enabled for the admin account
 */
export function is2FAEnabled(): boolean {
  return !!process.env.TOTP_SECRET;
}
