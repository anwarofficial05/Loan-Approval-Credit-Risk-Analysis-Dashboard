import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import {
  ApplicationListItem,
  ApplicationDetail,
  PaginatedApplications
} from '../types';
import { fetchApplications, fetchApplicationById } from '../lib/api';
import { formatINR, formatDate } from '../lib/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';
import { Drawer } from '../components/Drawer';
import { TableSkeleton } from '../components/Skeleton';

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

const RISK_TIERS = ['All', 'Low', 'Medium', 'High'];

export const ApplicationExplorer: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [loanStatus, setLoanStatus] = useState('All');
  const [branchState, setBranchState] = useState('All');
  const [loanPurpose, setLoanPurpose] = useState('All');
  const [creditBand, setCreditBand] = useState('All');
  const [riskTier, setRiskTier] = useState('All');
  const [sortBy, setSortBy] = useState('application_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedApplications | null>(null);

  // Drawer state
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<ApplicationDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchApplications({
          page,
          page_size: pageSize,
          search: search.trim() || undefined,
          loan_status: loanStatus,
          branch_state: branchState,
          loan_purpose: loanPurpose,
          credit_band: creditBand,
          risk_tier: riskTier,
          sort_by: sortBy,
          sort_dir: sortDir
        });
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to fetch loan applications');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [
    page,
    pageSize,
    search,
    loanStatus,
    branchState,
    loanPurpose,
    creditBand,
    riskTier,
    sortBy,
    sortDir
  ]);

  const handleRowClick = async (appId: string) => {
    setSelectedAppId(appId);
    setDrawerLoading(true);
    try {
      const detail = await fetchApplicationById(appId);
      setSelectedApp(detail);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setLoanStatus('All');
    setBranchState('All');
    setLoanPurpose('All');
    setCreditBand('All');
    setRiskTier('All');
    setSortBy('application_date');
    setSortDir('desc');
    setPage(1);
  };

  const isFiltered =
    Boolean(search) ||
    loanStatus !== 'All' ||
    branchState !== 'All' ||
    loanPurpose !== 'All' ||
    creditBand !== 'All' ||
    riskTier !== 'All';

  const renderSortIcon = (col: string) => {
    if (sortBy !== col) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-teal-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-teal-400 inline ml-1" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Application Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Server-side paginated repository of 50,000 retail credit facilities. Click any record to inspect the complete underwriting profile.
          </p>
        </div>
        {data && (
          <div className="text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            Total Matches: <strong className="text-teal-400">{data.total_count.toLocaleString('en-IN')}</strong> records
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID (e.g. LN-2024-000120) or applicant name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-750 text-slate-200 text-xs rounded pl-9 pr-3 py-2 focus:outline-none focus:border-teal-500 placeholder-slate-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={loanStatus}
              onChange={(e) => {
                setLoanStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Risk Tier Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Risk Tier:</span>
            <select
              value={riskTier}
              onChange={(e) => {
                setRiskTier(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 text-xs"
            >
              {RISK_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t === 'All' ? 'All Risk Tiers' : `${t} Risk`}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Purpose:</span>
            <select
              value={loanPurpose}
              onChange={(e) => {
                setLoanPurpose(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 text-xs"
            >
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p === 'All' ? 'All Purposes' : `${p} Loan`}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">State:</span>
            <select
              value={branchState}
              onChange={(e) => {
                setBranchState(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-teal-500 text-xs"
            >
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs px-2.5 py-1.5 rounded bg-teal-500/10 border border-teal-500/20"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-xs">
          {error}
        </div>
      )}

      {/* Main Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 select-none">
              <tr>
                <th
                  onClick={() => handleSort('application_id')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  Application ID {renderSortIcon('application_id')}
                </th>
                <th
                  onClick={() => handleSort('applicant_name')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  Applicant Name {renderSortIcon('applicant_name')}
                </th>
                <th
                  onClick={() => handleSort('total_income')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  Monthly Income {renderSortIcon('total_income')}
                </th>
                <th
                  onClick={() => handleSort('loan_amount')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  Loan Amount {renderSortIcon('loan_amount')}
                </th>
                <th className="py-3 px-3 font-semibold">Purpose & Term</th>
                <th
                  onClick={() => handleSort('credit_score')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  CIBIL Score {renderSortIcon('credit_score')}
                </th>
                <th
                  onClick={() => handleSort('dti_ratio')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  DTI {renderSortIcon('dti_ratio')}
                </th>
                <th className="py-3 px-3 font-semibold">Branch State</th>
                <th
                  onClick={() => handleSort('loan_status')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  Status {renderSortIcon('loan_status')}
                </th>
                <th
                  onClick={() => handleSort('risk_tier')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200"
                >
                  Risk Tier {renderSortIcon('risk_tier')}
                </th>
                <th
                  onClick={() => handleSort('application_date')}
                  className="py-3 px-3 font-semibold cursor-pointer hover:text-slate-200 text-right"
                >
                  Date {renderSortIcon('application_date')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-6">
                    <TableSkeleton rows={pageSize > 15 ? 15 : pageSize} />
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((app) => (
                  <tr
                    key={app.application_id}
                    onClick={() => handleRowClick(app.application_id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-semibold text-teal-400 group-hover:underline">
                      {app.application_id}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">
                      <div>{app.applicant_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {app.age}y • {app.gender[0]} • {app.education}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {formatINR(app.total_income)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-100 font-semibold">
                      {formatINR(app.loan_amount)}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300">
                      <div>{app.loan_purpose}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {app.loan_term_months} mos @ {app.interest_rate}%
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold ${
                          app.credit_score >= 740
                            ? 'text-emerald-400'
                            : app.credit_score >= 670
                            ? 'text-teal-400'
                            : app.credit_score >= 580
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {app.credit_score}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-medium ${
                          app.dti_ratio > 0.45
                            ? 'text-rose-400 font-bold'
                            : app.dti_ratio > 0.35
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {(app.dti_ratio * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">
                      {app.branch_state}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <StatusBadge status={app.loan_status} />
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <RiskBadge tier={app.risk_tier} />
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans text-slate-400 text-[11px]">
                      {formatDate(app.application_date)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 text-sm">
                    No loan applications match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination Bar */}
        {data && (
          <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-750 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-teal-500"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-slate-500 ml-2">
                Showing{' '}
                <strong className="text-slate-300">
                  {((page - 1) * pageSize + 1).toLocaleString('en-IN')}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-300">
                  {Math.min(page * pageSize, data.total_count).toLocaleString('en-IN')}
                </strong>{' '}
                of{' '}
                <strong className="text-slate-300">
                  {data.total_count.toLocaleString('en-IN')}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-slate-300 font-mono">
                Page {page} of {data.total_pages || 1}
              </span>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= data.total_pages}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(data.total_pages)}
                disabled={page >= data.total_pages}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Slide-over Drawer */}
      <Drawer
        isOpen={Boolean(selectedAppId)}
        onClose={() => {
          setSelectedAppId(null);
          setSelectedApp(null);
        }}
        application={selectedApp}
        loading={drawerLoading}
      />
    </div>
  );
};
