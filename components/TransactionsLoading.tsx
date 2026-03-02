"use client"

export default function TransactionsLoading() {
  return (
    <div className="flex min-h-screen bg-base-100 text-base-content">
      <div className="hidden lg:flex lg:shrink-0">
        <div className="w-64 bg-base-200 animate-pulse" />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="h-16 bg-base-200 border-b border-base-200/30 animate-pulse" />
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-gradient-to-br from-base-100 via-base-100 to-base-200">
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-base-200 rounded animate-pulse" />
              <div className="h-4 w-96 bg-base-200 rounded animate-pulse" />
            </div>

            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6 flex gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-32 bg-base-200 rounded-lg" />
              ))}
            </div>

            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-base-100 border border-base-200/50 rounded-2xl p-6 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-base-200 rounded" />
                    <div className="h-3 w-48 bg-base-200 rounded" />
                  </div>
                  <div className="h-6 w-24 bg-base-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
