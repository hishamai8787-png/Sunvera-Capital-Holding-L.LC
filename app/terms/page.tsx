import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Sunvera Capital Holding LLC — usage terms, limitations, and disclaimers.",
  alternates: { canonical: "https://sunveracapital.com/terms" },
};

export default function TermsPage() {
  return (
    <main className="text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs tracking-[0.35em] uppercase text-[#c5a35e] mb-4">Legal</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-8">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: July 2026</p>

        <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing and using Sunvera Capital (&quot;the Platform&quot;), you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">2. Not Investment Advice</h2>
            <p>The Platform provides analytical tools and data for informational purposes only. All content is research material — not investment advice, a recommendation to buy or sell securities, or an offer to transact. Sunvera Capital Holding LLC is not a registered investment advisor. You are solely responsible for your investment decisions.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">3. Data Accuracy</h2>
            <p>Financial data is sourced from third-party providers (Financial Modeling Prep, Finnhub, TradingView). While we strive for accuracy, we do not guarantee the completeness, timeliness, or accuracy of any data. Always verify critical data from primary sources before making decisions.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">4. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">5. Acceptable Use</h2>
            <p>You agree not to: (a) abuse, overload, or interfere with the Platform&apos;s servers; (b) attempt to reverse-engineer or extract source code; (c) use the Platform for any illegal or unauthorized purpose; (d) scrape or automate data extraction beyond the Platform&apos;s provided APIs.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">6. Limitation of Liability</h2>
            <p>Sunvera Capital Holding LLC shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to financial losses from investment decisions based on Platform data.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">7. Changes to Terms</h2>
            <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">8. Contact</h2>
            <p>Questions about these Terms? Contact us through our contact page.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
