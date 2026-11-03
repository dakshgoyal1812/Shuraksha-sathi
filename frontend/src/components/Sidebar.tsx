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
  Radio,
  Boxes
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
    { name: 'Incident Command', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Hazard Radar', to: '/live-tracking', icon: Radio },
    { name: '3D Evacuation Studio', to: '/3d', icon: Boxes },
    { name: 'Simulation Workspace', to: simLink, icon: PlaySquare },
    { name: 'Relief Shelters', to: '/shelters', icon: ShieldAlert },
    { name: 'Analytics & Strategy', to: analyticsLink, icon: BarChart3 },
    { name: 'Incident Reports', to: '/reports', icon: FileText },
    { name: 'Scenario Library', to: '/scenarios', icon: FolderKanban },
    { name: 'EOC Settings', to: '/settings', icon: Settings },
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
            EOC Operations
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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

        {/* EOC Incident Command Status Card */}
        <div className="p-3.5 m-3 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Incident Command</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            Greenfield City Operations • Autonomous Evacuation Engine Online
          </p>
        </div>
      </aside>
    </>
  );
};
