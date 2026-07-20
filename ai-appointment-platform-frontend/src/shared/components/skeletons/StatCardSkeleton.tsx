export const StatCardSkeleton = () => {
  return (
    <div className="stat-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-7 w-16 rounded" />
        </div>
        <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
      </div>
    </div>
  );
};
