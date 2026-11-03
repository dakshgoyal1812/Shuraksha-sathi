import React, { useState, useEffect } from 'react';
import { Greenfield3DScene } from '../components/Greenfield3DScene';
import {
  Boxes,
  Info,
  Home,
  Layers,
  Sun,
  Ruler,
  Compass,
  Play,
  Pause,
  Zap,
  FileText,
  Maximize2,
  Smartphone,
  Monitor,
  RotateCcw,
  Shield,
  Eye,
  CheckCircle2
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

  // Time ticker for simulated sun clock
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

  return (
    <div className="flex flex-col gap-4">
      {/* Top Mission Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Boxes className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Rayvo 3D Studio Evacuation Model
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
              TABLET STUDIO
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Greenfield City 3D Autonomous Evacuation Studio
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Photorealistic 3D architectural rooftop & city topography with agent traffic physics, sun orientation, and live contraflow.
          </p>
        </div>

        {/* View Mode Switcher Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'tablet'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rayvo Tablet View</span>
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'full'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span>Fullscreen Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Viewport Container */}
      {viewMode === 'tablet' ? (
        <div className="w-full relative py-6 px-2 sm:px-4 rounded-3xl bg-[radial-gradient(circle_at_50%_45%,#1c3427_0%,#0e1d15_55%,#050e09_100%)] border border-emerald-950/60 shadow-2xl overflow-hidden">
          {/* Subtle Studio Glow Behind Tablet */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive Tablet Held in Hands Container */}
          <div className="relative w-full max-w-[1024px] mx-auto aspect-[1024/630] select-none">
            {/* Inner Tablet Screen Area (Host for 3D Canvas) */}
            <div
              className="absolute overflow-hidden rounded-[14px] bg-slate-950 shadow-inner z-10"
              style={{
                left: '18.164%',
                top: '17.46%',
                width: '61.719%',
                height: '61.27%',
              }}
            >
              {/* Real 3D WebGL Canvas */}
              <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
                <Greenfield3DScene
                  key={sceneKey}
                  height="100%"
                  showOverlay={false}
                  className="w-full h-full"
                />
              </div>

              {/* RAYVO-STYLE IN-TABLET FLOATING CONTROLS (Z-INDEX 30) */}
              
              {/* Top-Left Project Badge */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md pointer-events-auto">
                <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center font-black text-xs">
                  R
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[11px] text-slate-900 leading-none">
                    Greenfield 3D City
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium">
                    Evacuation Model
                  </span>
                </div>
              </div>

              {/* Top-Left Floating Tools Capsule */}
              <div className="absolute top-12 left-3 z-30 flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md gap-0.5 pointer-events-auto text-slate-700">
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
                  <Home className="w-3.5 h-3.5" />
                </button>
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
                  <Layers className="w-3.5 h-3.5" />
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
                  title="Cycle Sun Angle & Shadows"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'ruler' ? 'home' : 'ruler')}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeTool === 'ruler'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Inspect Coordinates & Dimensions"
                >
                  <Ruler className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Top-Right Quick Action Icons */}
              <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('full')}
                  className="p-1.5 bg-white/90 backdrop-blur-md rounded-lg text-slate-700 hover:text-black hover:bg-white border border-slate-200 shadow-md transition"
                  title="Expand to Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetCamera}
                  className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md transition"
                  title="Reset 3D Scene"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Top-Right Sun & Compass Dial Widget */}
              <div className="absolute top-12 right-3 z-30 flex flex-col items-end gap-1 pointer-events-auto">
                {/* Compass Dial Rose */}
                <div className="w-12 h-12 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-md flex items-center justify-center relative p-1">
                  <div
                    className="w-full h-full flex items-center justify-center transition-transform duration-500"
                    style={{ transform: `rotate(${sunAngle}deg)` }}
                  >
                    <div className="w-0.5 h-4 bg-rose-600 rounded-t-sm" />
                    <div className="w-0.5 h-4 bg-slate-400 rounded-b-sm" />
                  </div>
                  <span className="absolute top-0.5 font-bold text-[7px] text-slate-600">N</span>
                  <span className="absolute bottom-0.5 font-bold text-[7px] text-slate-400">S</span>
                  <span className="absolute right-0.5 font-bold text-[7px] text-slate-400">E</span>
                  <span className="absolute left-0.5 font-bold text-[7px] text-slate-400">W</span>
                </div>

                {/* Sun Azimuth & Altitude Pill */}
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs text-[10px] font-bold text-slate-800 flex items-center gap-1">
                  <span className="text-amber-500">Sun {sunAngle}° SE</span>
                  <span className="text-slate-400 font-normal">Alt {sunAlt}°</span>
                </div>

                {/* Unit Selector Pill */}
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{activeUnit}</span>
                </div>
              </div>

              {/* Bottom-Right Simulation Playback & Solar Time Bar */}
              <div className="absolute bottom-3 right-3 z-30 flex items-center bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 shadow-xl text-white text-[11px] font-semibold gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center hover:bg-slate-200 transition shadow-xs"
                  title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
                >
                  {isPlaying ? (
                    <Pause className="w-2.5 h-2.5 fill-current" />
                  ) : (
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  )}
                </button>
                <div className="flex items-center gap-1 text-slate-200">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>3 Nov · {currentTime}</span>
                </div>
              </div>

              {/* Bottom-Left Live Evacuation Model Label */}
              <div className="absolute bottom-3 left-3 z-30 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[9px] text-slate-300 font-mono pointer-events-none">
                Suraksha 3D Studio • Rayvo Engine
              </div>
            </div>

            {/* Overlaid Tablet Mockup Held in Hands (Transparent Screen Cutout) */}
            <img
              src="/assets/tablet-hands-frame.png"
              alt="3D Tablet held by hands"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
            />
          </div>

          {/* Bottom Interactive Guidance Pill */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-200/90 font-medium text-center">
            <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <b>Interactive 3D Tablet:</b> Click &amp; drag inside the tablet screen to orbit, right-click to pan, scroll to zoom in/out.
            </span>
          </div>
        </div>
      ) : (
        /* Full Desktop Workspace View */
        <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <Greenfield3DScene height="calc(100vh - 12rem)" className="min-h-[550px]" />
        </div>
      )}
    </div>
  );
};
