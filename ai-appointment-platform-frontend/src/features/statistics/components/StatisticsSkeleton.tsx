import { PageHeaderSkeleton } from '../../../shared/components/skeletons/PageHeaderSkeleton';
import { StatCardSkeleton } from '../../../shared/components/skeletons/StatCardSkeleton';

export const StatisticsSkeleton = () => {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['sc-a', 'sc-b', 'sc-c', 'sc-d'].map((k) => (
          <StatCardSkeleton key={k} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-modern p-5 md:p-6 lg:col-span-2">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="skeleton h-[280px] w-full rounded-xl" />
        </div>
        <div className="card-modern p-5 md:p-6">
          <div className="skeleton h-5 w-36 rounded mb-2" />
          <div className="skeleton h-3 w-16 rounded mb-4" />
          <div className="skeleton w-[150px] h-[150px] rounded-full mx-auto mb-4" />
          <div className="flex justify-center gap-6">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-modern p-5 md:p-6">
          <div className="skeleton h-5 w-44 rounded mb-4" />
          <div className="skeleton h-[260px] w-full rounded-xl" />
        </div>
        <div className="card-modern p-5 md:p-6">
          <div className="skeleton h-5 w-48 rounded mb-4" />
          <div className="space-y-3">
            {['cl-a', 'cl-b', 'cl-c'].map((k) => (
              <div
                key={k}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated/50"
              >
                <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-5 w-14 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
