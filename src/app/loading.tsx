export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse py-4">
      {/* Top Banner Skeleton */}
      <div className="h-44 sm:h-56 bg-slate-200/70 rounded-3xl w-full" />

      {/* Categories Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-slate-200/60 rounded-2xl" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-slate-100 rounded-2xl" />
          <div className="h-32 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
