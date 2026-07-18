import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="text-slate-100" role="status" aria-live="polite">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
        <div className="grid lg:grid-cols-5 gap-6">
          <Skeleton className="lg:col-span-2 h-[560px] rounded-xl" />
          <Skeleton className="lg:col-span-3 h-[560px] rounded-xl" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    </main>
  );
}
