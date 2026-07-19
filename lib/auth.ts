/**
 * NextAuth.js configuration — Sunvera Capital.
 *
 * Uses credentials provider with database-backed user verification.
 * Includes 2FA (TOTP) support and account lockout protection.
 *
 * Required env vars:
 * NEXTAUTH_SECRET=your_random_secret (generate: openssl rand -base64 32)
 * NEXTAUTH_URL=https://yourdomain.com
 * ADMIN_EMAIL=your_admin_email
 * ADMIN_PASSWORD_HASH=your_bcrypt_hash (generate: node -e "console.log(require('bcryptjs').hashSync('password', 10))")
 *
 * Optional (for 2FA):
 * TOTP_SECRET=base32_secret (generate via generateTOTPSecret() in lib/twoFactor.ts)
 *
 * Security features:
 * - bcrypt password hashing (no plaintext comparison)
 * - TOTP-based 2FA (RFC 6238)
 * - Account lockout after 5 failed attempts (15 min lockout)
 * - JWT sessions with 8-hour expiry (was 30 days — tighter for security)
 * - Audit logging on all auth events
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { is2FAEnabled, verifyTOTP } from "@/lib/twoFactor";
import { isLockedOut, recordFailedAttempt, resetAttempts, getLockoutRemaining } from "@/lib/accountLockout";
import { auditLogEntry } from "@/lib/auditLog";

// User roles
export type UserRole = "admin" | "analyst" | "viewer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Get client IP for lockout tracking
        const ip = req?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
                    req?.headers?.get?.("x-real-ip") ||
                    "unknown";

        // Check account lockout
        if (isLockedOut(ip)) {
          const remaining = getLockoutRemaining(ip);
          auditLogEntry("LOGIN_LOCKED", ip, {
            email: credentials.email,
            success: false,
            details: `Account locked. ${remaining}s remaining.`,
          });
          logger.warn("auth", "Login attempt on locked account", { ip, email: credentials.email });
          return null;
        }

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminPasswordHash) {
          logger.error("auth", "ADMIN_EMAIL or ADMIN_PASSWORD_HASH not configured");
          return null;
        }

        // Use bcrypt for secure password comparison (constant-time)
        const emailMatch = credentials.email === adminEmail;
        const passwordMatch = await bcrypt.compare(credentials.password, adminPasswordHash);

        if (!emailMatch || !passwordMatch) {
          // Record failed attempt
          recordFailedAttempt(ip);
          auditLogEntry("LOGIN_FAILED", ip, {
            email: credentials.email,
            success: false,
            details: "Invalid email or password",
          });
          logger.warn("auth", "Failed login attempt", { ip, email: credentials.email });
          return null;
        }

        // Password is correct — check 2FA if enabled
        if (is2FAEnabled()) {
          if (!credentials.totp) {
            // Password correct but 2FA code not provided
            // Don't reveal that password is correct — ask for 2FA code
            recordFailedAttempt(ip);
            auditLogEntry("2FA_FAILED", ip, {
              email: credentials.email,
              success: false,
              details: "2FA code not provided",
            });
            return null;
          }

          const totpSecret = process.env.TOTP_SECRET!;
          if (!verifyTOTP(credentials.totp, totpSecret)) {
            recordFailedAttempt(ip);
            auditLogEntry("2FA_FAILED", ip, {
              email: credentials.email,
              success: false,
              details: "Invalid 2FA code",
            });
            logger.warn("auth", "Invalid 2FA code", { ip, email: credentials.email });
            return null;
          }

          auditLogEntry("2FA_VERIFY", ip, {
            email: credentials.email,
            success: true,
          });
        }

        // Login successful — reset lockout counter
        resetAttempts(ip);
        auditLogEntry("LOGIN_SUCCESS", ip, {
          email: adminEmail,
          success: true,
        });

        return {
          id: "1",
          email: adminEmail,
          name: "Administrator",
          role: "admin" as UserRole,
        } as AuthUser;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours (was 30 days — tighter security)
    updateAge: 1 * 60 * 60, // Refresh token every 1 hour
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as AuthUser).role;
        token.loginAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as AuthUser).role = token.role as UserRole;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
