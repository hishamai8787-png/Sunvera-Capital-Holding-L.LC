/**
 * NextAuth.js configuration — Sunvera Capital.
 * 
 * Uses credentials provider with database-backed user verification.
 * To enable: install next-auth and set NEXTAUTH_SECRET env var.
 * 
 * npm install next-auth
 * 
 * Required env vars:
 * NEXTAUTH_SECRET=your_random_secret (generate: openssl rand -base64 32)
 * NEXTAUTH_URL=https://yourdomain.com
 * NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 * SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// User roles
export type UserRole = "admin" | "analyst" | "viewer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// For now, this is a placeholder config. When next-auth is installed,
// import this in your route handler at /api/auth/[...nextauth]/route.ts
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

        // TODO: Verify against Supabase users table
        // For now, single admin account via env vars
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (
          credentials.email === adminEmail &&
          credentials.password === adminPassword
        ) {
          return {
            id: "1",
            email: adminEmail!,
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
