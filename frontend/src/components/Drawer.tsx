import React from 'react';
import { X, User, DollarSign, Activity, Calendar, MapPin, Building, CreditCard, ShieldAlert } from 'lucide-react';
import { ApplicationDetail } from '../types';
import { StatusBadge } from './StatusBadge';
import { RiskBadge } from './RiskBadge';
import { formatINR, formatDate } from '../lib/formatters';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: ApplicationDetail | null;
  loading?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  application,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-medium text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {application?.application_id || 'Loading...'}
                </span>
                {application && (
                  <>
                    <StatusBadge status={application.loan_status} />
                    <RiskBadge tier={application.risk_tier} />
                  </>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                {application?.applicant_name || 'Loan Application Profile'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
            {loading || !application ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-20 bg-slate-800/60 rounded" />
                <div className="h-40 bg-slate-800/60 rounded" />
                <div className="h-40 bg-slate-800/60 rounded" />
              </div>
            ) : (
              <>
                {/* Section 1: Financial & Debt Underwriting Ratios */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Key Underwriting & Debt Ratios
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                      <div className="text-[11px] text-slate-400">DTI Ratio</div>
                      <div className={`text-base font-bold font-mono mt-0.5 ${
                        application.dti_ratio > 0.45 ? 'text-rose-400' : application.dti_ratio > 0.35 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {(application.dti_ratio * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Threshold: 45%</div>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                      <div className="text-[11px] text-slate-400">Loan / Income</div>
                      <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                        {application.loan_to_income.toFixed(1)}x
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Annual multiple</div>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                      <div className="text-[11px] text-slate-400">Monthly EMI</div>
                      <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                        {formatINR(application.emi)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Amortized</div>
                    </div>

                    <div className="bg-slate-900/90 border border-slate-800 rounded p-2.5">
                      <div className="text-[11px] text-slate-400">Credit Score</div>
                      <div className="text-base font-bold font-mono text-teal-400 mt-0.5">
                        {application.credit_score}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{application.credit_band}</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Loan Details */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-teal-400" />
                    Facility Terms & Disbursement
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Sanctioned Amount</span>
                      <span className="text-slate-200 font-semibold font-mono text-sm">
                        {formatINR(application.loan_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Loan Purpose</span>
                      <span className="text-slate-200 font-medium">{application.loan_purpose} Loan</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Interest Rate</span>
                      <span className="text-slate-200 font-semibold font-mono">{application.interest_rate}% p.a.</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tenure</span>
                      <span className="text-slate-200 font-medium font-mono">{application.loan_term_months} Months ({application.loan_term_months / 12} Yrs)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Application Date</span>
                      <span className="text-slate-200 font-medium">{formatDate(application.application_date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Default Status</span>
                      <span className={`font-semibold ${application.default_flag === 1 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {application.default_flag === 1 ? 'Default Occurred' : 'Performing / Current'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Applicant Demographics & Income */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-400" />
                    Applicant & Financial Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Applicant Monthly Income</span>
                      <span className="text-slate-200 font-semibold font-mono">
                        {formatINR(application.applicant_income)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Co-Applicant Income</span>
                      <span className="text-slate-200 font-semibold font-mono">
                        {formatINR(application.coapplicant_income)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Household Income</span>
                      <span className="text-slate-200 font-semibold font-mono">
                        {formatINR(application.total_income)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Existing Monthly EMI</span>
                      <span className="text-slate-200 font-semibold font-mono">
                        {formatINR(application.existing_emi)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Age & Gender</span>
                      <span className="text-slate-200 font-medium">{application.age} Yrs, {application.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Marital Status & Dependents</span>
                      <span className="text-slate-200 font-medium">{application.marital_status} ({application.dependents} deps)</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Education</span>
                      <span className="text-slate-200 font-medium">{application.education}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Employment Status</span>
                      <span className="text-slate-200 font-medium">{application.self_employed === 'Yes' ? 'Self-Employed' : 'Salaried'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Branch Jurisdiction</span>
                      <span className="text-slate-200 font-medium">{application.branch_state}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Property Area</span>
                      <span className="text-slate-200 font-medium">{application.property_area}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Risk Tier Note */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-teal-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-slate-400">
                    <strong className="text-slate-200 font-medium block mb-0.5">Automated Underwriting Summary</strong>
                    This loan application was evaluated through CreditLens risk scoring engine with assigned tier <strong className="text-slate-100">{application.risk_tier} Risk</strong> and decision <strong className="text-slate-100">{application.loan_status}</strong>.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
