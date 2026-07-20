export const CalendarioSkeleton = () => {
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      <div className="card-modern h-full p-5 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-elevated/60 p-0.5 rounded-lg border border-border/60">
              <div className="skeleton w-9 h-9 rounded-md" />
              <div className="skeleton w-12 h-9 rounded-md" />
              <div className="skeleton w-9 h-9 rounded-md" />
            </div>
            <div className="skeleton h-5 w-36 rounded" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="skeleton h-9 w-28 rounded-xl" />
            <div className="flex bg-surface-elevated/60 p-0.5 rounded-lg border border-border/60">
              <div className="skeleton w-16 h-9 rounded-md" />
              <div className="skeleton w-12 h-9 rounded-md" />
            </div>
          </div>
        </div>
        {/* Calendar grid */}
        <div className="flex-1 flex gap-0">
          <div className="w-14 border-r border-border-light">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-[calc(100%/7)] flex items-start justify-end pr-2 pt-1">
                <div className="skeleton h-2.5 w-8 rounded" />
              </div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-[repeat(6,1fr)] gap-px bg-border-light">
            {[...Array(42)].map((_, i) => (
              <div key={i} className="bg-surface p-1">
                {i % 8 === 0 && <div className="skeleton h-5 w-full rounded mb-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
