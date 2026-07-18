import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="text-slate-100" role="status" aria-live="polite">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-4 w-full mb-6" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>
    </main>
  );
}
