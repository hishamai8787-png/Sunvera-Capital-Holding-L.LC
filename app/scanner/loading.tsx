import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="text-slate-100" role="status" aria-live="polite">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
