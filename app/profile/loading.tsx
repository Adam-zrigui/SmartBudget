const SkeletonLine = ({ width = "w-full" }) => (
  <div className={`h-3 ${width} bg-base-300 rounded animate-pulse`} />
);

const SkeletonCard = ({ lines = 3, height = "h-32" }) => (
  <div className={`bg-base-100 border border-base-200/50 rounded-2xl p-6 ${height}`}>
    <div className="space-y-2 h-full flex flex-col justify-center">
      {[...Array(lines)].map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "w-1/2" : i === lines - 1 ? "w-3/4" : "w-full"} />
      ))}
    </div>
  </div>
);

export default function ProfileLoading() {
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
          <div className="flex-1 flex gap-4">
            <div className="h-4 w-32 bg-base-300 rounded animate-pulse" />
            <div className="h-4 w-24 bg-base-300 rounded animate-pulse hidden sm:block" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-base-300 rounded animate-pulse" />
            <div className="h-8 w-8 bg-base-300 rounded animate-pulse" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-gradient-to-br from-base-100 via-base-100 to-base-200">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Profile header */}
            <div className="bg-gradient-to-r from-base-100 to-base-200/50 rounded-3xl p-8 border border-base-200/50">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-base-300 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-48 bg-base-300 rounded animate-pulse" />
                    <div className="h-4 w-96 bg-base-300 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} lines={2} height="h-28" />
              ))}
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sidebar cards */}
              <aside className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <SkeletonCard key={i} lines={4} height="h-48" />
                ))}
              </aside>

              {/* Main content cards */}
              <div className="lg:col-span-2 space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-base-100 border border-base-200/50 rounded-2xl p-8">
                    <div className="space-y-4">
                      <div className="h-6 w-48 bg-base-300 rounded animate-pulse" />
                      <div className="space-y-3">
                        {[...Array(4)].map((_, j) => (
                          <SkeletonLine key={j} width={j % 2 === 0 ? "w-full" : "w-4/5"} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
