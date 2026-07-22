export const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="space-y-2">
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-3 w-64 rounded" />
        </div>
      </div>
      <div className="px-5 md:px-6 py-3 flex gap-2">
        <div className="skeleton h-9 w-24 rounded-lg" />
        <div className="skeleton h-9 w-24 rounded-lg" />
      </div>
    </div>
  </div>
);
