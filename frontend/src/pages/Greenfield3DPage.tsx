import React from 'react';
import { Greenfield3DScene } from '../components/Greenfield3DScene';
import { Boxes, Info } from 'lucide-react';

export const Greenfield3DPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-3">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-white px-4 py-3 sm:py-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Boxes className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Interactive WebGL Simulation
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Greenfield City 3D Evacuation Model
          </h1>
          <p className="text-xs text-slate-500">
            Real-time agent-based micro-simulation with BPR traffic physics, river flood hazard zone, and dynamic contra-flow controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Use mouse left-click to orbit, right-click to pan, scroll to zoom.</span>
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div className="w-full">
        <Greenfield3DScene height="calc(100vh - 12rem)" className="min-h-[500px]" />
      </div>
    </div>
  );
};
