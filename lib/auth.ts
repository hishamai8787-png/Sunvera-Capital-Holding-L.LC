/**
 * NextAuth.js configuration — Sunvera Capital.
 *
 * Uses credentials provider with database-backed user verification.
 * To enable: install next-auth and set NEXTAUTH_SECRET env var.
 *
 * Required env vars:
 * NEXTAUTH_SECRET=your_random_secret (generate: openssl rand -base64 32)
 * NEXTAUTH_URL=https://yourdomain.com
 * ADMIN_EMAIL=your_admin_email
 * ADMIN_PASSWORD_HASH=your_bcrypt_hash (generate: node -e "console.log(require('bcryptjs').hashSync('password', 10))")
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !adminPasswordHash) {
          logger.error("auth", "ADMIN_EMAIL or ADMIN_PASSWORD_HASH not configured");
          return null;
        }

        // Use bcrypt for secure password comparison
        const emailMatch = credentials.email === adminEmail;
        const passwordMatch = await bcrypt.compare(credentials.password, adminPasswordHash);

        if (emailMatch && passwordMatch) {
          return {
            id: "1",
            email: adminEmail,
            name: "Administrator",
            role: "admin" as UserRole,
          } as AuthUser;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as AuthUser).role;
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
