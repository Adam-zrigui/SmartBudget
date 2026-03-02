const SkeletonTableRow = () => (
  <div className="grid grid-cols-5 gap-4 p-4 border-b border-base-300/30">
    {[...Array(5)].map((_, i) => (
      <div key={i} className={`h-4 ${i === 0 ? 'w-20' : i === 2 ? 'w-24' : 'w-32'} bg-base-300 rounded animate-pulse`} />
    ))}
  </div>
);

export default function TransactionsLoading() {
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
          <div className="max-w-7xl space-y-6">
            {/* Page title and description */}
            <div className="space-y-2">
              <div className="h-8 w-64 bg-base-300 rounded animate-pulse" />
              <div className="h-4 w-96 bg-base-300 rounded animate-pulse" />
            </div>

            {/* Filters section */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 w-40 bg-base-300 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>

            {/* Transactions table */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-5 gap-4 p-4 border-b-2 border-base-300/50 font-semibold bg-base-200/30">
                {['Date', 'Description', 'Amount', 'Type', 'Status'].map((_, i) => (
                  <div key={i} className="h-4 w-20 bg-base-300 rounded animate-pulse" />
                ))}
              </div>

              {/* Table rows */}
              {[...Array(10)].map((_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-base-300 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
