import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="text-slate-100" role="status" aria-live="polite">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
