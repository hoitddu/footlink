function Shimmer({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-[#e7ece7] ${className}`} />;
}

function RequestCard() {
  return (
    <div className="surface-card rounded-[1.25rem] px-4 py-3.5">
      <div className="flex items-center justify-between">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-5 w-14" />
      </div>
      <Shimmer className="mt-2.5 h-4 w-40" />
      <Shimmer className="mt-2 h-3.5 w-32" />
    </div>
  );
}

export default function ActivityLoading() {
  return (
    <div className="space-y-3 pb-24">
      {/* Tab bar skeleton */}
      <div className="flex gap-2">
        <Shimmer className="h-9 w-24 rounded-xl" />
        <Shimmer className="h-9 w-24 rounded-xl" />
      </div>

      {/* Cards */}
      <div className="space-y-2">
        <RequestCard />
        <RequestCard />
        <RequestCard />
      </div>
    </div>
  );
}
