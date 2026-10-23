import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ArrowRight,
  Play,
  Layers,
  Cpu,
  Route,
  AlertTriangle,
  Building,
  Sliders,
  GitCompare,
  FileBarChart,
  CheckCircle,
  Activity,
  Compass,
  FileCheck
} from 'lucide-react';
import { GreenfieldMap } from '../components/GreenfieldMap';
import { api } from '../services/api';
import { MapData, ScenarioListItem } from '../types/scenario';

export const LandingPage: React.FC = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);

  useEffect(() => {
    api.getDefaultMap().then(setMapData).catch(console.error);
    api.getScenarios().then(setScenarios).catch(console.error);
  }, []);

  const features = [
    {
      icon: Layers,
      title: 'Disaster Scenario Modeling',
      desc: 'Model floods, fires, earthquakes, and custom crises with configurable severity and hazard impact zones.'
    },
    {
      icon: Cpu,
      title: 'Agent-Based Population Simulation',
      desc: 'Simulate virtual evacuee behavior with discrete-time progress, speed variations, and mobility classes.'
    },
    {
      icon: Route,
      title: 'Intelligent Route Optimization',
      desc: 'Execute dynamic graph-based Dijkstra routing that dynamically penalizes congestion and avoids hazards.'
    },
    {
      icon: AlertTriangle,
      title: 'Bottleneck Detection',
      desc: 'Automatically flag road segments where demand exceeds design capacity with delay metrics and mitigations.'
    },
    {
      icon: Building,
      title: 'Shelter Capacity Management',
      desc: 'Enforce physical occupancy limits, balance inter-district arrivals, and prevent shelter overflow.'
    },
    {
      icon: Sliders,
      title: 'What-If Analysis',
      desc: 'Clone baseline scenarios and test single parameter changes (reopening roads, adding capacity) instantly.'
    },
    {
      icon: GitCompare,
      title: 'Strategy Comparison',
      desc: 'Compare multi-run KPIs side-by-side with automated composite scoring and trade-off analysis.'
    },
    {
      icon: FileBarChart,
      title: 'Analytical Reports',
      desc: 'Generate executive summaries, export tabular CSV data, and produce high-resolution PDF documentation.'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Configure Scenario',
      desc: 'Define hazard zones, select blocked roads, configure synthetic population size, and allocate shelter limits.'
    },
    {
      step: '02',
      title: 'Simulate Movement',
      desc: 'Run the discrete-time simulation engine to advance virtual agents toward safe havens along graph edges.'
    },
    {
      step: '03',
      title: 'Detect Bottlenecks',
      desc: 'Inspect real-time traffic density, identify choked bridge corridors, and track shelter quota milestones.'
    },
    {
      step: '04',
      title: 'Compare & Optimize',
      desc: 'Execute alternative What-If strategies, compare clearance times, and select the optimal operational drill.'
    }
  ];

  return (
    <div className="grid-wrapper min-h-screen text-[#1F2937] flex flex-col font-sans relative overflow-x-hidden">
      <div className="grid-background pointer-events-none" aria-hidden="true"></div>

      {/* Top Banner */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xs border-b border-[#E1E7EF] py-1.5 px-4 text-center text-xs text-[#64748B] font-medium">
        SIMULATED ENVIRONMENT: Greenfield City Synthetic Disaster Planning Drill • 100% Software-Based
      </div>

      {/* Hero Section */}
      <section className="relative z-10 px-4 sm:px-6 lg:px-12 pt-16 pb-20 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E1E7EF] text-xs font-semibold text-[#0F172A] mb-6 shadow-xs">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>EvacuSafe Planning & Simulation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[#0F172A] mb-6">
            Plan for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">Unpredictable.</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#64748B] max-w-3xl mx-auto leading-relaxed mb-10">
            Test evacuation strategies, discover hidden bottlenecks, and optimize routes and shelter allocation in a simulated disaster environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-black hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current text-white" />
              <span>Launch Simulation</span>
            </Link>

            <a
              href="#features"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-800 font-semibold text-sm shadow-xs transition"
            >
              <span>Explore Features</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Hero Interactive Map Preview */}
        <div className="max-w-6xl mx-auto mt-16 relative">
          <div className="p-2 sm:p-3 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#E1E7EF] text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-semibold text-[#0F172A]">Interactive Map Preview: Greenfield City Road Network</span>
              </div>
              <span className="font-mono text-emerald-700 font-semibold">Dijkstra Shortest-Path Active</span>
            </div>
            {mapData && (
              <div className="mt-2 rounded-xl overflow-hidden">
                <GreenfieldMap
                  nodes={mapData.nodes}
                  edges={mapData.edges}
                  shelters={mapData.shelters}
                  hazardZone={mapData.hazard_zone}
                  blockedRoads={["R-10", "R-1"]}
                  height="480px"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-12 bg-slate-50/70 border-t border-[#E1E7EF]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-4">
              Comprehensive Disaster Operations Capabilities
            </h2>
            <p className="text-[#64748B] max-w-2xl mx-auto text-sm sm:text-base">
              A mathematically rigorous, software-only framework designed for municipal emergency managers, civil defense planners, and academic researchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="p-5 rounded-2xl bg-white border border-[#E1E7EF] hover:border-slate-300 transition hover:-translate-y-0.5 shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-center justify-center mb-4">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0F172A] mb-2">{feat.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (4-Step Workflow) */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-12 border-t border-[#E1E7EF] bg-white/90 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-4">
              How EvacuSafe Works
            </h2>
            <p className="text-[#64748B] max-w-2xl mx-auto text-sm">
              Follow a standardized four-step simulation lifecycle from disaster configuration to verified operational recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {steps.map((st) => (
              <div
                key={st.step}
                className="p-5 rounded-2xl bg-slate-50/80 border border-[#E1E7EF] relative group hover:border-slate-300 transition"
              >
                <span className="text-3xl font-black text-slate-300 group-hover:text-slate-500 transition-colors block mb-2 font-mono">
                  {st.step}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] mb-2">{st.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact & Mission Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-12 bg-slate-50/70 border-t border-[#E1E7EF]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-6">
            Empowering Disaster Management Authorities
          </h2>
          <p className="text-[#64748B] text-sm sm:text-base leading-relaxed mb-10">
            EvacuSafe provides verifiable evidence for urban planners to test emergency bridge closures, adjust shelter capacities, and simulate phased departures before crisis strikes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="font-bold text-[#0F172A] text-sm mb-1">Bottleneck Prevention</h4>
              <p className="text-xs text-[#64748B]">Discover gridlock corridors prior to road closures and deploy contra-flow bypasses.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="font-bold text-[#0F172A] text-sm mb-1">Capacity Balancing</h4>
              <p className="text-xs text-[#64748B]">Avoid shelter overcrowding by routing populations dynamically across regional reception centers.</p>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
              <CheckCircle className="w-5 h-5 text-emerald-600 mb-2" />
              <h4 className="font-bold text-[#0F172A] text-sm mb-1">Repeatable Drills</h4>
              <p className="text-xs text-[#64748B]">Deterministic seeds enable apples-to-apples comparison of operational drills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-[#E1E7EF] bg-white py-10 px-4 sm:px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-bold border border-slate-800 shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#0F172A]">EvacuSafe Platform</span>
              <p className="text-[11px] text-[#64748B]">Simulate Today. Save Lives Tomorrow.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[#64748B]">
            <Link to="/dashboard" className="hover:text-[#0F172A] transition">Dashboard</Link>
            <Link to="/scenarios/new" className="hover:text-[#0F172A] transition">Scenario Builder</Link>
            <Link to="/shelters" className="hover:text-[#0F172A] transition">Shelters</Link>
            <Link to="/compare" className="hover:text-[#0F172A] transition">Comparison</Link>
            <Link to="/reports" className="hover:text-[#0F172A] transition">Reports</Link>
            <Link to="/settings" className="hover:text-[#0F172A] transition">Settings</Link>
          </div>

          <div className="text-[11px] text-[#94A3B8] text-center md:text-right max-w-sm">
            FastAPI • NetworkX • React • Leaflet • Tailwind CSS. Results depend on model assumptions and do not replace professional emergency planning.
          </div>
        </div>
      </footer>
    </div>
  );
};
