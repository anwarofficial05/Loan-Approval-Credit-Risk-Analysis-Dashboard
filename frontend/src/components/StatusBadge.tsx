import React from 'react';
import { cn, getStatusColor } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const isApproved = status === 'Approved';
  const color = getStatusColor(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums',
        color.bg,
        color.text,
        color.border,
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          isApproved ? 'bg-emerald-400' : 'bg-rose-400'
        )}
      />
      {status}
    </span>
  );
};
