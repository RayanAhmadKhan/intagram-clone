

export const SkeletonLine = ({ className = "" }) => (
  <div className={`animate-pulse rounded bg-gray-200 ${className}`} />
);

export const SkeletonCircle = ({ size = "h-10 w-10" }) => (
  <div className={`animate-pulse rounded-full bg-gray-200 ${size}`} />
);

export const SkeletonPostCard = () => (
  <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
    <div className="flex items-center gap-2 px-4 py-3">
      <SkeletonCircle size="h-8 w-8" />
      <SkeletonLine className="h-3 w-24" />
    </div>
    <div className="aspect-square w-full animate-pulse bg-gray-200" />
    <div className="space-y-2 px-4 py-3">
      <SkeletonLine className="h-4 w-20" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  </div>
);

// One fake row for a list of people (follow requests, comments, etc.)
export const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-1 py-3">
    <SkeletonCircle size="h-10 w-10" />
    <div className="flex-1 space-y-2">
      <SkeletonLine className="h-3 w-32" />
      <SkeletonLine className="h-3 w-20" />
    </div>
  </div>
);

// Fake profile header — avatar + name/stats block
export const SkeletonProfileHeader = () => (
  <div className="rounded-xl border bg-white p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <SkeletonCircle size="h-20 w-20" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-3 w-24" />
      </div>
    </div>
    <div className="mt-4 flex gap-6">
      <SkeletonLine className="h-3 w-16" />
      <SkeletonLine className="h-3 w-16" />
    </div>
  </div>
);
