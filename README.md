# Sunvera Capital Holding LLC

Institutional equity analysis and credit proposal platform.

## Features

- Company Analysis — Altman Z, Piotroski F, DCF, quality/valuation/growth scoring
- Credit Proposals — Word document generation with pro-forma DSCR
- Opportunity Scanner — Screens 30+ tickers for investment signals
- Portfolio Management — Positions, trades, client mandates
- Market News — Real-time news from Finnhub
- Mandate Evaluation — Financial-sector compliance checks

## Tech Stack

Next.js 15, TypeScript, Tailwind CSS, Supabase, NextAuth.js, FMP API, Finnhub, docx

## Getting Started

1. npm install
2. Copy .env.example to .env.local and fill in values
3. Run supabase_migration.sql in Supabase SQL editor
4. npm run dev
5. Open http://localhost:3000

## Scripts

- npm run dev — Start dev server
- npm run build — Production build
- npm run lint — ESLint
- npm test — Run test suite
- npm run test:watch — Tests in watch mode

## Security

- API middleware with same-origin + Bearer token auth
- Rate limiting (30/min standard, 3/min scanner)
- Input validation on all endpoints
- Security headers (CSP, HSTS, X-Frame-Options)
- Row Level Security on database tables
- NextAuth.js session management

## License

Proprietary — Sunvera Capital Holding LLC
