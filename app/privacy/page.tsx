import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Sunvera Capital Holding LLC — how we collect, use, and protect your data.",
  alternates: { canonical: "https://sunveracapital.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs tracking-[0.35em] uppercase text-[#c5a35e] mb-4">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: July 2026</p>

        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">1. Data We Collect</h2>
            <p className="mb-2">We collect minimal data:</p>
            <p>1. Contact form submissions (name, email, message) — stored to respond to inquiries.</p>
            <p>2. Authentication credentials (email, hashed password) — for account access.</p>
            <p>3. Watchlist and preferences — stored locally in your browser (localStorage), not on our servers.</p>
            <p>4. Usage analytics — aggregate, non-identifying data about page visits and feature usage.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">2. How We Use Your Data</h2>
            <p>We use your data to: provide and improve the Platform, respond to inquiries, and ensure security. We do not sell or share your personal data with third parties.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">3. Data Storage</h2>
            <p>Data is stored in Supabase (PostgreSQL) with row-level security policies. Passwords are hashed using bcrypt. All database access uses publishable keys — the service role key is never exposed in the application.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">4. Third-Party Services</h2>
            <p className="mb-2">The Platform integrates with:</p>
            <p>1. Financial Modeling Prep — market data API</p>
            <p>2. Finnhub — financial news API</p>
            <p>3. TradingView — charting widgets</p>
            <p>4. Sentry — error monitoring (optional, no PII sent)</p>
            <p>These services have their own privacy policies. We send only API keys and ticker symbols — no personal data.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">5. Security</h2>
            <p>We implement security best practices: CSP headers, rate limiting, input validation, sanitized error messages, bcrypt password hashing, and row-level database security. Error monitoring via Sentry captures exceptions without personal data.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">6. Your Rights</h2>
            <p>You may request deletion of your data at any time by contacting us. Your browser-stored preferences (watchlist, currency) can be cleared from your browser settings.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">7. Cookies</h2>
            <p>The Platform uses essential cookies for authentication (NextAuth session token). No tracking or advertising cookies are used.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy at any time. Continued use of the Platform after changes constitutes acceptance.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
