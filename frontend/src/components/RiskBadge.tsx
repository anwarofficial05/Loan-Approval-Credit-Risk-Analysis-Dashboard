import React from 'react';
import { cn, getRiskColor } from '../lib/utils';

interface RiskBadgeProps {
  tier: string;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ tier, className }) => {
  const color = getRiskColor(tier);

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
      <span className={cn('w-1.5 h-1.5 rounded-full', color.dot)} />
      {tier} Risk
    </span>
  );
};
