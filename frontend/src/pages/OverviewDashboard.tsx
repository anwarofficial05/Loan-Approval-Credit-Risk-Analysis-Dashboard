import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import {
  PortfolioKPIs,
  GlobalFilters,
  MonthlyDisbursementPoint,
  CreditBandPoint,
  LoanPurposePoint,
  DefaultIncomePoint,
  StateDisbursementPoint,
  SegmentationCell
} from '../types';
import { fetchKPIs, fetchChartData } from '../lib/api';
import { formatINR, formatPercent } from '../lib/formatters';
import { KPICard } from '../components/KPICard';
import { KPISkeleton, ChartSkeleton } from '../components/Skeleton';
import { FilterBar } from '../components/FilterBar';

const DONUT_COLORS = [
  '#0d9488', // Teal
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#10b981'  // Emerald
];

export const OverviewDashboard: React.FC = () => {
  const [filters, setFilters] = useState<GlobalFilters>({
    branch_state: 'All',
    loan_purpose: 'All',
    credit_band: 'All',
    date_from: '',
    date_to: ''
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<PortfolioKPIs | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyDisbursementPoint[]>([]);
  const [creditData, setCreditData] = useState<CreditBandPoint[]>([]);
  const [purposeData, setPurposeData] = useState<LoanPurposePoint[]>([]);
  const [defaultIncomeData, setDefaultIncomeData] = useState<DefaultIncomePoint[]>([]);
  const [stateData, setStateData] = useState<StateDisbursementPoint[]>([]);
  const [segmentationData, setSegmentationData] = useState<SegmentationCell[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [kpiRes, monthRes, credRes, purpRes, defIncRes, stRes, segRes] = await Promise.all([
          fetchKPIs(filters),
          fetchChartData<MonthlyDisbursementPoint[]>('monthly_disbursement', filters),
          fetchChartData<CreditBandPoint[]>('approval_by_credit_band', filters),
          fetchChartData<LoanPurposePoint[]>('loan_purpose_distribution', filters),
          fetchChartData<DefaultIncomePoint[]>('default_by_income_band', filters),
          fetchChartData<StateDisbursementPoint[]>('state_disbursement', filters),
          fetchChartData<SegmentationCell[]>('segmentation_matrix', filters)
        ]);

        if (isMounted) {
          setKpis(kpiRes);
          setMonthlyData(monthRes);
          setCreditData(credRes);
          setPurposeData(purpRes);
          setDefaultIncomeData(defIncRes);
          setStateData(stRes);
          setSegmentationData(segRes);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading dashboard analytics');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  // Unique buckets for segmentation matrix heatmap
  const creditBandsList = [
    'Excellent (800+)',
    'Very Good (740-799)',
    'Good (670-739)',
    'Fair (580-669)',
    'Poor (<580)'
  ];
  const incomeBandsList = ['<25k', '25k-50k', '50k-100k', '100k-200k', '200k+'];

  const getHeatmapColor = (pct: number) => {
    if (pct >= 85) return 'bg-teal-500/30 text-teal-300 font-bold border-teal-500/40';
    if (pct >= 70) return 'bg-teal-600/20 text-teal-400 font-semibold border-teal-600/30';
    if (pct >= 50) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (pct >= 30) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-400 font-medium border-rose-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Portfolio Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time balance sheet exposure, underwriting conversion rates, and credit risk distribution.
          </p>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({
            branch_state: 'All',
            loan_purpose: 'All',
            credit_band: 'All',
            date_from: '',
            date_to: ''
          })
        }
        totalFiltered={kpis?.total_applications.value}
      />

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          <strong>Dashboard Load Error:</strong> {error}
        </div>
      )}

      {/* 6 Headline KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {loading || !kpis ? (
          Array.from({ length: 6 }).map((_, i) => <KPISkeleton key={i} />)
        ) : (
          <>
            <KPICard
              title="Total Applications"
              metric={kpis.total_applications}
              subtitle="Origination pipeline"
              icon={<Users className="w-4 h-4" />}
            />
            <KPICard
              title="Approval Rate"
              metric={kpis.approval_rate_pct}
              subtitle="Underwriting conversion"
              icon={<CheckCircle2 className="w-4 h-4 text-teal-400" />}
            />
            <KPICard
              title="Total Disbursed"
              metric={kpis.total_disbursed_inr}
              subtitle="Capital deployed"
              icon={<DollarSign className="w-4 h-4 text-teal-400" />}
            />
            <KPICard
              title="Avg Ticket Size"
              metric={kpis.avg_ticket_size_inr}
              subtitle="Average loan facility"
              icon={<Briefcase className="w-4 h-4" />}
            />
            <KPICard
              title="Default Rate"
              metric={kpis.default_rate_pct}
              subtitle="Approved portfolio risk"
              invertTrendColor={true}
              icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
            />
            <KPICard
              title="Avg Credit Score"
              metric={kpis.avg_credit_score}
              subtitle="Portfolio CIBIL score"
              icon={<Award className="w-4 h-4 text-teal-400" />}
            />
          </>
        )}
      </div>

      {/* Analytics Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 1: Monthly Disbursement & 3-Month Moving Average */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Monthly Disbursement & 3-Month Moving Average
              </h2>
              <p className="text-[11px] text-slate-400">
                Monthly capital deployed with 3-month trailing moving average smoothing
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              WINDOW AVG OVER
            </span>
          </div>

          {loading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(m) => m.slice(2)}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `₹${(v / 10000000).toFixed(0)}Cr`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any, name: string) => [
                      formatINR(Number(val), false),
                      name === 'disbursed_inr' ? 'Monthly Disbursed' : '3-Month Moving Avg'
                    ]}
                    labelFormatter={(label) => `Disbursement Month: ${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(val) => (val === 'disbursed_inr' ? 'Monthly Disbursed' : '3-Month MA')}
                  />
                  <Bar dataKey="disbursed_inr" fill="#0d9488" opacity={0.65} radius={[4, 4, 0, 0]} />
                  <Line
                    type="monotone"
                    dataKey="moving_avg_3m_inr"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visual 2: Approval Rate by Credit Band */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Approval Rate by Credit Score Band
              </h2>
              <p className="text-[11px] text-slate-400">
                Conversion probability across CIBIL credit score tiers
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              GROUP BY CREDIT_BAND
            </span>
          </div>

          {loading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creditData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="credit_band" stroke="#64748b" fontSize={10} angle={-15} textAnchor="end" />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any, name: string) => [
                      `${Number(val).toFixed(1)}%`,
                      'Approval Rate'
                    ]}
                  />
                  <Bar
                    dataKey="approval_rate_pct"
                    fill="#14b8a6"
                    radius={[4, 4, 0, 0]}
                  >
                    {creditData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.approval_rate_pct >= 85
                            ? '#10b981'
                            : entry.approval_rate_pct >= 60
                            ? '#0d9488'
                            : '#f43f5e'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visual 3: Loan Purpose Distribution Donut */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Loan Purpose Portfolio Distribution
              </h2>
              <p className="text-[11px] text-slate-400">
                Volume share and disbursed capital across loan facilities
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              PURPOSE SHARE
            </span>
          </div>

          {loading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purposeData}
                    dataKey="disbursed_inr"
                    nameKey="loan_purpose"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {purposeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any, name: string) => [
                      formatINR(Number(val), true),
                      `${name} Loan`
                    ]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visual 4: Default Rate by Income Band & Property Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Default Rate by Income Band & Property Area
              </h2>
              <p className="text-[11px] text-slate-400">
                Risk concentrations segmented across geography and borrower income
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              MULTI-LEVEL GROUP BY
            </span>
          </div>

          {loading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={defaultIncomeData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="income_band" stroke="#64748b" fontSize={11} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any, name: string) => [
                      `${Number(val).toFixed(2)}%`,
                      name
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="urban_default_pct" name="Urban" fill="#0284c7" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="semiurban_default_pct" name="Semiurban" fill="#0d9488" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="rural_default_pct" name="Rural" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visual 5: State-wise Disbursement */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                State-wise Disbursement Volume
              </h2>
              <p className="text-[11px] text-slate-400">
                Disbursement distribution across Indian branch states
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              RANK() OVER
            </span>
          </div>

          {loading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stateData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    stroke="#64748b"
                    fontSize={10}
                    tickFormatter={(v) => `₹${(v / 10000000).toFixed(0)}Cr`}
                  />
                  <YAxis
                    type="category"
                    dataKey="branch_state"
                    stroke="#64748b"
                    fontSize={10}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any) => [formatINR(Number(val), true), 'Disbursed']}
                  />
                  <Bar dataKey="disbursed_inr" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visual 6: Credit-Band x Income-Band Approval Heatmap */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Credit Band × Income Band Approval Heatmap
              </h2>
              <p className="text-[11px] text-slate-400">
                Granular underwriting conversion matrix (approval rate %)
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
              2D CROSSTAB
            </span>
          </div>

          {loading ? (
            <ChartSkeleton height="h-72" />
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2 font-medium">Credit Score Band</th>
                    {incomeBandsList.map((ib) => (
                      <th key={ib} className="py-2 px-2 text-center font-medium">
                        {ib}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {creditBandsList.map((cb) => (
                    <tr key={cb} className="hover:bg-slate-800/30">
                      <td className="py-2 px-2 font-sans font-medium text-slate-300 whitespace-nowrap">
                        {cb}
                      </td>
                      {incomeBandsList.map((ib) => {
                        const cell = segmentationData.find(
                          (d) => d.credit_band === cb && d.income_band === ib
                        );
                        const rate = cell ? cell.approval_rate_pct : 0;
                        return (
                          <td key={ib} className="py-1.5 px-1.5 text-center">
                            <span
                              className={`inline-block w-full py-1 rounded text-[11px] border ${getHeatmapColor(
                                rate
                              )}`}
                              title={`${cb} & ${ib}: ${cell ? cell.approved_count : 0}/${cell ? cell.total_count : 0} approved`}
                            >
                              {rate.toFixed(0)}%
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-end gap-3 text-[10px] text-slate-400 mt-3 font-sans">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-teal-500/30 border border-teal-500/50" /> ≥85%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-teal-600/20 border border-teal-600/30" /> 70-84%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-700" /> 50-69%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/10 border border-amber-500/30" /> 30-49%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500/10 border border-rose-500/30" /> &lt;30%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
