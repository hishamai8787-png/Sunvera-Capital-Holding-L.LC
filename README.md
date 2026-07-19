# Sunvera Capital Holding LLC

![CI/CD](https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC/actions/workflows/ci.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Tests](https://img.shields.io/badge/tests-75%20passing-brightgreen.svg)

Open-source institutional equity analysis and credit proposal platform.

## Features

- *Company Analysis* — Altman Z-Score, Piotroski F-Score, DCF valuation, quality/valuation/growth scoring
- *Credit Proposals* — Word document generation with pro-forma DSCR
- *Opportunity Scanner* — Screens the investable universe for investment signals with reason flags
- *Multi-Asset Markets* — Live quotes for forex, crypto, metals, bonds, and equities
- *Portfolio Management* — Positions, trades, client mandates with per-user data isolation
- *Company Comparison* — Side-by-side analysis of up to 5 companies across 15 financial metrics
- *Historical Charts* — Normalized performance comparison across asset classes
- *Market News* — Real-time financial news from Finnhub
- *Currency Converter* — Live FX conversion with 20+ currencies
- *Mandate Evaluation* — Financial-sector compliance checks for client mandates

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS with institutional design system
- **Database:** Supabase (PostgreSQL with Row Level Security)
- **Auth:** NextAuth.js with bcrypt password hashing
- **Data APIs:** FMP (Financial Modeling Prep), Finnhub, CoinGecko, gold-api.com
- **Testing:** Vitest (75 unit tests), Playwright (20+ E2E tests)
- **CI/CD:** GitHub Actions (lint, test, build, E2E on every push)
- **Monitoring:** Sentry (optional, PII-masked)

## Quick Start

```bash
# Clone
git clone https://github.com/hishamai8787-png/Sunvera-Capital-Holding-L.LC.git
cd Sunvera-Capital-Holding-L.LC

# Install
npm install

# Configure
cp .env.example .env.local
# Fill in required values (see .env.example for details)

# Develop
npm run dev          # http://localhost:3000

# Test
npm test             # 75 unit tests
npm run test:e2e     # 20+ Playwright E2E tests

# Build
npm run build
npm start            # Production server
```

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXTAUTH_SECRET` | Yes | Session secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | App URL (e.g. `http://localhost:3000`) |
| `ADMIN_EMAIL` | Yes | Admin login email |
| `ADMIN_PASSWORD_HASH` | Yes | Bcrypt hash of admin password |
| `NEXT_PUBLIC_SUPABASE_URL` | Recommended | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Recommended | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side admin operations |
| `FMP_API_KEY` | Optional | Premium financial data (free fallbacks included) |
| `FINNHUB_API_KEY` | Optional | Real-time news |
| `SENTRY_DSN` | Optional | Error monitoring |
| `UPSTASH_REDIS_REST_URL` | Optional | Distributed rate limiting |
| `APP_API_TOKEN` | Optional | Bearer token for external API access |

*Without FMP_API_KEY, the app uses free data sources (CoinGecko, gold-api.com, open.er-api.com) for live market data.*

## Database Setup

1. Create a free [Supabase](https://supabase.com) project
2. Run `supabase_migration.sql` in the Supabase SQL editor
3. Set the Supabase env vars in `.env.local`

The app falls back to filesystem storage if Supabase is not configured (development only).

## Testing

- *Unit tests:* 75 tests via Vitest — `npm test`
- *E2E tests:* 20+ Playwright tests (home, markets, navigation, accessibility) — `npm run test:e2e`
- *CI/CD:* GitHub Actions runs lint, unit tests, build, and E2E on every push to main
- *Full suite:* `npm run test:all`

## Project Structure

```
app/                    # Next.js App Router pages + API routes
  api/                  # REST API endpoints
  [page]/               # Route pages (markets, scanner, clients, etc.)
components/              # React components (ScanRunner, TradingViewChart, etc.)
lib/                    # Business logic (analyzer, scanner, auth, db, etc.)
  db.ts                 # Database abstraction (Supabase + filesystem fallback)
  auth.ts               # NextAuth configuration
  scanner.ts            # Opportunity scanner logic
  analyze.ts            # Company analysis engine
  freeDataSources.ts    # Free API fallbacks (crypto, metals, forex)
  rateLimit.ts          # API rate limiting
  siteConfig.ts         # Centralized site configuration
  logger.ts             # Structured logging
  format.ts             # Shared formatting utilities
test/                   # Vitest unit tests
e2e/                    # Playwright E2E tests
supabase_migration.sql  # Database schema + RLS policies
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Development workflow
- Pull request standards
- Code style
- Testing requirements

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security measures.

## Disclaimer

This platform provides analytical tools for educational and professional use.
It is NOT investment advice. Always do your own research and consult licensed
professionals before making investment decisions.

## License

MIT License — see [LICENSE](LICENSE) for full text.

Copyright (c) 2026 Sunvera Capital Holding LLC
