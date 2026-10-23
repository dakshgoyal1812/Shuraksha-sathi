import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  RefreshCw,
  AlertOctagon,
  ChevronDown,
  Menu,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioListItem } from '../types/scenario';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeScenarioId?: string;
  onScenarioChange?: (scenarioId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeScenarioId,
  onScenarioChange,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [backendHealthy, setBackendHealthy] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadScenarios();
    checkHealth();
    const interval = setInterval(() => {
      checkHealth();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadScenarios = async () => {
    try {
      const data = await api.getScenarios();
      setScenarios(data);
      if (!activeScenarioId && data.length > 0 && onScenarioChange) {
        onScenarioChange(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkHealth = async () => {
    try {
      await api.checkHealth();
      setBackendHealthy(true);
    } catch {
      setBackendHealthy(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm("Reset all scenarios and simulation runs to Greenfield City demonstration defaults?")) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemo();
      await loadScenarios();
      window.location.reload();
    } catch (err) {
      alert("Failed to reset demo: " + err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu & Logo */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center p-1 shadow-sm border border-slate-800 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] tracking-tight text-[#0F172A] group-hover:text-slate-700 transition-colors">
                EvacuSafe
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                EOC Platform
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] hidden sm:block">
              Simulate Today. Save Lives Tomorrow.
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Simulated Environment Banner */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-slate-800">ENVIRONMENT:</span>
        <span className="text-slate-900 font-mono font-medium">GREENFIELD CITY (SYNTHETIC)</span>
      </div>

      {/* Right: Scenario Switcher & Actions */}
      <div className="flex items-center gap-2.5">
        {scenarios.length > 0 && (
          <div className="relative">
            <select
              value={activeScenarioId || ''}
              onChange={(e) => onScenarioChange?.(e.target.value)}
              className="bg-white text-slate-800 text-xs rounded-xl border border-[#E2E8F0] shadow-xs px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-slate-900 font-medium cursor-pointer"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.disaster_type})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        )}

        {/* Reset Demo Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl shadow-xs transition"
          title="Reset to official Greenfield City demo drill"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-slate-900' : ''}`} />
          <span className="hidden sm:inline">Reset Drill</span>
        </button>

        {/* Backend Connectivity Status */}
        <div
          className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl border ${
            backendHealthy
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={backendHealthy ? "Simulation Engine Connected" : "Backend Disconnected"}
        >
          {backendHealthy ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden xl:inline">Engine Online</span>
            </>
          ) : (
            <>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

