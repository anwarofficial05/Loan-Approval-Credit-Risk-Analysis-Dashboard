import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Send,
  Zap,
  Activity,
  DollarSign,
  User,
  Scale,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import { PredictRequest, PredictResponse } from '../types';
import { predictApplication } from '../lib/api';
import { formatINR } from '../lib/formatters';
import { StatusBadge } from '../components/StatusBadge';
import { RiskBadge } from '../components/RiskBadge';

const STATES = [
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

const PURPOSES = ['Home', 'Vehicle', 'Personal', 'Education', 'Business', 'Gold'];

const PRESETS = {
  strong: {
    applicant_name: 'Aditya Deshmukh',
    age: 36,
    gender: 'Male',
    marital_status: 'Married',
    dependents: 1,
    education: 'Graduate',
    self_employed: 'No',
    applicant_income: 115000,
    coapplicant_income: 45000,
    loan_amount: 4500000,
    loan_term_months: 240,
    interest_rate: 8.65,
    credit_score: 795,
    credit_history: 1,
    existing_emi: 8500,
    property_area: 'Urban',
    loan_purpose: 'Home',
    branch_state: 'Maharashtra'
  },
  borderline: {
    applicant_name: 'Karan Mehra',
    age: 31,
    gender: 'Male',
    marital_status: 'Single',
    dependents: 0,
    education: 'Graduate',
    self_employed: 'No',
    applicant_income: 48000,
    coapplicant_income: 0,
    loan_amount: 1100000,
    loan_term_months: 60,
    interest_rate: 11.25,
    credit_score: 660,
    credit_history: 1,
    existing_emi: 9500,
    property_area: 'Semiurban',
    loan_purpose: 'Vehicle',
    branch_state: 'Karnataka'
  },
  weak: {
    applicant_name: 'Rajesh Mishra',
    age: 27,
    gender: 'Male',
    marital_status: 'Single',
    dependents: 0,
    education: 'Not Graduate',
    self_employed: 'Yes',
    applicant_income: 24000,
    coapplicant_income: 0,
    loan_amount: 750000,
    loan_term_months: 36,
    interest_rate: 16.50,
    credit_score: 495,
    credit_history: 0,
    existing_emi: 10500,
    property_area: 'Rural',
    loan_purpose: 'Personal',
    branch_state: 'Uttar Pradesh'
  }
};

export const RiskScorer: React.FC = () => {
  const [formData, setFormData] = useState<PredictRequest>(PRESETS.strong);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof PredictRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLoadPreset = (type: 'strong' | 'borderline' | 'weak') => {
    setFormData(PRESETS[type]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await predictApplication(formData);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Underwriting inference failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Real-Time Credit Risk Scorer
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate credit underwriting on an incoming loan origination. Evaluates logistic odds and random forest default probabilities with top 5 decision drivers.
          </p>
        </div>

        {/* Load Preset Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Load Example:</span>
          <button
            type="button"
            onClick={() => handleLoadPreset('strong')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
          >
            Strong Prime
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('borderline')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
          >
            Borderline
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('weak')}
            className="text-xs font-semibold px-2.5 py-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
          >
            Subprime / High Risk
          </button>
        </div>
      </div>

      {/* Main Grid: Left Form, Right Assessment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column (7 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5"
        >
          {/* Section 1: Demographics */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-400" />
              Applicant Profile & Demographics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Applicant Name</label>
                <input
                  type="text"
                  required
                  value={formData.applicant_name}
                  onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Age (21-65)</label>
                <input
                  type="number"
                  min={21}
                  max={65}
                  required
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Marital Status</label>
                <select
                  value={formData.marital_status}
                  onChange={(e) => handleInputChange('marital_status', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Married">Married</option>
                  <option value="Single">Single</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Dependents (0-3)</label>
                <select
                  value={formData.dependents}
                  onChange={(e) => handleInputChange('dependents', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value={0}>0 Dependents</option>
                  <option value={1}>1 Dependent</option>
                  <option value={2}>2 Dependents</option>
                  <option value={3}>3 Dependents</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Education</label>
                <select
                  value={formData.education}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Graduate">Graduate</option>
                  <option value="Not Graduate">Not Graduate</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Self Employed</label>
                <select
                  value={formData.self_employed}
                  onChange={(e) => handleInputChange('self_employed', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="No">Salaried (No)</option>
                  <option value="Yes">Self-Employed (Yes)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Property Area</label>
                <select
                  value={formData.property_area}
                  onChange={(e) => handleInputChange('property_area', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="Urban">Urban</option>
                  <option value="Semiurban">Semiurban</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-slate-400 block mb-1">Branch State Jurisdiction</label>
                <select
                  value={formData.branch_state}
                  onChange={(e) => handleInputChange('branch_state', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Incomes & Obligations */}
          <div className="border-t border-slate-800 pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-teal-400" />
              Monthly Cashflow & Existing Debt
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Applicant Monthly Income (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.applicant_income ?? ''}
                  onChange={(e) =>
                    handleInputChange(
                      'applicant_income',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Co-Applicant Income (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={formData.coapplicant_income}
                  onChange={(e) =>
                    handleInputChange('coapplicant_income', Number(e.target.value))
                  }
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                  placeholder="0 if none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Existing Monthly EMI (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={formData.existing_emi}
                  onChange={(e) => handleInputChange('existing_emi', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Loan Facility Terms & Credit History */}
          <div className="border-t border-slate-800 pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-teal-400" />
              Requested Loan Terms & Credit Score
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Loan Purpose</label>
                <select
                  value={formData.loan_purpose}
                  onChange={(e) => handleInputChange('loan_purpose', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p} Loan
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Sanction Amount (₹)</label>
                <input
                  type="number"
                  min={50000}
                  step={50000}
                  value={formData.loan_amount ?? ''}
                  onChange={(e) =>
                    handleInputChange(
                      'loan_amount',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tenure (Months)</label>
                <select
                  value={formData.loan_term_months}
                  onChange={(e) =>
                    handleInputChange('loan_term_months', Number(e.target.value))
                  }
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value={12}>12 Months (1 Yr)</option>
                  <option value={24}>24 Months (2 Yrs)</option>
                  <option value={36}>36 Months (3 Yrs)</option>
                  <option value={60}>60 Months (5 Yrs)</option>
                  <option value={120}>120 Months (10 Yrs)</option>
                  <option value={180}>180 Months (15 Yrs)</option>
                  <option value={240}>240 Months (20 Yrs)</option>
                  <option value={360}>360 Months (30 Yrs)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Interest Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.05"
                  min={5}
                  max={30}
                  value={formData.interest_rate}
                  onChange={(e) =>
                    handleInputChange('interest_rate', Number(e.target.value))
                  }
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CIBIL Credit Score (300-900)</label>
                <input
                  type="number"
                  min={300}
                  max={900}
                  value={formData.credit_score}
                  onChange={(e) =>
                    handleInputChange('credit_score', Number(e.target.value))
                  }
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500 font-mono font-bold text-teal-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Credit History Track Record</label>
                <select
                  value={formData.credit_history ?? 1}
                  onChange={(e) =>
                    handleInputChange(
                      'credit_history',
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-750 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value={1}>Clean Track Record (1)</option>
                  <option value={0}>Past Delinquency / None (0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? (
                <span>Running Underwriting Engine...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Execute Risk Assessment & Underwrite</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Results Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
              {/* Decision & Probability Gauge */}
              <div className="bg-slate-950 p-5 rounded-lg border border-slate-800 text-center relative overflow-hidden">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  DECISION ENGINE RECOMMENDATION
                </div>

                <div className="flex items-center justify-center gap-2 mb-3">
                  <StatusBadge
                    status={result.predicted_decision}
                    className="text-sm px-3.5 py-1 font-bold"
                  />
                  <RiskBadge tier={result.risk_tier} className="text-sm px-3.5 py-1 font-bold" />
                </div>

                {/* Big Probability Display */}
                <div className="flex items-baseline justify-center gap-1 font-mono">
                  <span
                    className={`text-5xl font-extrabold ${
                      result.predicted_decision === 'Approved'
                        ? 'text-teal-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {result.approval_probability_pct.toFixed(1)}%
                  </span>
                  <span className="text-slate-400 text-xs uppercase font-sans">
                    Approval Odds
                  </span>
                </div>

                {/* Default Probability Gauge Bar */}
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">Default Probability:</span>
                    <span
                      className={`font-bold ${
                        result.default_probability > 0.50
                          ? 'text-rose-400'
                          : result.default_probability > 0.35
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {result.default_probability_pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        result.default_probability > 0.50
                          ? 'bg-rose-500'
                          : result.default_probability > 0.35
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, result.default_probability_pct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Computed Financial Metrics */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block">Amortized EMI</span>
                  <span className="text-slate-200 font-bold font-mono text-sm">
                    {formatINR(result.computed_emi)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Standard monthly formula
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block">Computed DTI</span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      result.computed_dti_ratio > 0.45
                        ? 'text-rose-400'
                        : result.computed_dti_ratio > 0.35
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(result.computed_dti_ratio * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Total obligations / income
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block">Total Income</span>
                  <span className="text-slate-200 font-semibold font-mono text-xs">
                    {formatINR(result.computed_total_income)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Band: {result.income_band}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block">Leverage (LTI)</span>
                  <span className="text-slate-200 font-semibold font-mono text-xs">
                    {result.computed_loan_to_income.toFixed(1)}x Annual
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Band: {result.credit_band}
                  </span>
                </div>
              </div>

              {/* Top 5 Decision Contributing Factors */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>TOP 5 DECISION DRIVERS</span>
                  <span className="text-[10px] font-mono text-teal-400">LOGISTIC ODDS</span>
                </h3>

                <div className="space-y-2">
                  {result.contributing_factors.map((factor, idx) => {
                    const isPositive = factor.weight > 0;
                    return (
                      <div
                        key={idx}
                        className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-200">{factor.factor}</span>
                          <span
                            className={`flex items-center gap-1 font-mono text-[11px] ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {isPositive ? '+' : ''}
                            {factor.weight.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          {factor.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-slate-500 space-y-3">
              <Activity className="w-10 h-10 mx-auto text-slate-600" />
              <div className="font-medium text-slate-300">Underwriting Model Ready</div>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                Click &quot;Execute Risk Assessment&quot; or select one of the sample applicant presets to run real-time credit scoring.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
