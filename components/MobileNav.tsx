"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/markets", icon: "📊", label: "Markets" },
  { href: "/compare", icon: "⚖️", label: "Compare" },
  { href: "/forex", icon: "💱", label: "Forex" },
  { href: "/crypto", icon: "₿", label: "Crypto" },
  { href: "/metals", icon: "🥇", label: "Metals" },
  { href: "/bonds", icon: "📜", label: "Bonds" },
  { href: "/playbooks", icon: "📒", label: "Playbooks" },
  { href: "/clients", icon: "👥", label: "Clients" },
  { href: "/scanner", icon: "🔎", label: "Scanner" },
  { href: "/global", icon: "🌍", label: "Global" },
  { href: "/about", icon: "ℹ️", label: "About" },
  { href: "/contact", icon: "✉️", label: "Contact" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);

  // Close menu on route change
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    if (open) setOpen(false);
  }

  // Lock body scroll when menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen(!open)}
        className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[#1a2030]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2"
      >
        <span className={`block w-5 h-0.5 bg-slate-300 transition-transform ${open ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`block w-5 h-0.5 bg-slate-300 transition-opacity ${open ? "opacity-0" : ""}`} />
        <span className={`block w-5 h-0.5 bg-slate-300 transition-transform ${open ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 top-14 bg-[#0a0e1a]/95 backdrop-blur-sm overflow-y-auto" id="mobile-nav">
          <nav className="flex flex-col p-6 gap-2" aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-colors focus-visible:outline-2 focus-visible:outline-[#c5a35e] focus-visible:outline-offset-2 ${
                    active
                      ? "bg-[#c5a35e]/10 text-[#e0c887] border border-[#c5a35e]/30"
                      : "text-slate-300 hover:bg-[#1a2030]/60 hover:text-[#e0c887] border border-transparent"
                  }`}
                >
                  <span aria-hidden="true">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link href="/terms" className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
