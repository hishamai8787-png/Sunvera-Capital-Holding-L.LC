"use client";
import { SITE_URL } from "@/lib/siteConfig";

const SOCIAL_PLATFORMS = [
  {
    name: "X (Twitter)",
    handle: "@SunveraCapital",
    url: "https://twitter.com/SunveraCapital",
    icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.91l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    color: "#000000",
  },
  {
    name: "LinkedIn",
    handle: "Sunvera Capital",
    url: "https://linkedin.com/company/sunvera-capital",
    icon: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z",
    color: "#0A66C2",
  },
  {
    name: "Instagram",
    handle: "@sunveracapital",
    url: "https://instagram.com/sunveracapital",
    icon: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
    color: "#E4405F",
  },
  {
    name: "Facebook",
    handle: "Sunvera Capital",
    url: "https://facebook.com/sunveracapital",
    icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    color: "#1877F2",
  },
  {
    name: "YouTube",
    handle: "Sunvera Capital",
    url: "https://youtube.com/@sunveracapital",
    icon: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    color: "#FF0000",
  },
  {
    name: "Telegram",
    handle: "@sunveracapital",
    url: "https://t.me/sunveracapital",
    icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.49-1.302.48-.428-.008-1.252-.242-1.865-.467-.752-.275-1.348-.42-1.296-.893.027-.237.325-.479.893-.731 3.498-1.525 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z",
    color: "#0088CC",
  },
];

interface SocialLinksProps {
  variant?: "footer" | "contact" | "share";
  shareUrl?: string;
  shareTitle?: string;
}

export default function SocialLinks({ variant = "footer", shareUrl, shareTitle }: SocialLinksProps) {
  if (variant === "share") {
    const url = encodeURIComponent(shareUrl ?? SITE_URL);
    const title = encodeURIComponent(shareTitle ?? "Sunvera Capital — Institutional Research Platform");
    const sharePlatforms = [
      { name: "X", url: `https://twitter.com/intent/tweet?url=${url}&text=${title}`, icon: SOCIAL_PLATFORMS[0].icon },
      { name: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, icon: SOCIAL_PLATFORMS[1].icon },
      { name: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${url}`, icon: SOCIAL_PLATFORMS[3].icon },
      { name: "Telegram", url: `https://t.me/share/url?url=${url}&text=${title}`, icon: SOCIAL_PLATFORMS[5].icon },
    ];

    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 mr-1">Share:</span>
        {sharePlatforms.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Share on ${p.name}`}
            className="w-9 h-9 rounded-lg border border-slate-700 hover:border-[#c5a35e] flex items-center justify-center text-slate-400 hover:text-[#c5a35e] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d={p.icon} />
            </svg>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className={variant === "contact" ? "flex flex-wrap gap-3" : "flex items-center gap-3"}>
      {SOCIAL_PLATFORMS.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Follow Sunvera Capital on ${p.name}`}
          className="group flex items-center gap-2"
        >
          <span
            className="w-9 h-9 rounded-lg border border-slate-700 group-hover:border-[#c5a35e]/50 flex items-center justify-center text-slate-400 group-hover:text-[#c5a35e] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d={p.icon} />
            </svg>
          </span>
          {variant === "contact" && (
            <span className="text-sm text-slate-300 group-hover:text-[#c5a35e] transition-colors">
              {p.handle}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}
