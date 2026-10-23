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
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'timeline' | 'bpr_math' | 'shelters'
  >('timeline');

  const selectedEdge: GraphEdge | undefined =
    selectedTarget?.type === 'edge'
      ? snapshot.edges.find((e) => e.id === selectedTarget.id)
      : snapshot.edges.find((e) => e.id === 'E01');

  const selectedNode: GraphNode | undefined =
    selectedTarget?.type === 'node'
      ? snapshot.nodes.find((n) => n.id === selectedTarget.id)
      : undefined;

  const bprMetrics = selectedEdge
    ? calculateBPRMetrics(selectedEdge)
    : undefined;

  const centralBridge = snapshot.edges.find((e) => e.id === 'E05');
  const shelters = snapshot.nodes.filter((n) => n.category === 'shelter');

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-4">
      {/* TOP BAR ROW: Left Zoom Controls + Center Layer Bar + Right Telemetry Summary */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Zoom & Reset Pill */}
        <div
          className="pointer-events-auto flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-md"
          role="toolbar"
          aria-label="Viewport camera zoom controls"
        >
          <button
            type="button"
            onClick={() => onZoom(0.8)}
            aria-label="Zoom in 3D view"
            title="Zoom In"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ZoomIn className="h-4 w-4 text-slate-800" />
          </button>
          <button
            type="button"
            onClick={() => onZoom(1.25)}
            aria-label="Zoom out 3D view"
            title="Zoom Out"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ZoomOut className="h-4 w-4 text-slate-800" />
          </button>
          <div className="my-0.5 h-px w-6 bg-slate-200" />
          <button
            type="button"
            onClick={() => onSelectPreset('isometric')}
            aria-label="Reset 3D camera view"
            title="Reset 3D Isometric View"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Maximize2 className="h-4 w-4 text-slate-800" />
          </button>
        </div>

        {/* Top-Center Interactive Layer Bar */}
        <div className="pointer-events-auto relative flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-md">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Layers className="h-4 w-4 text-slate-600" />
          </div>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={layers.agents}
              onChange={() => onToggleLayer('agents')}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600"
            />
            <span className="font-semibold text-slate-800 tabular-nums">
              Agents ({snapshot.activeAgentCount})
            </span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={layers.hazard}
              onChange={() => onToggleLayer('hazard')}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600"
            />
            <span className="font-semibold text-slate-800">Hazard</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={layers.shelters}
              onChange={() => onToggleLayer('shelters')}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600"
            />
            <span className="font-semibold text-slate-800">Shelters</span>
          </label>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none">
            <input
              type="checkbox"
              checked={layers.labels}
              onChange={() => onToggleLayer('labels')}
              className="h-4 w-4 rounded border-slate-300 accent-sky-600"
            />
            <span className="font-semibold text-slate-800">3D Badges</span>
          </label>

          <div className="h-4 w-px bg-slate-200" />

          <button
            type="button"
            onClick={() => setShowLegend((prev) => !prev)}
            aria-expanded={showLegend}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
              showLegend
                ? 'bg-slate-900 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            Legend
          </button>

          {/* Popover Legend & Mobility Mix Card (Light Theme) */}
          {showLegend && (
            <div
              role="region"
              aria-label="Simulation Legend and Mobility Mix"
              className="absolute right-0 top-13 z-30 w-80 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-xl"
            >
              <div className="mb-2.5 flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-900">
                  3D Network & Agent Diversity Legend
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  G = (20V, 32E)
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sky-700">
                    Standard Citizens (70%)
                  </span>
                  <span className="font-mono text-slate-600">1.00x Speed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-amber-700">
                    Slow / Elderly / Vulnerable (20%)
                  </span>
                  <span className="font-mono text-slate-600">0.65x Speed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-emerald-700">
                    Fast / Emergency Vehicles (10%)
                  </span>
                  <span className="font-mono text-slate-600">1.35x Speed</span>
                </div>
                <div className="my-2 h-px bg-slate-100" />
                <div className="flex items-center justify-between">
                  <span className="text-red-600 font-semibold">
                    Crimson Corridor (&gt;165% Load)
                  </span>
                  <span className="font-mono text-slate-600">
                    BPR Critical Jam
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sky-600 font-semibold">
                    Azure Corridor (&lt;160% Load)
                  </span>
                  <span className="font-mono text-slate-600">Free-Flowing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-teal-700 font-semibold">
                    Teal Stripe Corridor
                  </span>
                  <span className="font-mono text-slate-600">
                    Contra-Flow (1.85x Cap)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Compact Telemetry Summary (Light Theme) */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-700 shadow-md">
          <div>
            <span className="text-slate-500">Clearance ETA:</span>{' '}
            <span className="font-mono font-bold text-emerald-700 tabular-nums">
              {snapshot.estimatedClearanceMinutes} min
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <div>
            <span className="text-slate-500">Mean Speed:</span>{' '}
            <span className="font-mono font-bold text-sky-700 tabular-nums">
              {snapshot.averageSpeedKmh} km/h
            </span>
          </div>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <div>
            <span className="text-slate-500">Reroutes:</span>{' '}
            <span className="font-mono font-bold text-amber-700 tabular-nums">
              {snapshot.rerouteEventsCount}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Side-by-Side Greenfield City Badge + Collapsible Control Dock (Light Theme) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 w-full">
        {/* Bottom-Left Greenfield City Card */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-3 self-start lg:self-end rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-md">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
              Greenfield City
            </div>
            <div className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Simulated Road Graph · 20 Nodes, 32 Edges
            </div>
          </div>
        </div>

        {/* Collapsible Bottom Control Dock (Light Theme) */}
        <div className="pointer-events-auto flex flex-1 max-w-[960px] flex-col items-center lg:items-end">
          <button
            type="button"
            onClick={() => setIsDockCollapsed((prev) => !prev)}
            aria-expanded={!isDockCollapsed}
            className="flex items-center gap-1.5 rounded-t-lg border border-b-0 border-slate-200 bg-white px-4 py-1 text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                <span>Show Simulation & BPR Math Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>

          {!isDockCollapsed && (
            <div className="w-full rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-xl">
              {/* Top Mode Tabs + Camera Presets Strip */}
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div
                  className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                  role="tablist"
                  aria-label="Simulation panel mode"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'timeline'}
                    onClick={() => setActiveTab('timeline')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeTab === 'timeline'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Timeline & Chokepoints
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'bpr_math'}
                    onClick={() => setActiveTab('bpr_math')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeTab === 'bpr_math'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    BPR Cost & Speed Formula
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'shelters'}
                    onClick={() => setActiveTab('shelters')}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                      activeTab === 'shelters'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Safe Shelters (4)
                  </button>
                </div>

                {/* Camera View Presets */}
                <div className="flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[11px] font-medium text-slate-500">
                    Camera:
                  </span>
                  {(
                    [
                      { id: 'isometric', label: '3D Isometric' },
                      { id: 'topdown', label: 'Top-Down Map' },
                      { id: 'chokepoint', label: 'Central Bridge (X)' },
                      { id: 'west_arena', label: '334% Jam Corridor' },
                      { id: 'north_corridor', label: 'North Shelter' },
                    ] as { id: CameraPresetId; label: string }[]
                  ).map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onSelectPreset(preset.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                        activePreset === preset.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAB 1: TIMELINE & CHOKEPOINT INTERVENTION */}
              {activeTab === 'timeline' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Playback Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onTogglePlay}
                      className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause Simulation</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          <span>Play Simulation</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onStepForward}
                      disabled={isPlaying}
                      title="Step forward 1 cycle when paused"
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      <StepForward className="h-3.5 w-3.5" />
                      <span>Step +1</span>
                    </button>

                    <button
                      type="button"
                      onClick={onReset}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                      <FastForward className="ml-1.5 h-3.5 w-3.5 text-slate-500" />
                      {[0.5, 1, 2].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => onChangeSimSpeed(spd)}
                          className={`rounded px-2 py-1 font-mono text-[11px] transition-colors ${
                            simSpeed === spd
                              ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real-World Policy Interventions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleEdgeBlockage('E05')}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        centralBridge?.isBlocked
                          ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>
                        Central Bridge (N6-N10):{' '}
                        {centralBridge?.isBlocked ? 'BLOCKED (X)' : 'OPEN'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleGlobalContraFlow}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        contraFlowGlobal
                          ? 'border-teal-400 bg-teal-50 text-teal-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>
                        Contra-Flow Lanes:{' '}
                        {contraFlowGlobal ? 'ACTIVE (-28% ETA)' : 'OFF'}
                      </span>
                    </button>
                  </div>

                  {/* Cycle & Bottleneck Readout */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-mono tabular-nums">
                    <span>Cycle #{snapshot.step}</span>
                    <span aria-hidden="true">·</span>
                    <span>T+{snapshot.elapsedMinutes.toFixed(1)}m</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-red-600 font-bold">
                      Peak Jam:{' '}
                      {snapshot.criticalBottlenecks[0]
                        ? `${snapshot.criticalBottlenecks[0].loadPct}%`
                        : 'Normal'}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: BPR MATHEMATICAL ARCHITECTURE & LIVE CORRIDOR INSPECTOR */}
              {activeTab === 'bpr_math' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-12 items-center text-xs">
                  <div className="md:col-span-5 flex flex-col gap-1.5 border-r border-slate-200 pr-3">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="corridor-select"
                        className="font-semibold text-slate-800"
                      >
                        Inspect Road Corridor (32 Edges):
                      </label>
                      {selectedNode && (
                        <span className="text-sky-700 font-mono font-semibold">
                          Node: {selectedNode.label} ({selectedNode.id})
                        </span>
                      )}
                    </div>
                    <select
                      id="corridor-select"
                      aria-label="Inspect Road Corridor"
                      value={selectedEdge?.id ?? 'E01'}
                      onChange={(e) =>
                        onSelectTarget({ type: 'edge', id: e.target.value })
                      }
                      className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-900"
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
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onToggleEdgeBlockage(selectedEdge.id)}
                          className="rounded border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                        >
                          {selectedEdge.isBlocked
                            ? 'Unblock Corridor'
                            : 'Block Corridor (X)'}
                        </button>
                        <button
                          type="button"
                          disabled={selectedEdge.isBlocked}
                          onClick={() =>
                            onToggleEdgeContraFlow(selectedEdge.id)
                          }
                          className="rounded border border-teal-300 bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-40"
                        >
                          {selectedEdge.isContraFlow
                            ? 'Disable Contra-Flow'
                            : 'Enable Contra-Flow (1.85x Cap)'}
                        </button>
                      </div>
                    )}
                  </div>

                  {selectedEdge && bprMetrics && (
                    <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <div className="text-[10px] text-slate-500">
                          T_base (L / V_max)
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                          {bprMetrics.freeFlowTimeSec.toFixed(1)}s
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {selectedEdge.length}m @ {selectedEdge.baseSpeed}km/h
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <div className="text-[10px] text-slate-500">
                          BPR Congestion Penalty
                        </div>
                        <div className="text-sm font-bold text-amber-700">
                          {Number.isFinite(bprMetrics.congestionPenaltySec)
                            ? `+${bprMetrics.congestionPenaltySec.toFixed(1)}s`
                            : '∞ (BLOCKED)'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Load: {selectedEdge.currentLoad}/
                          {Math.round(bprMetrics.effectiveCapacity)} (
                          {bprMetrics.loadPercentage}%)
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <div className="text-[10px] text-slate-500">
                          Hazard Penalty (×1.5)
                        </div>
                        <div className="text-sm font-bold text-sky-700">
                          {Number.isFinite(bprMetrics.hazardPenaltySec)
                            ? `+${bprMetrics.hazardPenaltySec.toFixed(1)}s`
                            : '∞'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Exposure: {(selectedEdge.hazardExposure * 100).toFixed(0)}%
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <div className="text-[10px] text-slate-500">
                          Effective Crawl Speed
                        </div>
                        <div className="text-sm font-bold text-emerald-700">
                          {bprMetrics.effectiveSpeedKmh.toFixed(1)} km/h
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Total Cost:{' '}
                          {Number.isFinite(bprMetrics.totalTravelCostSec)
                            ? `${bprMetrics.totalTravelCostSec.toFixed(1)}s`
                            : '∞'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: 4 EMERGENCY SAFE SHELTERS CAPACITY MONITOR */}
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
                        onClick={() =>
                          onSelectTarget({ type: 'node', id: sh.id })
                        }
                        className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-left hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {sh.label}
                          </span>
                          <ShieldCheck
                            className={`h-4 w-4 shrink-0 ${
                              isFull ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          />
                        </div>
                        <div className="mt-2 flex items-baseline justify-between font-mono tabular-nums">
                          <span
                            className={
                              isFull
                                ? 'text-amber-700 font-bold'
                                : 'text-emerald-700 font-bold'
                            }
                          >
                            {isFull ? '[FULL]' : 'OPEN'} {occ}/{cap} beds
                          </span>
                          <span className="text-[11px] text-slate-500">
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
        </div>
      </div>
    </div>
  );
};
