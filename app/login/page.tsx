"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needs2FA, setNeeds2FA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      totp: totp || undefined,
      redirect: false,
    });

    if (result?.error) {
      // Check if it's a 2FA requirement (password was correct but TOTP missing/wrong)
      if (result.error.includes("2FA") || result.error.includes("code")) {
        setNeeds2FA(true);
        setError("Enter your 6-digit authenticator code.");
      } else if (result.error.includes("locked") || result.error.includes("Locked")) {
        setError("Account temporarily locked. Try again in 15 minutes.");
      } else {
        setError("Invalid credentials. Please try again.");
      }
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen px-6 bg-[#0a0e1a]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span
            className="inline-flex w-14 h-14 rounded-xl bg-gradient-to-br from-[#c5a35e] to-[#a8851f] items-center justify-center text-[#0a0e1a] font-black text-xl mb-4 gold-glow"
            aria-hidden="true"
          >
            S
          </span>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Sunvera Capital</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to access the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 card-surface p-7" aria-busy={loading}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-[#131826] px-4 py-2.5 text-slate-100 focus:border-[#c5a35e] focus:ring-1 focus:ring-[#c5a35e] outline-none transition-colors"
              placeholder="admin@sunveracapital.com"
              autoComplete="email"
              disabled={needs2FA}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700/80 bg-[#131826] px-4 py-2.5 text-slate-100 focus:border-[#c5a35e] focus:ring-1 focus:ring-[#c5a35e] outline-none transition-colors"
              placeholder="••••••••••••"
              autoComplete="current-password"
              disabled={needs2FA}
            />
          </div>

          {needs2FA && (
            <div>
              <label htmlFor="totp" className="block text-sm font-medium text-slate-300 mb-1.5">
                2FA Code
              </label>
              <input
                id="totp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={totp}
                onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-slate-700/80 bg-[#131826] px-4 py-2.5 text-slate-100 focus:border-[#c5a35e] focus:ring-1 focus:ring-[#c5a35e] outline-none transition-colors text-center text-lg tracking-widest tabular-nums"
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Enter the 6-digit code from your authenticator app.
              </p>
            </div>
          )}

          <div aria-live="polite" role="status">
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] disabled:opacity-50 text-[#0a0e1a] font-semibold px-4 py-2.5 transition-all focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
          >
            {loading ? "Signing in..." : needs2FA ? "Verify & Sign in" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Sunvera Capital Holding LLC · Institutional Research Platform
        </p>
      </div>
    </main>
  );
}
