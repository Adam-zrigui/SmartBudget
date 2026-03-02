export default function AnalyticsLoading() {
  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <div className="hidden lg:flex lg:shrink-0">
        <div className="w-64 bg-base-200 animate-pulse" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-16 bg-base-200 border-b border-base-200/30 animate-pulse" />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-gradient-to-br from-base-100 via-base-100 to-base-200">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
              <div className="h-8 w-64 bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-96 bg-base-200 rounded animate-pulse" />
            </div>

            {/* Chart skeleton */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8 h-96 animate-pulse" />

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-base-100 border border-base-200/50 rounded-2xl p-6 h-32 animate-pulse" />
              ))}
            </div>

            {/* Additional charts skeleton */}
            {[1, 2].map((i) => (
              <div key={i} className="bg-base-100 border border-base-200/50 rounded-2xl p-8 h-80 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
