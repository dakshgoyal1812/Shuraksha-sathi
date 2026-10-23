import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  PlaySquare,
  ShieldAlert,
  BarChart3,
  GitCompare,
  FileText,
  FolderKanban,
  Settings,
  AlertTriangle,
  Radio
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  activeScenarioId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeScenarioId,
}) => {
  const simLink = activeScenarioId ? `/simulation/${activeScenarioId}` : '/simulation/default';
  const analyticsLink = activeScenarioId ? `/analytics/${activeScenarioId}` : '/analytics/default';

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Hazard Tracker', to: '/live-tracking', icon: Radio },
    { name: 'Scenario Builder', to: '/scenarios/new', icon: PlusCircle },
    { name: 'Simulation Workspace', to: simLink, icon: PlaySquare },
    { name: 'Shelters', to: '/shelters', icon: ShieldAlert },
    { name: 'Analytics', to: analyticsLink, icon: BarChart3 },
    { name: 'Strategy Comparison', to: '/compare', icon: GitCompare },
    { name: 'Reports', to: '/reports', icon: FileText },
    { name: 'Saved Scenarios', to: '/scenarios', icon: FolderKanban },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];


  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-[#E1E7EF] z-40 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="py-4 px-3 flex flex-col gap-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
            Operations Menu
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-sm'
                    : 'text-[#65758B] hover:text-[#0F172A] hover:bg-slate-100/70'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer Warning / Model Disclaimer Notice */}
        <div className="p-3 m-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Simulation Disclaimer</span>
          </div>
          <p className="leading-tight text-slate-600">
            Purely software-based model for planning exercises. Results are synthetic estimates.
          </p>
        </div>
      </aside>
    </>
  );
};
