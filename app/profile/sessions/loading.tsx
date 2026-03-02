const SkeletonLine = ({ width = "w-full" }) => (
  <div className={`h-3 ${width} bg-base-300 rounded animate-pulse`} />
);

const SessionSkeleton = ({ isCurrent = false }) => (
  <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6 space-y-4">
    <div className="flex justify-between items-start">
      <div className="flex-1 space-y-3">
        {/* Device info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-base-300 rounded animate-pulse" />
          <SkeletonLine width="w-48" />
        </div>

        {/* IP and location */}
        <SkeletonLine width="w-64" />

        {/* Last active */}
        <SkeletonLine width="w-40" />

        {/* Browser and OS */}
        <SkeletonLine width="w-96" />
      </div>

      {/* Action button */}
      <div className="h-9 w-28 bg-base-300 rounded-lg animate-pulse" />
    </div>

    {/* Current badge */}
    {isCurrent && (
      <div className="flex items-center gap-2 pt-2 border-t border-base-300/30">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <SkeletonLine width="w-20" />
      </div>
    )}
  </div>
);

export default function SessionsLoading() {
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
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-gradient-to-br from-base-100 via-base-100 to-base-200">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="h-8 w-64 bg-base-300 rounded animate-pulse" />
              <div className="h-4 w-96 bg-base-300 rounded animate-pulse" />
            </div>

            {/* Active session (current device) */}
            <div>
              <div className="h-6 mb-4 w-32 bg-base-300 rounded animate-pulse" />
              <SessionSkeleton isCurrent={true} />
            </div>

            {/* Other sessions */}
            <div>
              <div className="h-6 mb-4 w-32 bg-base-300 rounded animate-pulse" />
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <SessionSkeleton key={i} isCurrent={false} />
                ))}
              </div>
            </div>

            {/* Danger zone - Sign out all */}
            <div className="bg-error/10 border border-error/30 rounded-2xl p-6 mt-8">
              <div className="space-y-3">
                <SkeletonLine width="w-48" />
                <SkeletonLine width="w-96" />
                <div className="h-10 w-40 bg-error/30 rounded-lg animate-pulse mt-4" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
