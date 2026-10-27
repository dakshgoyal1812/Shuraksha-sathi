import React, { useState } from 'react';
import {
  calculateBPRMetrics,
  GraphEdge,
  GraphNode,
  SimulationSnapshot,
} from '../simulation/engine';
import {
  CameraPresetId,
  LayerVisibility,
  SelectionTarget,
} from '../three/GreenfieldScene';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  FastForward,
  Layers,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  StepForward,
  ZoomIn,
  ZoomOut,
  X,
  Gauge,
} from 'lucide-react';

interface ControlOverlayProps {
  snapshot: SimulationSnapshot;
  layers: LayerVisibility;
  onToggleLayer: (key: keyof LayerVisibility) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSimSpeed: (speed: number) => void;
  activePreset: CameraPresetId;
  onSelectPreset: (preset: CameraPresetId) => void;
  onZoom: (factor: number) => void;
  selectedTarget: SelectionTarget | null;
  onSelectTarget: (target: SelectionTarget | null) => void;
  onToggleEdgeBlockage: (edgeId: string) => void;
  onToggleEdgeContraFlow: (edgeId: string) => void;
  contraFlowGlobal: boolean;
  onToggleGlobalContraFlow: () => void;
}

export const ControlOverlay: React.FC<ControlOverlayProps> = ({
  snapshot,
  layers,
  onToggleLayer,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  simSpeed,
  onChangeSimSpeed,
  activePreset,
  onSelectPreset,
  onZoom,
  selectedTarget,
  onSelectTarget,
  onToggleEdgeBlockage,
  onToggleEdgeContraFlow,
  contraFlowGlobal,
  onToggleGlobalContraFlow,
}) => {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeTab, setActiveTab] = useState<'bpr_math' | 'shelters'>('bpr_math');

  const selectedEdge: GraphEdge | undefined =
    selectedTarget?.type === 'edge'
      ? snapshot.edges.find((e) => e.id === selectedTarget.id)
      : snapshot.edges[0];

  const selectedNode: GraphNode | undefined =
    selectedTarget?.type === 'node'
      ? snapshot.nodes.find((n) => n.id === selectedTarget.id)
      : undefined;

  const bprMetrics = selectedEdge
    ? calculateBPRMetrics(selectedEdge)
    : undefined;

  const centralBridge = snapshot.edges.find((e) => e.id === 'R-10' || e.id === 'E05');
  const shelters = snapshot.nodes.filter((n) => n.category === 'shelter');

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3.5 sm:p-4">
      {/* TOP BAR: Left Zoom Controls + Center Layer Bar + Right Telemetry Summary */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left Zoom & Reset Pill */}
        <div
          className="pointer-events-auto flex flex-col items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-1.5 text-slate-900 shadow-md"
          role="toolbar"
          aria-label="Viewport camera zoom controls"
        >
          <button
            type="button"
            onClick={() => onZoom(0.8)}
            aria-label="Zoom in 3D view"
            title="Zoom In"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onZoom(1.25)}
            aria-label="Zoom out 3D view"
            title="Zoom Out"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="my-0.5 h-px w-5 bg-slate-200" />
          <button
            type="button"
            onClick={() => onSelectPreset('isometric')}
            aria-label="Reset 3D camera view"
            title="Reset 3D Isometric View"
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-700 transition"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Top-Center Interactive Layer Bar */}
        <div className="pointer-events-auto relative flex flex-wrap items-center gap-3 sm:gap-4 rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-md">
          <div className="flex items-center gap-1 text-slate-500">
            <Layers className="h-3.5 w-3.5" />
          </div>

          <label className="flex cursor-pointer items-center gap-1.5 select-none">
            <input
              type="checkbox"
              checked={layers.agents}
              onChange={() => onToggleLayer('agents')}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600"
            />
            <span className="text-slate-800 tabular-nums">
              Agents ({snapshot.activeAgentCount})
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-1.5 select-none">
            <input
              type="checkbox"
              checked={layers.hazard}
              onChange={() => onToggleLayer('hazard')}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600"
            />
            <span className="text-slate-800">Hazard</span>
          </label>

          <label className="flex cursor-pointer items-center gap-1.5 select-none">
            <input
              type="checkbox"
              checked={layers.shelters}
              onChange={() => onToggleLayer('shelters')}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600"
            />
            <span className="text-slate-800">Shelters</span>
          </label>

          <label className="flex cursor-pointer items-center gap-1.5 select-none">
            <input
              type="checkbox"
              checked={layers.labels}
              onChange={() => onToggleLayer('labels')}
              className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600"
            />
            <span className="text-slate-800">3D Badges</span>
          </label>

          <div className="h-3.5 w-px bg-slate-200" />

          <button
            type="button"
            onClick={() => setShowLegend((prev) => !prev)}
            aria-expanded={showLegend}
            className={`rounded-md px-2 py-0.5 text-xs font-semibold transition ${
              showLegend
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Legend
          </button>

          {/* Popover Legend Card */}
          {showLegend && (
            <div
              role="region"
              aria-label="Simulation Legend and Mobility Mix"
              className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-700 shadow-xl"
            >
              <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-900">
                  Network & Fleet Legend
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  G = (20V, 32E)
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sky-700">Standard Fleet (70%)</span>
                  <span className="font-mono text-slate-500">1.00x Speed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-amber-700">Heavy / Slow (20%)</span>
                  <span className="font-mono text-slate-500">0.75x Speed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-emerald-700">Priority / Fast (10%)</span>
                  <span className="font-mono text-slate-500">1.25x Speed</span>
                </div>
                <div className="my-1.5 border-t border-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-600">Bottlenecks</span>
                  <span className="font-mono text-slate-500">&gt;125% Load</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-teal-600">Contra-Flow</span>
                  <span className="font-mono text-slate-500">1.85x Cap</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Telemetry Summary */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-md px-3.5 py-1.5 text-xs text-slate-700 shadow-md">
          <div>
            <span className="text-slate-400">Clearance ETA:</span>{' '}
            <span className="font-mono font-bold text-emerald-700 tabular-nums">
              {snapshot.estimatedClearanceMinutes}m
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <div>
            <span className="text-slate-400">Speed:</span>{' '}
            <span className="font-mono font-bold text-sky-700 tabular-nums">
              {snapshot.averageSpeedKmh} km/h
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <div>
            <span className="text-slate-400">Network:</span>{' '}
            <span className="font-mono font-bold text-slate-800 tabular-nums">
              20 Nodes · 32 Corridors
            </span>
          </div>
        </div>
      </div>

      {/* Centered Floating Mission Control Dock & Drawer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3.5 z-20 flex flex-col items-center px-3 sm:px-4">
        {/* Collapsible Detail Drawer (BPR Math / Shelters) */}
        {isInspectorOpen && (
          <div className="pointer-events-auto w-full max-w-3xl mb-2 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl p-3 sm:p-4 text-slate-900 shadow-2xl transition-all">
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('bpr_math')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'bpr_math'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  BPR Delay Formula & Inspector
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shelters')}
                  className={`px-3 py-1 rounded-md transition ${
                    activeTab === 'shelters'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Safe Shelters (4)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                title="Close Inspector"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TAB 1: BPR Math & Corridor Inspector */}
            {activeTab === 'bpr_math' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
                <div className="md:col-span-5 flex flex-col gap-1.5 border-r border-slate-100 pr-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Select Road Corridor:
                    </span>
                    {selectedNode && (
                      <span className="text-sky-700 font-mono font-semibold text-[11px]">
                        Node: {selectedNode.label}
                      </span>
                    )}
                  </div>
                  <select
                    id="corridor-select"
                    aria-label="Inspect Road Corridor"
                    value={selectedEdge?.id ?? snapshot.edges[0]?.id ?? 'R-1'}
                    onChange={(e) =>
                      onSelectTarget({ type: 'edge', id: e.target.value })
                    }
                    className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-900"
                  >
                    {snapshot.edges.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.id}: {e.name} ({e.from}→{e.to}) —{' '}
                        {e.isBlocked
                          ? 'BLOCKED [X]'
                          : `${Math.round(e.loadRatio * 100)}% LOAD`}
                      </option>
                    ))}
                  </select>

                  {selectedEdge && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => onToggleEdgeBlockage(selectedEdge.id)}
                        className="rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {selectedEdge.isBlocked
                          ? 'Unblock Corridor'
                          : 'Block Corridor (X)'}
                      </button>
                      <button
                        type="button"
                        disabled={selectedEdge.isBlocked}
                        onClick={() => onToggleEdgeContraFlow(selectedEdge.id)}
                        className="rounded-lg border border-teal-300 bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-40"
                      >
                        {selectedEdge.isContraFlow
                          ? 'Disable Contra-Flow'
                          : 'Enable Contra-Flow (1.85x)'}
                      </button>
                    </div>
                  )}
                </div>

                {selectedEdge && bprMetrics && (
                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums text-center">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                      <div className="text-[10px] text-slate-500">T_base</div>
                      <div className="text-xs font-bold text-slate-900">
                        {bprMetrics.freeFlowTimeSec.toFixed(1)}s
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {selectedEdge.length}m @ {selectedEdge.baseSpeed}km/h
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                      <div className="text-[10px] text-slate-500">BPR Penalty</div>
                      <div className="text-xs font-bold text-amber-700">
                        {Number.isFinite(bprMetrics.congestionPenaltySec)
                          ? `+${bprMetrics.congestionPenaltySec.toFixed(1)}s`
                          : '∞ (BLOCKED)'}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Load: {bprMetrics.loadPercentage}%
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                      <div className="text-[10px] text-slate-500">Hazard (×1.5)</div>
                      <div className="text-xs font-bold text-sky-700">
                        {Number.isFinite(bprMetrics.hazardPenaltySec)
                          ? `+${bprMetrics.hazardPenaltySec.toFixed(1)}s`
                          : '∞'}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Exp: {(selectedEdge.hazardExposure * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-1.5">
                      <div className="text-[10px] text-slate-500">Effective Speed</div>
                      <div className="text-xs font-bold text-emerald-700">
                        {bprMetrics.effectiveSpeedKmh.toFixed(1)} km/h
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Total: {Number.isFinite(bprMetrics.totalTravelCostSec) ? `${bprMetrics.totalTravelCostSec.toFixed(1)}s` : '∞'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 4 Safe Shelters */}
            {activeTab === 'shelters' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                {shelters.map((sh) => {
                  const occ = sh.occupied ?? 0;
                  const cap = sh.capacity ?? 200;
                  const pct = Math.min(100, Math.round((occ / cap) * 100));
                  const isFull = occ >= cap;
                  return (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => onSelectTarget({ type: 'node', id: sh.id })}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:border-emerald-500 transition"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-slate-900 truncate text-[11px]">
                          {sh.label}
                        </span>
                        <ShieldCheck
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isFull ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        />
                      </div>
                      <div className="mt-1 flex items-baseline justify-between font-mono tabular-nums text-[11px]">
                        <span
                          className={
                            isFull
                              ? 'text-amber-700 font-bold'
                              : 'text-emerald-700 font-bold'
                          }
                        >
                          {isFull ? '[FULL]' : 'OPEN'} {occ}/{cap}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {pct}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MAIN FLOATING CAPSULE DOCK (Ultra-sleek single-row mission control) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-xl px-2.5 sm:px-3.5 py-1.5 text-slate-900 shadow-xl max-w-full overflow-x-auto">
          {/* 1. Playback Cluster */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition shadow-xs ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onStepForward}
              disabled={isPlaying}
              title="Step forward 1 cycle (when paused)"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <StepForward className="h-3.5 w-3.5" />
              <span>Step</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              title="Reset Simulation"
              className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* Speed Buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60 text-xs">
              <FastForward className="ml-1 mr-0.5 h-3 w-3 text-slate-400" />
              {[0.5, 1, 2].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangeSimSpeed(spd)}
                  className={`rounded-lg px-1.5 py-0.5 font-mono text-[11px] font-semibold transition ${
                    simSpeed === spd
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* 2. Camera View Presets */}
          <div className="flex items-center gap-1 shrink-0">
            {[
              { id: 'isometric', label: '3D Iso' },
              { id: 'topdown', label: 'Top-Down' },
              { id: 'chokepoint', label: 'Bridge (X)' },
              { id: 'west_arena', label: 'Arena' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id as CameraPresetId)}
                className={`rounded-lg px-2 sm:px-2.5 py-1 text-xs font-semibold transition ${
                  activePreset === preset.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* 3. Real-World Policy Interventions */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleEdgeBlockage(centralBridge?.id || 'R-10')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                centralBridge?.isBlocked
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Bridge: {centralBridge?.isBlocked ? 'BLOCKED' : 'OPEN'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleGlobalContraFlow}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                contraFlowGlobal
                  ? 'border-teal-400 bg-teal-50 text-teal-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Contra-Flow: {contraFlowGlobal ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* 4. Drawer Inspector Toggle */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition ${
              isInspectorOpen
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Gauge className="h-3.5 w-3.5" />
            <span>{isInspectorOpen ? 'Hide Math' : 'BPR Math & Shelters'}</span>
            {isInspectorOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

