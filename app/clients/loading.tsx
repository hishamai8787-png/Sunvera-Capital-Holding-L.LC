import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
