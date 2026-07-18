"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const subject = (formData.get("subject") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    const errs: Record<string, string> = {};
    if (!name || name.length < 2) errs.name = "Please enter your name";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Please enter a valid email";
    if (!message || message.length < 10) errs.message = "Message must be at least 10 characters";
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject: subject || "General Inquiry", message }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="text-slate-100">
      <section className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-xs tracking-[0.35em] uppercase text-[#c5a35e] mb-4">Contact</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-4">Get in Touch</h1>
        <p className="text-slate-400 mb-10">
          Questions about our platform, institutional subscriptions, or partnership opportunities?
          Send us a message and we&apos;ll respond within 48 hours.
        </p>

        {status === "success" && (
          <div role="alert" className="mb-6 rounded-lg border border-[#c5a35e]/40 bg-[#c5a35e]/10 px-4 py-3 text-[#e0c887]">
            ✅ Thank you — your message has been sent. We&apos;ll get back to you shortly.
          </div>
        )}

        {status === "error" && (
          <div role="alert" className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-400">
            Something went wrong. Please try again or email us directly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" aria-busy={status === "submitting"}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2 transition-colors"
            />
            {errors.name && <p id="name-error" className="text-sm text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={200}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2 transition-colors"
            />
            {errors.email && <p id="email-error" className="text-sm text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-1.5">
              Subject <span className="text-slate-500">(optional)</span>
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              maxLength={200}
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1.5">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              maxLength={2000}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
              className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-4 py-2.5 text-slate-100 outline-none focus:border-[#c5a35e] focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2 transition-colors resize-y"
            />
            {errors.message && <p id="message-error" className="text-sm text-red-400 mt-1">{errors.message}</p>}
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-lg bg-gradient-to-r from-[#c5a35e] to-[#a8851f] hover:from-[#d4b06e] hover:to-[#b8951f] text-[#0a0e1a] font-semibold px-8 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "submitting" ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>
    </main>
  );
}
