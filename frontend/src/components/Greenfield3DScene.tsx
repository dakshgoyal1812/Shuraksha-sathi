import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ControlOverlay } from './ControlOverlay';
import {
  EvacuationSimulationEngine,
  SimulationSnapshot,
} from '../simulation/engine';
import {
  CameraPresetId,
  GreenfieldSceneManager,
  LayerVisibility,
  SelectionTarget,
} from '../three/GreenfieldScene';
import { AgentSnapshot } from '../types/scenario';
import { ZoomIn, ZoomOut, RotateCcw, Compass, Activity } from 'lucide-react';

export interface Greenfield3DSceneProps {
  height?: string;
  showOverlay?: boolean;
  className?: string;
  onTargetSelect?: (target: SelectionTarget | null) => void;
  initialBlockedRoads?: string[];
  mockdrillAgents?: AgentSnapshot[];
  mockdrillRoadCongestion?: Record<string, number>;
  mockdrillBottlenecks?: string[];
  mockdrillShelterOccupancy?: Record<string, number>;
  mockdrillBlockedRoads?: string[];
  isMockdrillActive?: boolean;
}

export const Greenfield3DScene: React.FC<Greenfield3DSceneProps> = ({
  height = '640px',
  showOverlay = true,
  className = '',
  onTargetSelect,
  initialBlockedRoads = [],
  mockdrillAgents,
  mockdrillRoadCongestion,
  mockdrillBottlenecks,
  mockdrillShelterOccupancy,
  mockdrillBlockedRoads,
  isMockdrillActive = false,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<EvacuationSimulationEngine | null>(null);
  const sceneManagerRef = useRef<GreenfieldSceneManager | null>(null);

  if (!engineRef.current) {
    const engine = new EvacuationSimulationEngine();
    const blockedList = mockdrillBlockedRoads || initialBlockedRoads;
    if (blockedList.length > 0) {
      blockedList.forEach((edgeId) => {
        engine.toggleEdgeBlockage(edgeId);
      });
    }
    engineRef.current = engine;
  }

  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(() =>
    engineRef.current!.getSnapshot()
  );
  const [layers, setLayers] = useState<LayerVisibility>({
    agents: true,
    hazard: true,
    shelters: true,
    labels: true,
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [activePreset, setActivePreset] = useState<CameraPresetId>('isometric');
  const [selectedTarget, setSelectedTarget] = useState<SelectionTarget | null>({
    type: 'edge',
    id: 'R-1',
  });
  const [contraFlowGlobal, setContraFlowGlobal] = useState<boolean>(false);

  useEffect(() => {
    const container = canvasMountRef.current;
    const engine = engineRef.current;
    if (!container || !engine) return;

    const manager = new GreenfieldSceneManager(
      container,
      engine.getSnapshot(),
      (dtSimSec) => {
        const nextSnap = engine.tick(dtSimSec);
        setSnapshot(nextSnap);
        return nextSnap;
      },
      (target) => {
        if (target) {
          setSelectedTarget(target);
          onTargetSelect?.(target);
        }
      }
    );

    sceneManagerRef.current = manager;

    // Initial mockdrill sync if already active
    if (isMockdrillActive || (mockdrillAgents && mockdrillAgents.length > 0)) {
      manager.syncMockdrillState({
        agents: mockdrillAgents || [],
        roadCongestion: mockdrillRoadCongestion || {},
        activeBottlenecks: mockdrillBottlenecks || [],
        shelterOccupancies: mockdrillShelterOccupancy || {},
        blockedRoads: mockdrillBlockedRoads || initialBlockedRoads || [],
      });
    }

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

  // Synchronize mockdrill simulation updates to 3D scene in real-time
  useEffect(() => {
    if (!sceneManagerRef.current) return;
    if (isMockdrillActive || (mockdrillAgents && mockdrillAgents.length > 0)) {
      sceneManagerRef.current.syncMockdrillState({
        agents: mockdrillAgents || [],
        roadCongestion: mockdrillRoadCongestion || {},
        activeBottlenecks: mockdrillBottlenecks || [],
        shelterOccupancies: mockdrillShelterOccupancy || {},
        blockedRoads: mockdrillBlockedRoads || initialBlockedRoads || [],
      });
    }
  }, [
    isMockdrillActive,
    mockdrillAgents,
    mockdrillRoadCongestion,
    mockdrillBottlenecks,
    mockdrillShelterOccupancy,
    mockdrillBlockedRoads,
    initialBlockedRoads,
  ]);

  const handleToggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      sceneManagerRef.current?.setLayerVisibility(next);
      return next;
    });
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setPlaying(next);
      return next;
    });
  }, []);

  const handleStepForward = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextSnap = engine.tick(5.0);
    setSnapshot(nextSnap);
    sceneManagerRef.current?.syncSnapshot(nextSnap);
  }, []);

  const handleReset = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextSnap = engine.reset();
    setContraFlowGlobal(false);
    setSnapshot(nextSnap);
    sceneManagerRef.current?.syncSnapshot(nextSnap);
  }, []);

  const handleChangeSimSpeed = useCallback((speed: number) => {
    setSimSpeed(speed);
    sceneManagerRef.current?.setSimSpeed(speed);
  }, []);

  const handleSelectPreset = useCallback((preset: CameraPresetId) => {
    setActivePreset(preset);
    sceneManagerRef.current?.setCameraPreset(preset);
  }, []);

  const handleZoom = useCallback((factor: number) => {
    sceneManagerRef.current?.zoomCamera(factor);
  }, []);

  const handleSelectTarget = useCallback(
    (target: SelectionTarget | null) => {
      setSelectedTarget(target);
      if (target) {
        sceneManagerRef.current?.focusOnTarget(target);
        onTargetSelect?.(target);
      }
    },
    [onTargetSelect]
  );

  const handleToggleEdgeBlockage = useCallback((edgeId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextSnap = engine.toggleEdgeBlockage(edgeId);
    setSnapshot(nextSnap);
    sceneManagerRef.current?.syncSnapshot(nextSnap);
  }, []);

  const handleToggleEdgeContraFlow = useCallback((edgeId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextSnap = engine.toggleEdgeContraFlow(edgeId);
    setSnapshot(nextSnap);
    sceneManagerRef.current?.syncSnapshot(nextSnap);
  }, []);

  const handleToggleGlobalContraFlow = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setContraFlowGlobal((prev) => {
      const next = !prev;
      const nextSnap = engine.applyContraFlowToCriticalBottlenecks(next);
      setSnapshot(nextSnap);
      sceneManagerRef.current?.syncSnapshot(nextSnap);
      return next;
    });
  }, []);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-[#eef2f6] border border-slate-200 shadow-sm ${className}`}
      style={{ height }}
      data-state={isPlaying ? 'playing' : 'paused'}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={canvasMountRef}
        data-testid="greenfield-3d-canvas"
        className="h-full w-full"
      />

      {/* In-Card Camera Controls & Telemetry HUD when embedded in Simulation Workspace */}
      {!showOverlay && (
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Camera View Presets */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-slate-200 shadow-md text-xs font-semibold text-slate-700">
            <Compass className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <button
              onClick={() => handleSelectPreset('isometric')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activePreset === 'isometric'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Isometric
            </button>
            <button
              onClick={() => handleSelectPreset('topdown')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activePreset === 'topdown'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Top-Down
            </button>
            <button
              onClick={() => handleSelectPreset('chokepoint')}
              className={`px-2.5 py-1 rounded-lg transition ${
                activePreset === 'chokepoint'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Chokepoint
            </button>
          </div>

          {/* Quick Zoom & Reset Buttons */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md w-fit">
            <button
              onClick={() => handleZoom(0.8)}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(1.25)}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSelectPreset('isometric')}
              title="Reset 3D Camera"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Mockdrill Realtime Synchronizer Pill */}
          {mockdrillAgents && mockdrillAgents.length > 0 && (
            <div className="flex items-center gap-1.5 bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/40 text-emerald-300 text-[11px] font-mono shadow-md w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>3D MOCKDRILL SYNC ({mockdrillAgents.filter((a) => a.status !== 'evacuated').length} ACTIVE VEHICLES)</span>
            </div>
          )}
        </div>
      )}

      {/* Full ControlOverlay (when showOverlay is explicitly enabled) */}
      {showOverlay && (
        <ControlOverlay
          snapshot={snapshot}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onStepForward={handleStepForward}
          onReset={handleReset}
          simSpeed={simSpeed}
          onChangeSimSpeed={handleChangeSimSpeed}
          activePreset={activePreset}
          onSelectPreset={handleSelectPreset}
          onZoom={handleZoom}
          selectedTarget={selectedTarget}
          onSelectTarget={handleSelectTarget}
          onToggleEdgeBlockage={handleToggleEdgeBlockage}
          onToggleEdgeContraFlow={handleToggleEdgeContraFlow}
          contraFlowGlobal={contraFlowGlobal}
          onToggleGlobalContraFlow={handleToggleGlobalContraFlow}
        />
      )}
    </div>
  );
};
