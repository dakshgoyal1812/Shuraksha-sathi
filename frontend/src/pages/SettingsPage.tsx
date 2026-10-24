import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Activity,
  RefreshCw,
  AlertTriangle,
  Server,
  Cpu,
  Database,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [defaultSpeed, setDefaultSpeed] = useState<number>(1);
  const [congestionThreshold, setCongestionThreshold] = useState<number>(1.0);
  const [randomSeed, setRandomSeed] = useState<number>(42);

  useEffect(() => {
    api.checkHealth().then(setHealthStatus).catch(() => setHealthStatus({ status: 'offline' }));
  }, []);

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all scenarios, shelters, and simulation records to default Greenfield City demonstration drill?')) {
      return;
    }
    setIsResetting(true);
    try {
      await api.resetDemo();
      alert('Database successfully reset to official Greenfield City demonstration drill.');
      window.location.reload();
    } catch (e: any) {
      alert('Failed to reset: ' + e.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              System Settings & Model Assumptions
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Simulation engine calibration, backend diagnostics, and mandatory civil protection disclaimers.
            </p>
          </div>
        </div>
      </div>

      {/* Backend Diagnostics Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-600" />
          Backend Runtime & Engine Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
            <span className="text-[#64748B] block mb-1 font-semibold text-[11px]">FastAPI Health</span>
            <div className="flex items-center gap-2 font-bold font-mono">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={healthStatus?.status === 'healthy' ? 'text-emerald-700' : 'text-red-700'}>
                {healthStatus?.status === 'healthy' ? 'ONLINE (PORT 8000)' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
            <span className="text-[#64748B] block mb-1 font-semibold text-[11px]">Graph Network Engine</span>
            <span className="font-bold text-[#0F172A] font-mono">NetworkX 3.2+ (Dijkstra)</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
            <span className="text-[#64748B] block mb-1 font-semibold text-[11px]">Database Persistence</span>
            <span className="font-bold text-[#0F172A] font-mono">SQLite (SQLAlchemy ORM)</span>
          </div>
        </div>
      </div>

      {/* Engine Calibration Preferences */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-600" />
          Engine Configuration Defaults
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-semibold">
              Congestion Detection Threshold: {congestionThreshold}x Capacity
            </label>
            <input
              type="range"
              min="0.75"
              max="1.50"
              step="0.05"
              value={congestionThreshold}
              onChange={(e) => setCongestionThreshold(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <span className="text-[#64748B] text-[11px] block">
              Roads exceeding this traffic ratio trigger yellow/red bottleneck flags.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-semibold">
              Default Deterministic Seed: {randomSeed}
            </label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value))}
              className="w-full bg-white border border-[#E1E7EF] rounded-xl px-3 py-2 text-[#0F172A] font-mono text-xs focus:outline-none focus:border-slate-900"
            />
            <span className="text-[#64748B] text-[11px] block">
              Ensures repeatable and fair multi-strategy comparison drills.
            </span>
          </div>
        </div>
      </div>

      {/* Database Maintenance & Demo Reset */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-600" />
          Demonstration Environment Reset
        </h2>
        <p className="text-[#64748B] leading-relaxed">
          Restore the official baseline Greenfield City flood drill scenario, pre-computed simulation results, and default shelter capacities.
        </p>

        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-semibold transition disabled:opacity-50 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset to Official Demo Drill'}</span>
        </button>
      </div>

      {/* Model Assumptions and Disclaimers (Section 28) */}
      <div className="p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs space-y-3 text-xs text-[#334155]">
        <div className="flex items-center gap-2 text-slate-900 font-bold uppercase tracking-wider text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Model Assumptions and Mandatory Planning Limitations</span>
        </div>

        <ul className="list-disc list-inside space-y-1.5 text-[#64748B] text-xs leading-relaxed">
          <li><b>Synthetic Population:</b> All virtual agents represent simulated individuals or vehicle units with configurable movement speeds.</li>
          <li><b>Mathematical Network:</b> Road capacities, travel times, and congestion delays follow calibrated discrete-time BPR density functions.</li>
          <li><b>Shelter Allocation:</b> Safe haven capacities represent physical urban planning quotas; agents dynamically reroute when capacities are met.</li>
          <li><b>Software-Only Platform:</b> No physical sensors, live CCTV, GPS tracking of real persons, IoT devices, or drones are utilized.</li>
          <li><b>Planning Decision Support:</b> SurakshaSathi is strictly designed for training exercises, municipal drills, and preparedness research. Simulation outcomes depend upon model input assumptions and do not replace certified emergency management protocols.</li>
        </ul>
      </div>
    </div>
  );
};
