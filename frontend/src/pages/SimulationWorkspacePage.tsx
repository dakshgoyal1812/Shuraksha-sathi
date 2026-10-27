import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Activity,
  Layers,
  Shield,
  AlertTriangle,
  Building,
  Clock,
  BarChart3,
  Sliders,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { GreenfieldMap } from '../components/GreenfieldMap';
import { api } from '../services/api';
import {
  Scenario,
  SimulationRun,
  SimulationStepSnapshot,
  TimelineEvent,
} from '../types/scenario';

export const SimulationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [simulationRun, setSimulationRun] = useState<SimulationRun | null>(null);

  // Playback control state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [selectedEventFilter, setSelectedEventFilter] = useState<'all' | 'alerts' | 'shelter'>('all');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  const loadWorkspace = async () => {
    try {
      const gMap = await api.getDefaultMap();
      setMapData(gMap);

      if (id && id !== 'default') {
        const scen = await api.getScenario(id);
        setScenario(scen);
        try {
          const run = await api.getLatestSimulationRun(id);
          setSimulationRun(run);
          setCurrentStepIndex(0);
        } catch {
          // If no run exists, automatically trigger one
          handleRunFreshSimulation();
        }
      } else {
        // Fallback to first available scenario
        const list = await api.getScenarios();
        if (list.length > 0) {
          const first = await api.getScenario(list[0].id);
          setScenario(first);
          try {
            const run = await api.getLatestSimulationRun(first.id);
            setSimulationRun(run);
            setCurrentStepIndex(0);
          } catch {
            handleRunFreshSimulation();
          }
        }
      }
    } catch (e) {
      console.error('Error loading simulation workspace:', e);
    }
  };

  const handleRunFreshSimulation = async () => {
    if (!scenario) return;
    setIsSimulating(true);
    setIsPlaying(false);
    try {
      const run = await api.runSimulation(scenario.id);
      setSimulationRun(run);
      setCurrentStepIndex(0);
    } catch (err: any) {
      alert('Failed to execute simulation engine: ' + err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Playback Timer logic
  useEffect(() => {
    if (isPlaying && simulationRun && simulationRun.step_snapshots.length > 0) {
      const intervalMs = Math.max(100, 1000 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= simulationRun.step_snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, simulationRun]);

  const handleStepForward = () => {
    if (!simulationRun) return;
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(simulationRun.step_snapshots.length - 1, prev + 1));
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const currentSnapshot: SimulationStepSnapshot | undefined =
    simulationRun?.step_snapshots[currentStepIndex];

  const filteredEvents: TimelineEvent[] = (simulationRun?.timeline_events || []).filter((e) => {
    if (selectedEventFilter === 'alerts') return e.severity === 'danger' || e.severity === 'warning';
    if (selectedEventFilter === 'shelter') return e.event_type.includes('SHELTER');
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Mission Control Bar */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              {scenario ? scenario.name : 'Simulation Workspace'}
            </h1>
            {scenario && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-[#0F172A] border border-[#E1E7EF] uppercase">
                {scenario.disaster_type} • {scenario.severity}
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Greenfield City road network • Population: {scenario?.population_size.toLocaleString() || 600} agents
          </p>
        </div>

        {/* Playback Controls & Speed */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-[#E1E7EF]">
          {/* Run/Recompute Engine */}
          <button
            onClick={handleRunFreshSimulation}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-semibold text-xs transition disabled:opacity-50 shadow-xs"
            title="Execute graph simulation engine"
          >
            <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Computing...' : 'Run Simulation'}</span>
          </button>

          <span className="text-slate-300">|</span>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!simulationRun}
            className={`p-2 rounded-lg text-xs font-semibold transition ${
              isPlaying
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-[#E1E7EF] hover:bg-slate-100 text-slate-800'
            } disabled:opacity-40`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Step Forward */}
          <button
            onClick={handleStepForward}
            disabled={!simulationRun || isPlaying}
            className="p-2 rounded-lg bg-white border border-[#E1E7EF] hover:bg-slate-100 text-slate-700 transition disabled:opacity-40"
            title="Step Forward (1 frame)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={handleResetPlayback}
            disabled={!simulationRun}
            className="p-2 rounded-lg bg-white border border-[#E1E7EF] hover:bg-slate-100 text-slate-700 transition disabled:opacity-40"
            title="Reset to step 0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="text-slate-300">|</span>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition ${
                  playbackSpeed === spd
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200/60'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <span className="text-slate-300">|</span>

          {/* Simulated Time & Step Indicator */}
          <div className="flex items-center gap-2 font-mono text-xs text-[#0F172A] pl-1 font-semibold">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>
              T+{currentSnapshot ? currentSnapshot.simulated_time_min.toFixed(1) : '0.0'} min
            </span>
            <span className="text-[#64748B] font-normal">
              (Step {currentSnapshot ? currentSnapshot.step : 0}/{simulationRun?.total_steps || 0})
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Config, Center Map, Right Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Parameters & Closures */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E7EF]">
              <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-700" />
                Drill Parameters
              </span>
              <Link to={`/scenarios/${scenario?.id}/edit`} className="text-slate-900 font-semibold hover:underline">
                Edit
              </Link>
            </div>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Population:</span>
                <span className="font-mono font-bold text-[#0F172A]">{scenario?.population_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Blocked Roads:</span>
                <span className="font-mono font-bold text-rose-600">{scenario?.blocked_roads.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Speed Multiplier:</span>
                <span className="font-mono text-[#0F172A]">{scenario?.speed_multiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Capacity Multiplier:</span>
                <span className="font-mono text-[#0F172A]">{scenario?.capacity_multiplier}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Staggered Evac:</span>
                <span className="font-medium text-[#0F172A]">{scenario?.staggered_evacuation ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E1E7EF]">
              <span className="text-[#64748B] block mb-1 font-semibold text-[11px]">Active Road Closures:</span>
              <div className="flex flex-wrap gap-1">
                {scenario?.blocked_roads && scenario.blocked_roads.length > 0 ? (
                  scenario.blocked_roads.map((r: string) => (
                    <span key={r} className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] font-semibold">
                      {r} (Closed)
                    </span>
                  ))
                ) : (
                  <span className="text-[#64748B] text-[11px]">No roads closed.</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Analytics Nav Link */}
          {simulationRun && (
            <Link
              to={`/analytics/${scenario?.id}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-black text-white hover:bg-slate-800 text-xs font-semibold transition shadow-xs group"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-white" />
                <span>View Full Analytics Dashboard</span>
              </div>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          )}

          {/* Active Bottlenecks List */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs text-xs">
            <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] block pb-2 mb-2 border-b border-[#E1E7EF]">
              Identified Choke Points
            </span>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {simulationRun?.bottlenecks && simulationRun.bottlenecks.length > 0 ? (
                simulationRun.bottlenecks.map((b) => (
                  <div key={b.road_id} className="p-2.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                    <div className="flex justify-between font-semibold text-[#0F172A]">
                      <span>{b.road_name}</span>
                      <span className="text-amber-700 font-mono font-bold">{b.congestion_ratio}x</span>
                    </div>
                    <div className="flex justify-between text-[#64748B] text-[10px] mt-0.5">
                      <span>Load: {b.simulated_load} / {b.configured_capacity}</span>
                      <span>Delay: +{b.average_delay_seconds}s</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[#64748B] text-center py-4 italic">
                  No critical bottlenecks logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Greenfield City Interactive Map */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {mapData ? (
            <div className="rounded-2xl overflow-hidden border border-[#E1E7EF] shadow-xs">
              <GreenfieldMap
                nodes={mapData.nodes}
                edges={mapData.edges}
                shelters={mapData.shelters}
                hazardZone={mapData.hazard_zone}
                blockedRoads={scenario?.blocked_roads || []}
                agents={currentSnapshot?.sample_agents || []}
                roadCongestion={currentSnapshot?.road_congestion || {}}
                activeBottlenecks={currentSnapshot?.active_bottlenecks || []}
                shelterOccupancies={currentSnapshot?.shelter_occupancy || {}}
                height="580px"
              />
            </div>
          ) : (
            <div className="h-[580px] rounded-2xl bg-white border border-[#E1E7EF] flex items-center justify-center text-[#64748B] text-xs shadow-xs">
              Loading Greenfield City Road Network...
            </div>
          )}

          {/* Interactive Timeline Scrubbing Slider */}
          {simulationRun && simulationRun.step_snapshots.length > 0 && (
            <div className="p-4 bg-white border border-[#E1E7EF] rounded-2xl shadow-xs flex items-center gap-4 text-xs">
              <span className="text-[#64748B] font-mono font-medium whitespace-nowrap">Timeline Scrub:</span>
              <input
                type="range"
                min="0"
                max={simulationRun.step_snapshots.length - 1}
                value={currentStepIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStepIndex(parseInt(e.target.value));
                }}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <span className="font-mono text-[#0F172A] font-semibold whitespace-nowrap">
                Step {currentSnapshot?.step} (T+{currentSnapshot?.simulated_time_min}m)
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Live Metrics & Shelter Capacity */}
        <div className="lg:col-span-3 space-y-4">
          {/* Live Progress Gauges */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs text-xs space-y-3">
            <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] block pb-2 border-b border-[#E1E7EF]">
              Live Evacuation Status
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-slate-700 mb-1">
                  <span className="text-[#64748B] font-medium">Evacuation Rate:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {currentSnapshot ? `${currentSnapshot.evacuation_pct}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${currentSnapshot?.evacuation_pct || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[#64748B] block font-medium">In Transit</span>
                  <span className="font-mono font-bold text-blue-600 text-sm">
                    {currentSnapshot?.moving_count || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[#64748B] block font-medium">Safely Arrived</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {currentSnapshot?.evacuated_count || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[#64748B] block font-medium">Awaiting</span>
                  <span className="font-mono font-bold text-[#0F172A] text-sm">
                    {currentSnapshot?.waiting_count || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[#64748B] block font-medium">Unreachable</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    {currentSnapshot?.unreachable_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Shelter Occupancies */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs text-xs space-y-3">
            <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] block pb-2 border-b border-[#E1E7EF]">
              Shelter Capacities & Load
            </span>

            <div className="space-y-2.5">
              {mapData?.shelters.map((sh: any) => {
                const occ = currentSnapshot?.shelter_occupancy[sh.id] ?? sh.assigned_population;
                const cap = sh.capacity;
                const pct = Math.min(100, Math.round((occ / Math.max(1, cap)) * 100));
                const isFull = pct >= 100;

                return (
                  <div key={sh.id} className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-medium text-[#0F172A]">{sh.name}</span>
                      <span className="font-mono text-[#64748B]">
                        {occ} / {cap} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          isFull ? 'bg-rose-500' : (pct >= 80 ? 'bg-amber-500' : 'bg-slate-900')
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Event Log */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E7EF]">
              <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
                Event Log
              </span>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setSelectedEventFilter('all')}
                  className={`px-2 py-0.5 rounded-lg font-semibold ${selectedEventFilter === 'all' ? 'bg-slate-900 text-white' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedEventFilter('alerts')}
                  className={`px-2 py-0.5 rounded-lg font-semibold ${selectedEventFilter === 'alerts' ? 'bg-rose-600 text-white' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  Alerts
                </button>
                <button
                  onClick={() => setSelectedEventFilter('shelter')}
                  className={`px-2 py-0.5 rounded-lg font-semibold ${selectedEventFilter === 'shelter' ? 'bg-emerald-600 text-white' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                >
                  Shelters
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredEvents.map((ev, i) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-slate-50/70 border border-[#E1E7EF] text-[11px] flex items-start gap-1.5"
                >
                  <span className="font-mono text-slate-900 font-semibold shrink-0 text-[10px]">T+{ev.time_min}m</span>
                  <span className="text-[#334155] leading-tight">{ev.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
