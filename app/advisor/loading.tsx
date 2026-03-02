const SkeletonMessage = ({ isUser = false }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-xs h-12 bg-base-300 rounded-2xl animate-pulse ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
  </div>
);

export default function AdvisorLoading() {
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
          <div className="flex-1">
            <div className="h-4 w-48 bg-base-300 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-base-300 rounded animate-pulse" />
            <div className="h-8 w-8 bg-base-300 rounded animate-pulse" />
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-linear-to-br from-base-100 via-base-100 to-base-200">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="h-8 w-64 bg-base-300 rounded animate-pulse" />
              <div className="h-4 w-96 bg-base-300 rounded animate-pulse" />
            </div>

            {/* Chat interface */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6 h-96 overflow-y-auto">
              <div className="space-y-4 flex flex-col">
                {/* System message */}
                <div className="flex justify-center">
                  <div className="h-3 w-48 bg-base-300 rounded animate-pulse" />
                </div>

                {/* Chat messages */}
                <SkeletonMessage isUser={false} />
                <SkeletonMessage isUser={false} />
                <SkeletonMessage isUser={true} />
                <SkeletonMessage isUser={false} />
                <SkeletonMessage isUser={false} />

                {/* Typing indicator */}
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-base-300 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-base-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-base-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>

            {/* Input section */}
            <div className="bg-base-100 border border-base-200/50 rounded-2xl p-6 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-base-300 rounded-lg animate-pulse" />
                <div className="h-10 w-12 bg-base-300 rounded-lg animate-pulse" />
              </div>

              {/* Quick suggestions */}
              <div className="space-y-2">
                <div className="h-3 w-32 bg-base-300 rounded animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 w-32 bg-base-300 rounded-full animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
