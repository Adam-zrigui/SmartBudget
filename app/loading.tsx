// app/loading.tsx
// Loading skeleton for dashboard page while transactions fetch

const SkeletonCard = () => (
  <div className="bg-base-200 rounded-lg p-4 space-y-2">
    <div className="h-4 w-20 bg-base-300 rounded animate-pulse" />
    <div className="h-8 w-32 bg-base-300 rounded animate-pulse" />
  </div>
);

const SkeletonRow = () => (
  <div className="grid grid-cols-5 gap-4 p-4 border-b border-base-300/50">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-4 bg-base-300 rounded animate-pulse" />
    ))}
  </div>
);

export default function Loading() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-40 glass bg-base-100/80 border-b border-base-200/50 backdrop-blur-md h-16 flex items-center px-6">
        <div className="flex-1 flex items-center gap-4">
          <div className="w-24 h-4 bg-base-300 rounded animate-pulse" />
          <div className="w-40 h-3 bg-base-300 rounded animate-pulse hidden sm:block" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-base-300 rounded-lg animate-pulse" />
          <div className="w-10 h-10 bg-base-300 rounded-lg animate-pulse" />
          <div className="w-10 h-10 bg-base-300 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-base-300 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 border-r border-base-200/50 bg-base-100">
          <div className="p-6 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-base-300 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 space-y-6">
          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-8 w-48 bg-base-300 rounded animate-pulse" />
            <div className="h-4 w-96 bg-base-300 rounded animate-pulse" />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          {/* Transactions table */}
          <div className="bg-base-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-base-300 font-semibold">
              {['Date', 'Description', 'Amount', 'Type', 'Category'].map((_, i) => (
                <div key={i} className="h-4 w-16 bg-base-300 rounded animate-pulse" />
              ))}
            </div>
            {[...Array(8)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>

          {/* Chart section */}
          <div className="bg-base-200 rounded-lg p-6 space-y-3">
            <div className="h-6 w-32 bg-base-300 rounded animate-pulse" />
            <div className="h-64 bg-base-300 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative">
          <div className="w-16 h-16 bg-primary rounded-full animate-pulse shadow-lg" />
        </div>
      </div>
    </div>
  )
}

