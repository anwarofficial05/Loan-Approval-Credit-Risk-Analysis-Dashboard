import React from 'react';
import { cn } from '../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-slate-800/60 border border-slate-750/30',
        className
      )}
    />
  );
};

export const KPISkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between h-28">
      <div className="flex justify-between items-start">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-72' }) => {
  return (
    <div className={cn('bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between', height)}>
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-4">
        {[40, 65, 30, 85, 55, 75, 45, 90, 60, 70, 50, 80].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-800/50 rounded-t animate-pulse"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-900/80 border border-slate-800/60 rounded px-4 flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
};
