import { PageHeaderSkeleton } from './PageHeaderSkeleton';
import { StatCardSkeleton } from './StatCardSkeleton';

export const HomeSkeleton = (): JSX.Element => (
  <div className="space-y-6">
    <PageHeaderSkeleton />

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {['stat-1', 'stat-2', 'stat-3'].map((k) => (
        <StatCardSkeleton key={k} />
      ))}
    </div>

    <div className="card-modern overflow-hidden">
      <div className="px-5 md:px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="space-y-1">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-2.5 w-40 rounded" />
        </div>
        <div className="skeleton h-3 w-24 rounded" />
      </div>
      <div className="hidden md:block">
        <div className="bg-surface-elevated/50">
          <div className="flex px-6 py-3 gap-6">
            <div className="skeleton h-2.5 w-12 rounded" />
            <div className="skeleton h-2.5 w-16 rounded" />
            <div className="skeleton h-2.5 w-20 rounded" />
            <div className="skeleton h-2.5 w-16 rounded" />
          </div>
        </div>
        {['row-1', 'row-2', 'row-3'].map((k) => (
          <div key={k} className="flex items-center px-6 py-3.5 border-t border-border-light gap-6">
            <div className="skeleton h-3.5 w-14 rounded" />
            <div className="skeleton h-5 w-16 rounded-md" />
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
      <div className="md:hidden">
        {['mob-1', 'mob-2', 'mob-3'].map((k) => (
          <div key={k} className="p-4 border-t border-border-light">
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <div className="skeleton h-3.5 w-14 rounded" />
                <div className="skeleton h-3 w-28 rounded" />
                <div className="skeleton h-4 w-16 rounded-md" />
              </div>
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
