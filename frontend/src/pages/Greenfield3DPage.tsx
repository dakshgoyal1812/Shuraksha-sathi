import React, { useState, useEffect } from 'react';
import { Greenfield3DScene } from '../components/Greenfield3DScene';
import {
  Boxes,
  Info,
  Home,
  Layers,
  Sun,
  Ruler,
  Play,
  Pause,
  Zap,
  FileText,
  Maximize2,
  Minimize2,
  Smartphone,
  Monitor,
  RotateCcw,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

export const Greenfield3DPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'tablet' | 'full'>('tablet');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<string>('home');
  const [sunAngle, setSunAngle] = useState<number>(138);
  const [sunAlt, setSunAlt] = useState<number>(43);
  const [currentTime, setCurrentTime] = useState<string>('9:47 am');
  const [activeUnit, setActiveUnit] = useState<string>('All Units');
  const [sceneKey, setSceneKey] = useState<number>(1);
  const [unitsOpen, setUnitsOpen] = useState<boolean>(false);

  // Time ticker for simulated solar clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).toLowerCase()
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResetCamera = () => {
    setSceneKey((prev) => prev + 1);
  };

  const unitsList = ['All Units', 'North Rooftop A', 'Sector 4 Shelter', 'East Highway Overpass'];

  return (
    <div className="flex flex-col gap-3 sm:gap-4 max-w-full overflow-hidden">
      {/* Top Mission Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Rayvo 3D Studio Evacuation Model
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
              INTERACTIVE TABLET
            </span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Greenfield City 3D Autonomous Evacuation Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden xs:block">
            Photorealistic 3D architectural rooftop &amp; city topography with agent traffic physics, sun orientation, and live contraflow.
          </p>
        </div>

        {/* View Mode Switcher Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('tablet')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'tablet'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tablet Studio</span>
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'full'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Viewport Container */}
      {viewMode === 'tablet' ? (
        <div className="w-full relative py-3 sm:py-6 px-1.5 sm:px-4 rounded-2xl sm:rounded-3xl bg-[radial-gradient(circle_at_50%_45%,#1c3427_0%,#0e1d15_55%,#050e09_100%)] border border-emerald-950/60 shadow-2xl overflow-hidden">
          {/* Subtle Ambient Studio Light Behind Tablet */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] md:w-[850px] h-[300px] sm:h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* REAL CSS TABLET HARDWARE CHASSIS (Rayvo Architecture Device Frame) */}
          <div className="relative w-full max-w-[1060px] mx-auto select-none">
            {/* Tablet Bezel Shell */}
            <div className="relative rounded-[24px] sm:rounded-[36px] md:rounded-[44px] bg-[#0c1319] border-[6px] sm:border-[12px] md:border-[16px] border-[#0c1319] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.12),inset_0_1px_2px_rgba(255,255,255,0.25)] ring-1 ring-slate-800 p-0 overflow-hidden">
              {/* Front Camera Sensor Aperture (Centered at top of bezel) */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-40 hidden sm:flex items-center justify-center w-2.5 h-2.5 rounded-full bg-black border border-slate-800 shadow-inner">
                <div className="w-1 h-1 rounded-full bg-blue-500/80 shadow-xs" />
              </div>

              {/* Tablet Screen Display (100% Full Viewport Inside Tablet) */}
              <div className="relative w-full h-[420px] xs:h-[480px] sm:h-[580px] md:h-[650px] lg:h-[700px] overflow-hidden rounded-[16px] sm:rounded-[24px] md:rounded-[30px] bg-slate-950">
                {/* Real 3D Three.js WebGL City Scene */}
                <div className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none">
                  <Greenfield3DScene
                    key={sceneKey}
                    height="100%"
                    showOverlay={false}
                    className="w-full h-full"
                  />
                </div>

                {/* Subtle Realistic Glass Surface Glare */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] z-10" />

                {/* RAYVO IN-TABLET FLOATING CONTROLS (Floating Glassmorphism) */}

                {/* Top-Left: Project Identity Badge */}
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200/90 shadow-lg pointer-events-auto">
                  <div className="w-5 h-5 rounded-md bg-[#111827] text-white flex items-center justify-center font-black text-[11px] tracking-tight shrink-0">
                    R
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px] sm:text-xs text-slate-900 leading-none">
                      Sample rooftop
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium hidden sm:inline leading-tight">
                      Greenfield City 3D Model
                    </span>
                  </div>
                </div>

                {/* Top-Left: Floating Tools Capsule */}
                <div className="absolute top-12 sm:top-16 left-2.5 sm:left-4 z-30 flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-lg gap-0.5 sm:gap-1 pointer-events-auto text-slate-700">
                  <button
                    type="button"
                    onClick={handleResetCamera}
                    className={`p-1.5 rounded-lg transition-all ${
                      activeTool === 'home'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Reset 3D Camera"
                  >
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => setActiveTool(activeTool === 'layers' ? 'home' : 'layers')}
                    className={`p-1.5 rounded-lg transition-all ${
                      activeTool === 'layers'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Toggle 3D Layers"
                  >
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool('sun');
                      setSunAngle((prev) => (prev + 30) % 360);
                    }}
                    className={`p-1.5 rounded-lg transition-all ${
                      activeTool === 'sun'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Adjust Sun & Shadow Orientation"
                  >
                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTool(activeTool === 'ruler' ? 'home' : 'ruler')}
                    className={`p-1.5 rounded-lg transition-all ${
                      activeTool === 'ruler'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    title="Measure Coordinates"
                  >
                    <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Top-Right: Quick Action Icons */}
                <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-30 flex items-center gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'tablet' ? 'full' : 'tablet')}
                    className="p-1.5 sm:p-2 bg-white/95 backdrop-blur-md rounded-xl text-slate-700 hover:text-black hover:bg-white border border-slate-200/90 shadow-md transition"
                    title="Toggle Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCamera}
                    className="p-1.5 sm:p-2 bg-[#111827] text-white rounded-xl hover:bg-slate-800 shadow-md transition"
                    title="Reset Scene View"
                  >
                    <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Top-Right: Sun & Compass Rose Dial Widget */}
                <div className="absolute top-12 sm:top-16 right-2.5 sm:right-4 z-30 flex flex-col items-end gap-1.5 pointer-events-auto">
                  {/* Compass Dial Rose */}
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg flex items-center justify-center relative p-1">
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform duration-500"
                      style={{ transform: `rotate(${sunAngle}deg)` }}
                    >
                      <div className="w-0.5 h-4 sm:h-5 bg-rose-600 rounded-t-sm" />
                      <div className="w-0.5 h-4 sm:h-5 bg-slate-300 rounded-b-sm" />
                    </div>
                    <span className="absolute top-0.5 font-bold text-[7px] sm:text-[8px] text-slate-700">N</span>
                    <span className="absolute bottom-0.5 font-bold text-[7px] sm:text-[8px] text-slate-400">S</span>
                    <span className="absolute right-0.5 font-bold text-[7px] sm:text-[8px] text-slate-400">E</span>
                    <span className="absolute left-0.5 font-bold text-[7px] sm:text-[8px] text-slate-400">W</span>
                  </div>

                  {/* Sun Azimuth & Altitude Pill */}
                  <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200/90 shadow-sm text-[9px] sm:text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <span className="text-amber-500">Sun {sunAngle}° SE</span>
                    <span className="text-slate-400 font-normal">Alt {sunAlt}°</span>
                  </div>

                  {/* Unit Selector Dropdown Pill */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setUnitsOpen(!unitsOpen)}
                      className="bg-white/95 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200/90 shadow-sm text-[9px] sm:text-[11px] font-bold text-emerald-700 flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 transition"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{activeUnit}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {unitsOpen && (
                      <div className="absolute right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-40 min-w-[130px] text-xs font-medium text-slate-700">
                        {unitsList.map((unit) => (
                          <button
                            key={unit}
                            onClick={() => {
                              setActiveUnit(unit);
                              setUnitsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-slate-100 flex items-center justify-between ${
                              activeUnit === unit ? 'font-bold text-emerald-700 bg-emerald-50' : ''
                            }`}
                          >
                            <span>{unit}</span>
                            {activeUnit === unit && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom-Right: Simulation Playback & Solar Clock */}
                <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-30 flex items-center bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-white/20 shadow-xl text-white text-[10px] sm:text-xs font-semibold gap-2 pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-200 transition shadow-xs"
                    title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
                  >
                    {isPlaying ? (
                      <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                    ) : (
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current ml-0.5" />
                    )}
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-200">
                    <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                    <span>3 Nov · {currentTime}</span>
                  </div>
                </div>

                {/* Bottom-Left: Minimal Watermark */}
                <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4 z-30 text-[9px] sm:text-[10px] text-slate-400 font-medium tracking-tight pointer-events-none drop-shadow">
                  Google - Imagery ©2026 Maxar Technologies · Rayvo 3D Engine
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Interactive Guidance Pill */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] sm:text-xs text-emerald-200/90 font-medium text-center px-2">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <b>Interactive 3D Tablet:</b> Touch/drag to orbit, two fingers to pan/zoom. Use top tools to inspect layers, sun angles, and rooftop zones.
            </span>
          </div>
        </div>
      ) : (
        /* Full Desktop Workspace View */
        <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="relative w-full h-[550px] sm:h-[650px] lg:h-[750px]">
            <Greenfield3DScene height="100%" className="w-full h-full" />
            <button
              onClick={() => setViewMode('tablet')}
              className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold shadow-lg hover:bg-slate-800 transition"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Switch to Tablet View</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Greenfield3DPage;
