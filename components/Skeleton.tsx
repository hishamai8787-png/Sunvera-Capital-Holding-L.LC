export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/70 ${className}`} />;
}

export function SkeletonCard({ lines = 4, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`card-surface p-6 space-y-3 ${className}`}>
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-2/3"}`} />
      ))}
    </div>
  );
}
