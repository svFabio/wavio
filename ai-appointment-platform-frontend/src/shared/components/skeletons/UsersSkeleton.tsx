export const UsersSkeleton = (): JSX.Element => (
  <div>
    {/* Desktop skeleton */}
    <div className="hidden md:block card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="skeleton h-5 w-48 rounded" />
            <div className="skeleton h-3 w-64 rounded" />
          </div>
          <div className="skeleton h-10 w-36 rounded-xl" />
        </div>
      </div>
      <div className="p-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={`desktop-user-skel-${i}`}
            className="flex items-center gap-4 p-4 border-b border-border last:border-0"
          >
            <div className="skeleton w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-2/5 rounded" />
              <div className="skeleton h-2.5 w-3/5 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
    {/* Mobile skeleton */}
    <div className="md:hidden space-y-3">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-2">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-3 w-64 rounded" />
        </div>
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={`mobile-user-skel-${i}`} className="card-modern p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="skeleton h-3.5 w-2/5 rounded" />
              <div className="skeleton h-2.5 w-3/5 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border-light">
            <div className="skeleton h-2.5 w-24 rounded" />
            <div className="flex gap-3">
              <div className="skeleton w-4 h-4 rounded" />
              <div className="skeleton w-4 h-4 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
