"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials. Please try again.");
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
          <span className="inline-flex w-14 h-14 rounded-xl bg-gradient-to-br from-[#c5a35e] to-[#a8851f] items-center justify-center text-[#0a0e1a] font-black text-xl mb-4 gold-glow">
            S
          </span>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Sunvera Analyst</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to access the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 card-surface p-7">
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
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] disabled:opacity-50 text-[#0a0e1a] font-semibold px-4 py-2.5 transition-all"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Sunvera Capital Holding LLC · Institutional Research Platform
        </p>
      </div>
    </main>
  );
}
