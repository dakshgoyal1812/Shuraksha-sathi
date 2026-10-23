import React, { useState, useRef, useEffect } from 'react';
import {
  RoadNode,
  RoadEdge,
  Shelter,
  HazardZone,
  AgentSnapshot,
} from '../types/scenario';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Shield,
  Layers,
  MapPin,
  Car,
  X,
  Compass
} from 'lucide-react';

interface GreenfieldMapProps {
  nodes: RoadNode[];
  edges: RoadEdge[];
  shelters: Shelter[];
  hazardZone?: HazardZone;
  blockedRoads?: string[];
  agents?: AgentSnapshot[];
  roadCongestion?: Record<string, number>;
  activeBottlenecks?: string[];
  shelterOccupancies?: Record<string, number>;
  highlightedRoute?: string[];
  onRoadClick?: (road: RoadEdge) => void;
  onShelterClick?: (shelter: Shelter) => void;
  onNodeClick?: (node: RoadNode) => void;
  isEditable?: boolean;
  selectedRoadId?: string;
  selectedShelterId?: string;
  height?: string;
}

export const GreenfieldMap: React.FC<GreenfieldMapProps> = ({
  nodes,
  edges,
  shelters,
  hazardZone,
  blockedRoads = [],
  agents = [],
  roadCongestion = {},
  activeBottlenecks = [],
  shelterOccupancies = {},
  highlightedRoute = [],
  onRoadClick,
  onShelterClick,
  onNodeClick,
  isEditable = false,
  selectedRoadId,
  selectedShelterId,
  height = '620px',
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Layer toggles
  const [showAgents, setShowAgents] = useState<boolean>(true);
  const [showHazard, setShowHazard] = useState<boolean>(true);
  const [showBottlenecks, setShowBottlenecks] = useState<boolean>(true);
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showLegend, setShowLegend] = useState<boolean>(true);

  // Inspector modal state
  const [inspectedRoad, setInspectedRoad] = useState<RoadEdge | null>(null);
  const [inspectedShelter, setInspectedShelter] = useState<Shelter | null>(null);
  const [inspectedAgent, setInspectedAgent] = useState<AgentSnapshot | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeMap = useRef<Map<string, RoadNode>>(new Map());

  useEffect(() => {
    nodeMap.current.clear();
    nodes.forEach((n) => nodeMap.current.set(n.id, n));
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.6, Math.min(2.5, prev + delta)));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Convert Hazard Zone polygon points to SVG path string
  const getHazardPolygonPoints = () => {
    if (!hazardZone || !hazardZone.polygon || hazardZone.polygon.length === 0) {
      return '';
    }
    return hazardZone.polygon.map((p) => `${p[0]},${p[1]}`).join(' ');
  };

  const getEdgeCongestionColor = (edgeId: string, isBlocked: boolean) => {
    if (isBlocked) return '#EF4444'; // Red dashed for blocked
    const ratio = roadCongestion[edgeId] || 0;
    if (ratio >= 1.25) return '#DC2626'; // Critical bottleneck
    if (ratio >= 1.0) return '#F97316';  // High congestion
    if (ratio >= 0.85) return '#FBBF24'; // Moderate
    return '#38BDF8';                    // Normal flow
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-[#E1E7EF] bg-slate-900 shadow-xs select-none"
      style={{ height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Map Control Buttons */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-[#E1E7EF] shadow-md">
        <button
          onClick={() => handleZoom(0.2)}
          className="p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-lg transition"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-lg transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 text-slate-700 hover:text-black hover:bg-slate-100 rounded-lg transition"
          title="Reset View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E1E7EF] text-xs text-[#0F172A] shadow-md font-medium">
        <Layers className="w-4 h-4 text-slate-700 mr-0.5" />
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
          <input
            type="checkbox"
            checked={showAgents}
            onChange={(e) => setShowAgents(e.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-0"
          />
          Agents ({agents.length})
        </label>
        <span className="text-slate-300">|</span>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
          <input
            type="checkbox"
            checked={showHazard}
            onChange={(e) => setShowHazard(e.target.checked)}
            className="rounded border-slate-300 text-rose-600 focus:ring-0"
          />
          Hazard
        </label>
        <span className="text-slate-300">|</span>
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-black">
          <input
            type="checkbox"
            checked={showShelters}
            onChange={(e) => setShowShelters(e.target.checked)}
            className="rounded border-slate-300 text-emerald-600 focus:ring-0"
          />
          Shelters
        </label>
        <span className="text-slate-300">|</span>
        <button
          onClick={() => setShowLegend(!showLegend)}
          className="text-xs text-slate-900 font-semibold hover:underline ml-0.5"
        >
          {showLegend ? 'Hide Legend' : 'Legend'}
        </button>
      </div>

      {/* Town Branding Badge */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#E1E7EF] text-xs shadow-md flex items-center gap-2.5">
        <Compass className="w-4 h-4 text-slate-800 animate-spin-slow" />
        <div>
          <span className="font-bold text-[#0F172A] block">Greenfield City</span>
          <span className="text-[#64748B] text-[11px] block">Simulated Road Graph • 20 Nodes, 32 Edges</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle Grid Pattern */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.5" strokeOpacity="0.4" />
          </pattern>
          {/* Water Pattern */}
          <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0369A1" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#0284C7" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#0369A1" stopOpacity="0.35" />
          </linearGradient>
          {/* Hazard Gradient */}
          <radialGradient id="hazardGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#B91C1C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#991B1B" stopOpacity="0.05" />
          </radialGradient>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Background Grid */}
          <rect x="-400" y="-300" width="1600" height="1200" fill="url(#grid)" />

          {/* Greenfield River Natural Corridor */}
          <path
            d="M 280,0 Q 320,150 360,250 T 440,380 T 470,600"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="58"
            strokeLinecap="round"
          />
          <path
            d="M 280,0 Q 320,150 360,250 T 440,380 T 470,600"
            fill="none"
            stroke="#0284C7"
            strokeWidth="3"
            strokeDasharray="12 8"
            strokeOpacity="0.6"
          />
          <text x="315" y="70" fill="#38BDF8" fontSize="10" opacity="0.6" transform="rotate(25 315,70)">
            Greenfield River
          </text>

          {/* Hazard Impact Polygon Zone */}
          {showHazard && hazardZone && (
            <g>
              <polygon
                points={getHazardPolygonPoints()}
                fill="url(#hazardGrad)"
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              <text
                x="370"
                y="310"
                fill="#FCA5A5"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
                className="drop-shadow"
              >
                ⚠ {hazardZone.name}
              </text>
            </g>
          )}

          {/* Road Network Edges */}
          {edges.map((edge) => {
            const u = nodeMap.current.get(edge.source);
            const v = nodeMap.current.get(edge.target);
            if (!u || !v) return null;

            const isBlocked = Boolean(blockedRoads.includes(edge.id) || edge.is_blocked);
            const isSelected = selectedRoadId === edge.id;
            const isBottleneck = activeBottlenecks.includes(edge.id);
            const strokeColor = getEdgeCongestionColor(edge.id, isBlocked);
            const strokeWidth = isSelected ? 5.5 : (isBottleneck ? 4.5 : 3.0);

            return (
              <g
                key={edge.id}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectedRoad(edge);
                  onRoadClick?.(edge);
                }}
              >
                {/* Glow/Selection outline */}
                {isSelected && (
                  <line
                    x1={u.x}
                    y1={u.y}
                    x2={v.x}
                    y2={v.y}
                    stroke="#06B6D4"
                    strokeWidth="8"
                    strokeOpacity="0.5"
                  />
                )}

                {/* Base Road Line */}
                <line
                  x1={u.x}
                  y1={u.y}
                  x2={v.x}
                  y2={v.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isBlocked ? '6 4' : undefined}
                  className="transition-all duration-300"
                />

                {/* Blocked indicator icon in center of road */}
                {isBlocked && (
                  <g transform={`translate(${(u.x + v.x) / 2}, ${(u.y + v.y) / 2})`}>
                    <circle r="7" fill="#7F1D1D" stroke="#EF4444" strokeWidth="1.5" />
                    <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" />
                    <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" stroke="#FFFFFF" strokeWidth="1.5" />
                  </g>
                )}

                {/* Road Name on hover / bottleneck label */}
                {(isBottleneck && showBottlenecks) && (
                  <g transform={`translate(${(u.x + v.x) / 2}, ${(u.y + v.y) / 2 - 8})`}>
                    <rect x="-24" y="-8" width="48" height="14" rx="3" fill="#991B1B" fillOpacity="0.9" />
                    <text x="0" y="2" fill="#FFFFFF" fontSize="8" fontWeight="700" textAnchor="middle">
                      {Math.round((roadCongestion[edge.id] || 1.1) * 100)}% LOAD
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Intersections & Residential Nodes */}
          {nodes.map((node) => {
            const isShelterNode = node.type === 'shelter';
            const isResidential = node.type === 'residential';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick?.(node);
                }}
              >
                {/* Outer ring */}
                <circle
                  r={isResidential ? 10 : (isShelterNode ? 14 : 7)}
                  fill={isResidential ? '#1E293B' : (isShelterNode ? '#064E3B' : '#0F172A')}
                  stroke={isResidential ? '#38BDF8' : (isShelterNode ? '#10B981' : '#64748B')}
                  strokeWidth="2"
                  className="group-hover:scale-125 transition-transform duration-200"
                />

                {/* Node ID / Icon */}
                <text
                  x="0"
                  y="3.5"
                  fill="#F8FAFC"
                  fontSize={isResidential ? "8" : "7"}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {node.id}
                </text>

                {/* Node Label tooltip / tag */}
                <text
                  x="0"
                  y={isResidential ? 19 : 16}
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontWeight="500"
                  textAnchor="middle"
                  className="pointer-events-none group-hover:fill-white drop-shadow"
                >
                  {node.name}
                </text>
              </g>
            );
          })}

          {/* Evacuation Shelters */}
          {showShelters && shelters.map((shelter) => {
            const occ = shelterOccupancies[shelter.id] ?? shelter.assigned_population;
            const cap = shelter.capacity;
            const pct = Math.round((occ / Math.max(1, cap)) * 100);
            const isSelected = selectedShelterId === shelter.id;
            const isFull = pct >= 100;

            return (
              <g
                key={shelter.id}
                transform={`translate(${shelter.x}, ${shelter.y})`}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectedShelter(shelter);
                  onShelterClick?.(shelter);
                }}
              >
                {/* Shelter Marker Pin */}
                <circle
                  r="18"
                  fill={isFull ? '#7F1D1D' : '#064E3B'}
                  stroke={isSelected ? '#38BDF8' : (isFull ? '#EF4444' : '#10B981')}
                  strokeWidth={isSelected ? '3.5' : '2.5'}
                  className="transition-all"
                />

                {/* Shield / Cross icon representation */}
                <path
                  d="M -5 -6 L 5 -6 L 5 1 Q 5 6 0 9 Q -5 6 -5 1 Z"
                  fill="#FFFFFF"
                  stroke="#10B981"
                  strokeWidth="1"
                />

                {/* Occupancy Badge */}
                <rect
                  x="-32"
                  y="20"
                  width="64"
                  height="16"
                  rx="4"
                  fill="#0B1528"
                  stroke={isFull ? '#EF4444' : '#10B981'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="31"
                  fill={isFull ? '#FCA5A5' : '#6EE7B7'}
                  fontSize="8"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {occ} / {cap} ({pct}%)
                </text>

                {/* Shelter Name */}
                <text
                  x="0"
                  y="-22"
                  fill="#E2E8F0"
                  fontSize="9"
                  fontWeight="600"
                  textAnchor="middle"
                  className="drop-shadow-md"
                >
                  {shelter.name}
                </text>
              </g>
            );
          })}

          {/* Virtual Simulated Agents */}
          {showAgents && agents.map((agent) => {
            let fill = '#38BDF8'; // Moving
            if (agent.status === 'evacuated') fill = '#10B981'; // Evacuated safe
            else if (agent.status === 'unreachable') fill = '#EF4444'; // Unreachable
            else if (agent.status === 'rerouting') fill = '#F59E0B'; // Rerouting

            return (
              <circle
                key={agent.id}
                cx={agent.x}
                cy={agent.y}
                r="3.5"
                fill={fill}
                stroke="#070D1E"
                strokeWidth="0.8"
                className="transition-all duration-300 cursor-pointer hover:r-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setInspectedAgent(agent);
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Map Legend Overlay */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E1E7EF] text-xs shadow-xl max-w-xs text-[#0F172A]">
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#E1E7EF]">
            <span className="font-bold text-[#0F172A]">Simulation Map Legend</span>
            <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-slate-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-[#475569]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-cyan-500 rounded-sm"></span>
              <span>Open Road Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-amber-500 rounded-sm"></span>
              <span>Moderate Congestion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-rose-600 rounded-sm"></span>
              <span>Critical Bottleneck</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 border-t-2 border-dashed border-rose-500"></span>
              <span>Road Closed / Blocked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Evacuated Safe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>Agent in Transit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Re-routing Agent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Unreachable Agent</span>
            </div>
          </div>
        </div>
      )}

      {/* Road Inspector Floating Modal */}
      {inspectedRoad && (
        <div className="absolute top-16 left-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E1E7EF] shadow-2xl w-80 text-xs text-[#0F172A]">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E1E7EF]">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-900" />
              <span className="font-bold text-[#0F172A]">{inspectedRoad.name} ({inspectedRoad.id})</span>
            </div>
            <button onClick={() => setInspectedRoad(null)} className="text-slate-400 hover:text-slate-900">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Status:</span>
              <span className={`font-semibold ${blockedRoads.includes(inspectedRoad.id) ? 'text-rose-600' : 'text-emerald-600'}`}>
                {blockedRoads.includes(inspectedRoad.id) ? 'CLOSED / BLOCKED' : 'OPEN'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Length:</span>
              <span>{inspectedRoad.length} meters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Design Capacity:</span>
              <span>{inspectedRoad.capacity} agents/step</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Current Load Ratio:</span>
              <span className="font-semibold text-amber-700">
                {Math.round((roadCongestion[inspectedRoad.id] || 0) * 100)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Hazard Exposure:</span>
              <span>{Math.round(inspectedRoad.hazard_exposure * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Shelter Inspector Floating Modal */}
      {inspectedShelter && (
        <div className="absolute top-16 right-4 z-30 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E1E7EF] shadow-2xl w-80 text-xs text-[#0F172A]">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E1E7EF]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-[#0F172A]">{inspectedShelter.name}</span>
            </div>
            <button onClick={() => setInspectedShelter(null)} className="text-slate-400 hover:text-slate-900">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="text-[#64748B]">Status:</span>
              <span className="text-emerald-700 font-semibold">{inspectedShelter.availability ? 'OPERATIONAL' : 'INACTIVE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Current Occupancy:</span>
              <span className="font-bold text-[#0F172A]">
                {shelterOccupancies[inspectedShelter.id] ?? inspectedShelter.assigned_population} / {inspectedShelter.capacity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Remaining Capacity:</span>
              <span className="font-semibold text-[#0F172A]">{Math.max(0, inspectedShelter.capacity - (shelterOccupancies[inspectedShelter.id] ?? inspectedShelter.assigned_population))}</span>
            </div>
            {inspectedShelter.notes && (
              <div className="mt-2 pt-2 border-t border-[#E1E7EF] text-[#64748B] text-[11px]">
                {inspectedShelter.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
