export const PageHeaderSkeleton = () => {
  return (
    <div className="card-modern overflow-hidden">
      <div className="p-5 md:p-6 border-b border-border">
        <div className="space-y-2">
          <div className="skeleton h-6 w-56 rounded" />
          <div className="skeleton h-3 w-48 rounded" />
        </div>
      </div>
    </div>
  );
};
