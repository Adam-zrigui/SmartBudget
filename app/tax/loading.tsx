const SkeletonLine = ({ width = "w-full" }) => (
  <div className={`h-3 ${width} bg-base-300 rounded animate-pulse`} />
);

const SkeletonFormField = () => (
  <div className="space-y-2">
    <SkeletonLine width="w-32" />
    <div className="h-10 bg-base-300 rounded-lg animate-pulse" />
  </div>
);

export default function TaxLoading() {
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
            <div className="h-8 w-24 bg-base-300 rounded animate-pulse" />
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

            {/* Tax calculator form */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <SkeletonFormField key={i} />
                ))}
              </div>

              {/* Calculate button */}
              <div className="flex gap-3">
                <div className="h-10 w-32 bg-base-300 rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-base-300/50 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Tax results section */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-8">
              <SkeletonLine width="w-40" />
              <div className="mt-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-base-300/30">
                    <SkeletonLine width="w-40" />
                    <SkeletonLine width="w-24" />
                  </div>
                ))}
              </div>
            </div>

            {/* Export section */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
              <SkeletonLine width="w-32" />
              <div className="flex gap-2 mt-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-9 w-24 bg-base-300 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
