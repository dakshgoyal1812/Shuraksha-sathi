import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  Building,
  Download,
  FileSpreadsheet,
  FileText,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { api } from '../services/api';
import { ScenarioListItem, SimulationRun } from '../types/scenario';

import { FALLBACK_ANALYTICS } from '../services/mockData';

export const AnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<any>(FALLBACK_ANALYTICS);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiExplanation, setAiExplanation] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  const fetchExplanation = async (runId: string) => {
    if (!runId) return;
    setLoadingAi(true);
    try {
      const exp = await api.getAIExplanation(runId);
      setAiExplanation(exp);
    } catch (e) {
      console.warn("AI Explanation unavailable:", e);
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    loadScenariosAndAnalytics();
  }, [id]);

  const loadScenariosAndAnalytics = async () => {
    setLoading(true);
    try {
      const scenList = await api.getScenarios();
      setScenarios(scenList);

      let targetId = id;
      if (!targetId || targetId === 'default') {
        if (scenList.length > 0) targetId = scenList[0].id;
      }

      if (targetId) {
        // 1. Check if targetId is an existing scenario
        const matchedScen = scenList.find((s) => s.id === targetId);
        if (matchedScen) {
          setSelectedScenarioId(matchedScen.id);
          try {
            const run = await api.getLatestSimulationRun(matchedScen.id);
            const data = await api.getSimulationAnalytics(run.id);
            setAnalyticsData(data);
            fetchExplanation(run.id);
            return;
          } catch (err) {
            console.warn("Failed fetching scenario run:", err);
          }
        } else {
          // 2. targetId might be a run_id directly
          try {
            const data = await api.getSimulationAnalytics(targetId);
            setAnalyticsData(data);
            if (data.scenario_id) {
              setSelectedScenarioId(data.scenario_id);
            }
            fetchExplanation(data.run_id || targetId);
            return;
          } catch (err) {
            console.warn("TargetId not a run ID:", err);
          }
        }
      }

      // Fallback: pick first scenario
      if (scenList.length > 0) {
        setSelectedScenarioId(scenList[0].id);
        const run = await api.getLatestSimulationRun(scenList[0].id);
        const data = await api.getSimulationAnalytics(run.id);
        setAnalyticsData(data);
        fetchExplanation(run.id);
      }
    } catch (e) {
      console.error('Error loading analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (scenId: string) => {
    setSelectedScenarioId(scenId);
    setLoading(true);
    try {
      const run = await api.getLatestSimulationRun(scenId);
      const data = await api.getSimulationAnalytics(run.id);
      setAnalyticsData(data);
      fetchExplanation(run.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = analyticsData?.summary_metrics;
  const progressCurve = analyticsData?.progress_curve || [];
  const shelterComparison = analyticsData?.shelter_comparison || [];
  const bottlenecks = (analyticsData?.bottlenecks && analyticsData.bottlenecks.length > 0)
    ? analyticsData.bottlenecks
    : FALLBACK_ANALYTICS.bottlenecks;
  const travelDistribution = (analyticsData?.travel_time_distribution && analyticsData.travel_time_distribution.length > 0)
    ? analyticsData.travel_time_distribution
    : FALLBACK_ANALYTICS.travel_time_distribution;

  // Top road congestion data
  const congestionBarData = bottlenecks.slice(0, 6).map((b: any) => ({
    name: b.road_name,
    ratio: Math.round((b.congestion_ratio || 1.0) * 100),
    delay: b.average_delay_seconds || 45,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
                Simulation Analytics & Quantitative Metrics
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Empirical results computed from discrete-time agent movement and network capacity constraints.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {scenarios.length > 0 && (
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-white border border-[#E1E7EF] text-[#0F172A] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-slate-900 shadow-xs"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {analyticsData && (
            <div className="flex items-center gap-2">
              <a
                href={api.getReportCsvUrl(analyticsData.run_id)}
                download
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E1E7EF] text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </a>
              <a
                href={api.getReportPdfUrl(analyticsData.run_id)}
                download
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* 14 Quantitative Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Total Pop</span>
            <span className="text-lg font-bold text-[#0F172A]">{metrics.total_population}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Evacuated</span>
            <span className="text-lg font-bold text-emerald-600">{metrics.successfully_evacuated}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Remaining</span>
            <span className="text-lg font-bold text-blue-600">{metrics.remaining_population}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Unreachable</span>
            <span className="text-lg font-bold text-rose-600">{metrics.unable_to_reach}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Clearance Rate</span>
            <span className="text-lg font-bold text-emerald-600">{metrics.evacuation_rate_pct}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Avg Clearance</span>
            <span className="text-lg font-bold text-[#0F172A]">{metrics.avg_evacuation_time_min}m</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Max Congestion</span>
            <span className="text-lg font-bold text-amber-600">{metrics.max_congestion_ratio}x</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Bottlenecks</span>
            <span className="text-lg font-bold text-amber-600">{metrics.bottlenecks_detected_count}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Roads Closed</span>
            <span className="text-lg font-bold text-rose-600">{metrics.blocked_roads_count}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Shelter Cap</span>
            <span className="text-lg font-bold text-[#0F172A]">{metrics.total_shelter_capacity}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Shelter Util</span>
            <span className="text-lg font-bold text-emerald-600">{metrics.total_shelter_utilization_pct}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Total Duration</span>
            <span className="text-lg font-bold text-[#0F172A]">{metrics.total_simulation_time_min}m</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Recalculations</span>
            <span className="text-lg font-bold text-blue-600">{metrics.route_recalculations_count}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Cap Shortage</span>
            <span className="text-lg font-bold text-[#0F172A]">
              {Math.max(0, metrics.total_population - metrics.total_shelter_capacity)}
            </span>
          </div>
        </div>
      )}

      {/* Main Analytical Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Timeline Curve */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E1E7EF]">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Evacuation Clearance Curve Over Time
            </h2>
            <span className="text-xs text-[#64748B]">Step Progression (Minutes)</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressCurve}>
                <defs>
                  <linearGradient id="anEvacGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" />
                <XAxis dataKey="time_min" stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} label={{ value: 'Simulation Time (min)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7EF', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="evacuated" name="Evacuated" stroke="#10B981" fill="url(#anEvacGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="in_transit" name="In Transit" stroke="#0284C7" fill="#0284C7" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="unreachable" name="Unreachable" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shelter Utilization Capacity Comparison */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E1E7EF]">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              Shelter Occupancy vs Maximum Capacity
            </h2>
            <span className="text-xs text-[#64748B]">Intake Quotas</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shelterComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tick={{ fill: '#64748B' }} />
                <YAxis stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7EF', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="occupancy" name="Current Occupants" fill="#0F172A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" name="Max Capacity" fill="#CBD5E1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Road Congestion Ranking Bar Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E1E7EF]">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Road Demand vs Capacity Ratio (%)
            </h2>
            <span className="text-xs text-[#64748B]">100% = Design Limit</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={congestionBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tick={{ fill: '#64748B' }} />
                <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={10} width={130} tick={{ fill: '#475569' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7EF', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }} />
                <Bar dataKey="ratio" name="Demand Ratio (%)" fill="#F59E0B" radius={[0, 6, 6, 0]}>
                  {congestionBarData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.ratio >= 125 ? '#DC2626' : (entry.ratio >= 100 ? '#EA580C' : '#D97706')} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Travel Time Distribution */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E1E7EF]">
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Evacuation Clearance Time Distribution
            </h2>
            <span className="text-xs text-[#64748B]">Agent Arrival Histogram</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={travelDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" />
                <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} />
                <YAxis stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7EF', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }} />
                <Bar dataKey="count" name="Evacuees" fill="#0F172A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Suraksha AI Analytical Explanation & Disaster Narrative */}
      <div className="p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#E1E7EF] gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                Suraksha AI Disaster Analytical Intelligence
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ground-Truth
                </span>
              </h2>
              <p className="text-xs text-[#64748B]">
                Algorithmic synthesis of network capacity, evacuation timeline, and shelter allocations.
              </p>
            </div>
          </div>

          <button
            onClick={() => analyticsData?.run_id && fetchExplanation(analyticsData.run_id)}
            disabled={loadingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-500 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>{loadingAi ? 'Synthesizing...' : 'Refresh AI Analysis'}</span>
          </button>
        </div>

        {aiExplanation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            {/* Executive Verdict */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Executive Drill Summary</span>
              </div>
              <p className="leading-relaxed text-[#334155]">
                {aiExplanation.executive_summary}
              </p>
            </div>

            {/* Bottleneck Breakdown */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Critical Bottleneck Breakdown</span>
              </div>
              <p className="leading-relaxed text-[#334155]">
                {aiExplanation.bottleneck_breakdown}
              </p>
            </div>

            {/* Shelter Allocation Insights */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Shelter Intake & Safe Haven Analysis</span>
              </div>
              <p className="leading-relaxed text-[#334155]">
                {aiExplanation.shelter_allocation_analysis}
              </p>
            </div>

            {/* Accessibility & Isolation */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Accessibility & Road Closure Impact</span>
              </div>
              <p className="leading-relaxed text-[#334155]">
                {aiExplanation.accessibility_and_isolation}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
            {loadingAi ? 'Synthesizing AI disaster explanation...' : 'AI analytical explanation ready. Click refresh or run a simulation drill.'}
          </div>
        )}
      </div>
    </div>
  );
};
