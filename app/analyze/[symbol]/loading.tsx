import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function AnalyzeLoading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-6" role="status" aria-live="polite">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-3 w-52" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-8 w-28 ml-auto" />
          <Skeleton className="h-3 w-20 ml-auto" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-400 py-1">
        <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-[#c5a35e] rounded-full animate-spin" aria-hidden="true" />
        Pulling statements, computing ratios, writing the analysis…
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-[480px]" />
          <SkeletonCard lines={10} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard lines={8} />
          <SkeletonCard lines={6} />
        </div>
      </div>
    </main>
  );
}
