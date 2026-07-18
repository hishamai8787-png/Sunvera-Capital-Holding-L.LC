export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]" role="status" aria-live="polite">
      <div className="inline-block w-8 h-8 border-2 border-[#c5a35e] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
