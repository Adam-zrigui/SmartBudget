const SkeletonLine = ({ width = "w-full" }) => (
  <div className={`h-3 ${width} bg-base-300 rounded animate-pulse`} />
);

const SkeletonFormField = ({ label = true }) => (
  <div className="space-y-2">
    {label && <SkeletonLine width="w-32" />}
    <div className="h-10 bg-base-300 rounded-lg animate-pulse" />
  </div>
);

export default function ChangePasswordLoading() {
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
          <div className="ml-auto h-8 w-8 bg-base-300 rounded animate-pulse" />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-gradient-to-br from-base-100 via-base-100 to-base-200">
          <div className="max-w-2xl mx-auto">
            {/* Back button skeleton */}
            <div className="mb-6 h-5 w-24 bg-base-300 rounded animate-pulse" />

            {/* Title skeleton */}
            <div className="mb-8 space-y-2">
              <div className="h-8 w-64 bg-base-300 rounded animate-pulse" />
              <div className="h-4 w-96 bg-base-300 rounded animate-pulse" />
            </div>

            {/* Security info card */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6 mb-8">
              <div className="flex gap-3">
                <div className="w-4 h-4 bg-base-300 rounded mt-1 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <SkeletonLine width="w-48" />
                  <SkeletonLine width="w-96" />
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8 space-y-6">
              {/* Current password */}
              <SkeletonFormField />

              {/* New password */}
              <SkeletonFormField />

              {/* Password requirements checklist */}
              <div className="bg-base-200/30 rounded-lg p-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-4 h-4 bg-base-300 rounded animate-pulse flex-shrink-0" />
                    <SkeletonLine width="w-48" />
                  </div>
                ))}
              </div>

              {/* Confirm password */}
              <SkeletonFormField />

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <div className="h-10 flex-1 bg-base-300 rounded-lg animate-pulse" />
                <div className="h-10 w-24 bg-base-300/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
