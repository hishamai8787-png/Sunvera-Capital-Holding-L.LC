# Sunvera Capital Holding LLC

![CI/CD](https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC/actions/workflows/ci.yml/badge.svg)

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
2. Copy `.env.example` to `.env.local` and fill in required values
3. `npm run dev` — development server at localhost:3000
4. `npm run build` — production build
5. `npm test` — unit tests (18 tests)
6. `npm run test:e2e` — Playwright E2E tests (20 tests)

## Testing

- **Unit tests:** 18 tests via Vitest
- **E2E tests:** 20 Playwright tests across 4 suites (home, markets, navigation, accessibility)
- **CI/CD:** GitHub Actions — lint, unit tests, build, and E2E on every push to main

## License

Proprietary — Sunvera Capital Holding LLC
