import React from 'react';

export const InvitationsSkeleton = (): React.JSX.Element => (
  <div className="card-modern overflow-hidden mt-6">
    <div className="p-5 border-b border-border">
      <div className="skeleton h-5 w-32 rounded" />
    </div>
    <div className="p-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={`invitation-skel-${i}`} className="flex items-center gap-4">
          <div className="skeleton h-3.5 w-1/3 rounded" />
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);
