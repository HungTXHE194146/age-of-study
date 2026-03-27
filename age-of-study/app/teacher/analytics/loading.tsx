/**
 * Route-level loading UI for /teacher/analytics
 * Next.js automatically shows this while the page.tsx async component resolves.
 * Prevents blank screen during heavy analytics data fetching.
 */
export default function AnalyticsLoading() {
  return (
    <div className="w-full min-h-screen bg-gray-50 p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 w-56 bg-gray-200 rounded-lg mb-2" />
        <div className="h-4 w-80 bg-gray-200 rounded" />
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
            <div className="h-8 w-16 bg-gray-300 rounded-lg mb-1" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Chart placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="h-5 w-40 bg-gray-200 rounded mb-6" />
        <div className="flex items-end gap-3 h-40">
          {[60, 85, 45, 90, 70, 55, 80, 65, 75, 50].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-gray-200 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="h-5 w-32 bg-gray-200 rounded" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-gray-50"
          >
            <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-36 bg-gray-200 rounded mb-1" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <div className="h-6 w-20 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
