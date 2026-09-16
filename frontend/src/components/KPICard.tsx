import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIMetric } from '../types';
import { cn } from '../lib/utils';

interface KPICardProps {
  title: string;
  metric?: KPIMetric;
  subtitle?: string;
  icon?: React.ReactNode;
  invertTrendColor?: boolean; // For default rate where a decrease is positive
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  metric,
  subtitle,
  icon,
  invertTrendColor = false,
  className
}) => {
  if (!metric) return null;

  const delta = metric.delta_pct ?? 0;
  const isPositive = delta > 0;
  const isZero = delta === 0;

  // If invertTrendColor is true, downward is good (green), upward is bad (red)
  const isFavorable = invertTrendColor ? !isPositive : isPositive;

  return (
    <div
      className={cn(
        'bg-slate-900/90 border border-slate-800 rounded-lg p-4 transition-colors hover:border-slate-700/80 flex flex-col justify-between',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-bold tracking-tight text-slate-100 tabular-nums font-mono">
          {metric.formatted}
        </div>

        {metric.delta_pct !== undefined && metric.delta_pct !== null && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full border tabular-nums',
              isZero
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : isFavorable
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            )}
          >
            {isZero ? (
              <Minus className="w-3 h-3" />
            ) : isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {delta}%
            </span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
          <span>{subtitle}</span>
          <span className="text-slate-600">vs prior period</span>
        </div>
      )}
    </div>
  );
};
