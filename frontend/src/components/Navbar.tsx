import React from 'react';
import { Shield, Activity, Database, Clock } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-slate-100">
              CreditLens
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              v1.0 NBFC
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block -mt-0.5">
            Loan Origination & Credit Risk Analytics
          </span>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center gap-4 text-xs">
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">Core Engine:</span>
          <span className="text-slate-200 font-medium font-mono">ACTIVE</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-slate-400 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span>50,000 Applications Loaded</span>
        </div>

        <a
          href="/CreditLens_Complete_Project_Guide.pdf"
          download="CreditLens_Complete_Project_Guide.pdf"
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 transition-colors font-medium text-xs shadow-sm"
          title="Download Complete Technical & Operational PDF Guide"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>PDF Guide</span>
        </a>

        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] border-l border-slate-800 pl-3">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{currentDate}</span>
        </div>
      </div>
    </header>
  );
};
