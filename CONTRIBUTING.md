# Contributing to Sunvera Capital

Thank you for your interest in contributing! This is an open-source institutional financial analysis platform, and we welcome contributions of all kinds.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Sunvera-Capital-Holding-L.LC.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and fill in required values
5. Start the dev server: `npm run dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Run E2E tests (if applicable): `npm run test:e2e`
6. Commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code change that neither fixes a bug nor adds a feature
   - `test:` adding or correcting tests
   - `chore:` build process, dependencies, etc.
7. Push to your fork and open a Pull Request

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- All tests must pass (unit + lint, E2E if UI changes)
- No new lint errors or warnings
- No hardcoded secrets or API keys — use environment variables

## Code Standards

- TypeScript strict mode
- ESLint with Next.js recommended rules
- Functional components with hooks (no class components)
- Server Components by default, Client Components only when needed (`"use client"`)
- Accessible markup (ARIA attributes, semantic HTML, keyboard navigation)
- Financial formulas must include inline comments explaining the math

## Testing

- Unit tests: Vitest (`npm test`)
- E2E tests: Playwright (`npm run test:e2e`)
- All new features should include tests
- Aim for meaningful coverage of business logic, not 100% line coverage

## Security

If you discover a security vulnerability, please DO NOT open a public issue.
Email security@sunveracapital.com with details and we'll respond within 48 hours.

## Financial Data Disclaimer

This platform provides analytical tools for educational and professional use.
It is NOT investment advice. Always do your own research and consult licensed
professionals before making investment decisions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
