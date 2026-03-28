import React from 'react';
import { cn } from '@/lib/utils';

const SkeletonPulse = ({ className }) => (
  <div className={cn('animate-pulse rounded-xl bg-muted', className)} />
);

export const CardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
    <SkeletonPulse className="h-10 w-10 rounded-xl" />
    <SkeletonPulse className="h-7 w-20" />
    <SkeletonPulse className="h-3 w-28" />
  </div>
);

export const ListSkeleton = ({ rows = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonPulse key={i} className="h-16 w-full rounded-xl" />
    ))}
  </div>
);

export const PageSkeleton = () => (
  <div className="space-y-6 p-4">
    <SkeletonPulse className="h-8 w-48" />
    <SkeletonPulse className="h-4 w-64" />
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
    <ListSkeleton />
  </div>
);

export default SkeletonPulse;
