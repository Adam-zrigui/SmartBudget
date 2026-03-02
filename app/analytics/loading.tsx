const SkeletonLine = ({ width = "w-full" }) => (
  <div className={`h-3 ${width} bg-base-300 rounded animate-pulse`} />
);

export default function AnalyticsLoading() {
  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <div className="w-64 border-r border-base-200/50">
          <div className="p-6 space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-10 bg-base-300 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="sticky top-0 h-16 bg-base-200/30 border-b border-base-200/30 backdrop-blur-sm flex items-center px-6">
          <div className="h-4 w-48 bg-base-300 rounded animate-pulse" />
          <div className="ml-auto flex gap-2">
            <div className="h-8 w-32 bg-base-300 rounded animate-pulse" />
            <div className="h-8 w-8 bg-base-300 rounded animate-pulse" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-linear-to-br from-base-100 via-base-100 to-base-200">
          <div className="max-w-7xl space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="h-8 w-64 bg-base-300 rounded animate-pulse" />
              <div className="h-4 w-96 bg-base-300 rounded animate-pulse" />
            </div>

            {/* Time period selector */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-24 bg-base-300 rounded-lg animate-pulse" />
              ))}
            </div>

            {/* Main chart */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8">
              <SkeletonLine width="w-48" />
              <div className="h-80 bg-base-300 rounded-lg animate-pulse mt-4" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
                  <SkeletonLine width="w-24" />
                  <div className="h-8 w-32 bg-base-300 rounded animate-pulse mt-2" />
                  <SkeletonLine width="w-20" />
                </div>
              ))}
            </div>

            {/* Additional charts */}
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-base-100 border border-base-200/50 rounded-2xl p-8">
                <SkeletonLine width="w-48" />
                <div className="h-72 bg-base-300 rounded-lg animate-pulse mt-4" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
