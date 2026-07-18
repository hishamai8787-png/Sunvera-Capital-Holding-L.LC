"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ page, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="px-3 py-1.5 rounded-md text-sm text-slate-300 hover:text-[#c5a35e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ‹ Prev
      </button>
      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            aria-label="Go to page 1"
            className="px-2.5 py-1.5 rounded-md text-sm text-slate-400 hover:text-[#c5a35e] transition-colors"
          >
            1
          </button>
          {start > 2 && <span className="px-1 text-slate-600">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-label={`Go to page ${p}`}
          aria-current={p === page ? "page" : undefined}
          className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
            p === page
              ? "bg-gradient-to-r from-[#c5a35e] to-[#a8851f] text-[#0a0e1a]"
              : "text-slate-400 hover:text-[#c5a35e]"
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-slate-600">…</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            aria-label={`Go to page ${totalPages}`}
            className="px-2.5 py-1.5 rounded-md text-sm text-slate-400 hover:text-[#c5a35e] transition-colors"
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="px-3 py-1.5 rounded-md text-sm text-slate-300 hover:text-[#c5a35e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next ›
      </button>
    </nav>
  );
}
