import React from 'react';
import { Filter, RotateCcw, Calendar } from 'lucide-react';
import { GlobalFilters } from '../types';

interface FilterBarProps {
  filters: GlobalFilters;
  onChange: (updated: GlobalFilters) => void;
  onReset: () => void;
  totalFiltered?: number;
}

const STATES = [
  'All',
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Delhi',
  'Gujarat',
  'Uttar Pradesh',
  'Telangana',
  'West Bengal',
  'Rajasthan',
  'Kerala'
];

const PURPOSES = [
  'All',
  'Home',
  'Vehicle',
  'Personal',
  'Education',
  'Business',
  'Gold'
];

const CREDIT_BANDS = [
  'All',
  'Excellent (800+)',
  'Very Good (740-799)',
  'Good (670-739)',
  'Fair (580-669)',
  'Poor (<580)'
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onReset,
  totalFiltered
}) => {
  const isFiltered =
    filters.branch_state !== 'All' ||
    filters.loan_purpose !== 'All' ||
    filters.credit_band !== 'All' ||
    Boolean(filters.date_from) ||
    Boolean(filters.date_to);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium px-2 py-1 bg-slate-800/60 rounded border border-slate-700/50">
          <Filter className="w-3.5 h-3.5 text-teal-400" />
          <span>PORTFOLIO FILTERS:</span>
        </div>

        {/* State Filter */}
        <div className="flex items-center gap-1">
          <label className="text-slate-400">State:</label>
          <select
            value={filters.branch_state}
            onChange={(e) => onChange({ ...filters, branch_state: e.target.value })}
            className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 hover:border-slate-600 transition-colors"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Purpose Filter */}
        <div className="flex items-center gap-1">
          <label className="text-slate-400">Purpose:</label>
          <select
            value={filters.loan_purpose}
            onChange={(e) => onChange({ ...filters, loan_purpose: e.target.value })}
            className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 hover:border-slate-600 transition-colors"
          >
            {PURPOSES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Credit Band Filter */}
        <div className="flex items-center gap-1">
          <label className="text-slate-400">Credit Band:</label>
          <select
            value={filters.credit_band}
            onChange={(e) => onChange({ ...filters, credit_band: e.target.value })}
            className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 hover:border-slate-600 transition-colors"
          >
            {CREDIT_BANDS.map((cb) => (
              <option key={cb} value={cb}>
                {cb}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Inputs */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-750/70 rounded px-2 py-0.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => onChange({ ...filters, date_from: e.target.value })}
            className="bg-transparent text-slate-300 focus:outline-none text-xs"
            placeholder="From"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => onChange({ ...filters, date_to: e.target.value })}
            className="bg-transparent text-slate-300 focus:outline-none text-xs"
            placeholder="To"
          />
        </div>
      </div>

      {/* Right Action: Reset Button */}
      <div className="flex items-center gap-3 ml-auto">
        {totalFiltered !== undefined && (
          <span className="text-slate-400 text-xs tabular-nums">
            Showing <strong className="text-slate-200 font-semibold">{totalFiltered.toLocaleString('en-IN')}</strong> loans
          </span>
        )}

        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-teal-400 hover:text-teal-300 transition-colors py-1 px-2.5 rounded bg-teal-500/10 border border-teal-500/20"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
