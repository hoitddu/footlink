function LoadingCard() {
  return (
    <div className="surface-card rounded-[1.25rem] px-4 py-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="h-4 w-20 animate-pulse rounded-full bg-[#e7ece7]" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-[#e7ece7]" />
      </div>
      <div className="mt-3 h-5 w-40 animate-pulse rounded-full bg-[#e7ece7]" />
      <div className="mt-3 h-4 w-48 animate-pulse rounded-full bg-[#eef2ee]" />
    </div>
  );
}

export default function AppShellLoading() {
  return (
    <div className="space-y-3 pb-24">
      <section className="surface-card rounded-[1.5rem] p-4">
        <div className="h-5 w-28 animate-pulse rounded-full bg-[#e7ece7]" />
        <div className="mt-3 h-10 w-full animate-pulse rounded-[1rem] bg-[#eef2ee]" />
      </section>

      <div className="space-y-2">
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </div>
    </div>
  );
}
