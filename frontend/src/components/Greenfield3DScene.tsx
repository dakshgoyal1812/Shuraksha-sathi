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

export interface Greenfield3DSceneProps {
  height?: string;
  showOverlay?: boolean;
  className?: string;
  onTargetSelect?: (target: SelectionTarget | null) => void;
  initialBlockedRoads?: string[];
}

export const Greenfield3DScene: React.FC<Greenfield3DSceneProps> = ({
  height = '640px',
  showOverlay = true,
  className = '',
  onTargetSelect,
  initialBlockedRoads = [],
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<EvacuationSimulationEngine | null>(null);
  const sceneManagerRef = useRef<GreenfieldSceneManager | null>(null);

  if (!engineRef.current) {
    const engine = new EvacuationSimulationEngine();
    if (initialBlockedRoads.length > 0) {
      initialBlockedRoads.forEach((edgeId) => {
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
    id: 'E01',
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

    return () => {
      manager.dispose();
      sceneManagerRef.current = null;
    };
  }, []);

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

      {/* Semantic HUD & Controls Overlay */}
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
