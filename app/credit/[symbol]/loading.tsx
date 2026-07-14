import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function CreditLoading() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-96" />
          <Skeleton className="h-3 w-60" />
        </div>
        <Skeleton className="h-16 w-40" />
      </div>
      <Skeleton className="h-20" />
      <div className="flex items-center gap-2 text-sm text-slate-500 py-1">
        <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-amber-400 rounded-full animate-spin" />
        Assessing leverage, coverage, and peers — drafting the proposal…
      </div>
      <div className="grid lg:grid-cols-5 gap-6">
        <SkeletonCard lines={14} className="lg:col-span-3" />
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard lines={8} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    </main>
  );
}
