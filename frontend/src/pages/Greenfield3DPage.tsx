import React from 'react';
import { Greenfield3DScene } from '../components/Greenfield3DScene';
import { Boxes, Compass, Info } from 'lucide-react';

export const Greenfield3DPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Boxes className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Interactive WebGL Simulation
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Greenfield City 3D Evacuation Model
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time agent-based micro-simulation with BPR traffic physics, river flood hazard zone, and dynamic contra-flow controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Use mouse left-click to orbit, right-click to pan, scroll to zoom.</span>
        </div>
      </div>

      {/* 3D Scene Viewport */}
      <div className="w-full">
        <Greenfield3DScene height="calc(100vh - 14rem)" />
      </div>
    </div>
  );
};
