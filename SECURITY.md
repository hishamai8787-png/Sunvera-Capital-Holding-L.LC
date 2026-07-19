# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Sunvera Capital, please DO NOT open a public GitHub issue.

Instead, email **security@sunveracapital.com** with:
1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Security Measures

This project implements:
- Row Level Security (RLS) with per-user data isolation via Supabase
- NextAuth.js authentication with bcrypt password hashing
- API rate limiting (configurable via Upstash Redis for production)
- Content Security Policy (CSP) headers
- Input validation on all API routes
- Same-origin API protection via middleware
- Structured error handling (no internal error leakage)
- Sentry error monitoring with PII masking

## Environment Variables

Never commit `.env.local` or any file containing API keys, secrets, or credentials.
Use `.env.example` as a template for required environment variables.

If you believe API keys have been exposed, rotate them immediately at:
- FMP: https://financialmodelingprep.com
- Finnhub: https://finnhub.io
- Supabase: https://supabase.com/dashboard
