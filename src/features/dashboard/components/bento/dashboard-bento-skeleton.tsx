export function DashboardBentoSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      {/* Greeting + Filter */}
      <div className="col-span-full flex flex-wrap items-center justify-between gap-3">
        <div className="bg-muted h-8 w-52 animate-pulse rounded-lg" />
        <div className="bg-muted h-9 w-36 animate-pulse rounded-full" />
      </div>

      {/* KPI Cards */}
      <div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-[5.5rem] animate-pulse rounded-2xl" />
        ))}
      </div>

      {/* Charts + Activity */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-muted h-[15rem] animate-pulse rounded-2xl" />
      ))}

      {/* Pinned + Projects */}
      <div className="bg-muted h-40 animate-pulse rounded-2xl lg:col-span-2" />
      <div className="bg-muted h-40 animate-pulse rounded-2xl lg:col-span-1" />
    </div>
  );
}
