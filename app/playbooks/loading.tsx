import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="text-slate-100" role="status" aria-live="polite">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
