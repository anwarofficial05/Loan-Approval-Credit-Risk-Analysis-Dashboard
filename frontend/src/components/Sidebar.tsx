import React from 'react';
import {
  LayoutDashboard,
  Users,
  Terminal,
  ShieldCheck,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { cn } from '../lib/utils';

export type TabKey = 'overview' | 'applications' | 'sql' | 'scorer' | 'model';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  key: TabKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'overview',
    label: 'Overview Dashboard',
    description: 'Portfolio KPIs & Visual Analytics',
    icon: <LayoutDashboard className="w-4 h-4" />
  },
  {
    key: 'applications',
    label: 'Application Explorer',
    description: '50,000 Server-Paginated Loans',
    icon: <Users className="w-4 h-4" />
  },
  {
    key: 'sql',
    label: 'SQL Explorer',
    description: '12 Non-Trivial SQL Analytics',
    icon: <Terminal className="w-4 h-4" />
  },
  {
    key: 'scorer',
    label: 'Risk Scorer',
    description: 'Real-Time Underwriting Engine',
    icon: <ShieldCheck className="w-4 h-4" />
  },
  {
    key: 'model',
    label: 'Model Performance',
    description: 'ROC-AUC & Confusion Matrix',
    icon: <Cpu className="w-4 h-4" />
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse
}) => {
  return (
    <aside
      className={cn(
        'bg-slate-950 border-r border-slate-800 transition-all duration-200 flex flex-col justify-between select-none z-20',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Navigation List */}
      <div className="p-3 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {!collapsed && 'ANALYTICS & UNDERWRITING'}
        </div>

        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative',
                isActive
                  ? 'bg-slate-900 text-teal-400 border border-teal-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 transition-colors',
                  isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                )}
              >
                {item.icon}
              </div>

              {!collapsed && (
                <div className="flex-1 text-left truncate">
                  <div className="font-semibold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 truncate group-hover:text-slate-400">
                    {item.description}
                  </div>
                </div>
              )}

              {isActive && (
                <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-teal-500 rounded-l" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Toggle */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {!collapsed && (
          <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300 mb-0.5">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>SQLite Memory-Mapped</span>
            </div>
            <div className="text-[10px] text-slate-500">Sub-100ms Raw SQL Engine</div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Menu</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
