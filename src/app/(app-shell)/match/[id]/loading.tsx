function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-[#e7ece7] ${className}`} />;
}

export default function MatchDetailLoading() {
  return (
    <div className="space-y-3 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-[#eef2ee]" />
        <Shimmer className="h-6 w-16" />
      </div>

      {/* Title + meta */}
      <div>
        <Shimmer className="h-6 w-48" />
        <Shimmer className="mt-2 h-4 w-64" />
      </div>

      {/* Info rows */}
      <div className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Shimmer className="h-3.5 w-3.5 shrink-0 rounded" />
              <Shimmer className="h-3.5 w-14" />
              <Shimmer className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="flex items-start gap-2.5">
          <Shimmer className="mt-0.5 h-4 w-4 shrink-0 rounded" />
          <div>
            <Shimmer className="h-4 w-40" />
            <Shimmer className="mt-1.5 h-3.5 w-20" />
          </div>
        </div>
        <Shimmer className="mt-2.5 h-3.5 w-36" />
      </div>

      {/* Host */}
      <div className="surface-card rounded-[1.25rem] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 animate-pulse rounded-full bg-[#eef2ee]" />
          <div>
            <Shimmer className="h-4 w-24" />
            <Shimmer className="mt-1 h-3 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
