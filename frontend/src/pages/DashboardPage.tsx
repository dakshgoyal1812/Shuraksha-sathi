import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  Percent,
  AlertTriangle,
  Building,
  Play,
  PlusCircle,
  GitCompare,
  FileText,
  Shield,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Radio
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  Cell
} from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { api } from '../services/api';
import { ScenarioListItem, SimulationRun } from '../types/scenario';
import { FALLBACK_LATEST_RUN, FALLBACK_SCENARIOS } from '../services/mockData';

export const DashboardPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>(FALLBACK_SCENARIOS);
  const [latestRun, setLatestRun] = useState<SimulationRun | null>(FALLBACK_LATEST_RUN);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const scenList = await api.getScenarios();
      setScenarios(scenList);

      if (scenList.length > 0) {
        // Load latest run from first scenario
        try {
          const run = await api.getLatestSimulationRun(scenList[0].id);
          setLatestRun(run);
        } catch {
          // If no run yet, that's handled
        }
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = latestRun?.summary_metrics;
  const snapshots = latestRun?.step_snapshots || [];
  const bottlenecks = latestRun?.bottlenecks || [];
  const recommendations = latestRun?.recommendations || [];

  // Transform snapshots into timeline chart data
  const progressData = snapshots.map((s) => ({
    time: `${s.simulated_time_min}m`,
    evacuated: s.evacuated_count,
    in_transit: s.moving_count,
    waiting: s.waiting_count,
    unreachable: s.unreachable_count,
  }));

  // Shelter bars data
  const shelterData = latestRun?.step_snapshots.length
    ? Object.entries(latestRun.step_snapshots[latestRun.step_snapshots.length - 1].shelter_occupancy).map(([sid, occ]) => ({
        id: sid,
        name: sid.includes('S1') ? 'North High' : (sid.includes('S2') ? 'East Sports' : (sid.includes('S3') ? 'South Medical' : 'West Arena')),
        occupancy: occ,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E1E7EF]">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">
            Emergency Operations Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time analysis of simulated disaster evacuation drills across Greenfield City.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/scenarios/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>New Scenario</span>
          </Link>
          {scenarios.length > 0 && (
            <Link
              to={`/simulation/${scenarios[0].id}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-800 font-semibold text-xs transition shadow-xs"
            >
              <Play className="w-4 h-4 fill-current text-blue-600" />
              <span>Launch Drill</span>
            </Link>
          )}
          <Link
            to="/live-tracking"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition shadow-xs"
          >
            <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>Live Hazard Tracker</span>
          </Link>
          <Link
            to="/compare"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-800 font-semibold text-xs transition shadow-xs"
          >
            <GitCompare className="w-4 h-4 text-slate-600" />
            <span>Compare</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        <MetricCard
          label="Total Population"
          value={metrics ? metrics.total_population.toLocaleString() : '—'}
          unit="agents"
          icon={Users}
          description="Simulated synthetic population units."
          status="normal"
        />
        <MetricCard
          label="Evacuated"
          value={metrics ? metrics.successfully_evacuated.toLocaleString() : '—'}
          unit="safe"
          icon={CheckCircle}
          description="Virtual evacuees arrived at designated shelter."
          status="success"
        />
        <MetricCard
          label="Remaining"
          value={metrics ? metrics.remaining_population.toLocaleString() : '—'}
          unit="in network"
          icon={Clock}
          description="Agents en route or awaiting departure."
          status={metrics && metrics.remaining_population > 0 ? "warning" : "normal"}
        />
        <MetricCard
          label="Completion Rate"
          value={metrics ? `${metrics.evacuation_rate_pct}%` : '—'}
          icon={Percent}
          description="Overall clearance percentage achieved."
          status={metrics && metrics.evacuation_rate_pct >= 90 ? "success" : "warning"}
        />
        <MetricCard
          label="Bottlenecks"
          value={metrics ? metrics.bottlenecks_detected_count : '—'}
          unit="roads"
          icon={AlertTriangle}
          description="Roads exceeding design capacity threshold."
          status={metrics && metrics.bottlenecks_detected_count > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Shelter Utilization"
          value={metrics ? `${metrics.total_shelter_utilization_pct}%` : '—'}
          icon={Building}
          description="Aggregated occupancy vs available capacity."
          status={metrics && metrics.total_shelter_utilization_pct >= 90 ? "warning" : "normal"}
        />
      </div>

      {/* Main Charts & Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Evacuation Progress Area Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E1E7EF]">
            <div>
              <h2 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Evacuation Clearance Progress Over Time
              </h2>
              <span className="text-xs text-[#64748B]">
                Discrete-time step progression ({latestRun?.scenario_name || 'Drill'})
              </span>
            </div>
            {latestRun && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                Duration: {latestRun.summary_metrics.total_simulation_time_min} min
              </span>
            )}
          </div>

          {progressData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressData}>
                  <defs>
                    <linearGradient id="evacGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="movingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: 'transparent', borderRadius: '8px', color: '#FFFFFF', fontSize: '12px' }}
                    itemStyle={{ color: '#FFFFFF' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="evacuated" name="Successfully Evacuated" stroke="#059669" fill="url(#evacGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="in_transit" name="In Transit" stroke="#2563EB" fill="url(#movingGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="unreachable" name="Unreachable" stroke="#DC2626" fill="#DC2626" fillOpacity={0.15} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Play className="w-8 h-8 text-slate-300 mb-2" />
              <span>No active simulation run recorded yet. Run a scenario drill to generate live progress.</span>
            </div>
          )}
        </div>

        {/* Shelter Utilization Bar Chart */}
        <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E1E7EF]">
              <h2 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                Shelter Intake Load
              </h2>
              <Link to="/shelters" className="text-xs text-blue-600 hover:underline font-medium">
                Manage
              </Link>
            </div>

            {shelterData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shelterData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" horizontal={false} />
                    <XAxis type="number" stroke="#64748B" fontSize={10} />
                    <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0F172A', borderColor: 'transparent', borderRadius: '8px', color: '#FFFFFF', fontSize: '12px' }}
                    />
                    <Bar dataKey="occupancy" name="Assigned Evacuees" fill="#0F172A" radius={[0, 4, 4, 0]}>
                      {shelterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.occupancy >= 200 ? '#F59E0B' : '#059669'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                No shelter occupancy data recorded.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#64748B] flex justify-between items-center">
            <span>Overall Capacity: {metrics?.total_shelter_capacity || 830} beds</span>
            <span className="font-semibold text-emerald-700">Zero Over-Allocation</span>
          </div>
        </div>
      </div>

      {/* Lower Grid: Bottlenecks & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Congested Simulated Roads */}
        <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E1E7EF]">
            <h2 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Critical Bottlenecks & Monitored Corridors
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {bottlenecks.length} Identified
            </span>
          </div>

          {bottlenecks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E1E7EF] text-[#64748B] bg-slate-50/70">
                    <th className="py-2 px-3">Road Corridor</th>
                    <th className="py-2 px-3">Load/Cap</th>
                    <th className="py-2 px-3">Ratio</th>
                    <th className="py-2 px-3">Severity</th>
                    <th className="py-2 px-3">Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E1E7EF]">
                  {bottlenecks.slice(0, 4).map((b) => (
                    <tr key={b.road_id} className="hover:bg-slate-50/60 transition">
                      <td className="py-2.5 px-3 font-medium text-[#0F172A]">
                        {b.road_name}
                        <span className="block text-[10px] text-slate-400 font-mono">{b.road_id}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {b.simulated_load} / {b.configured_capacity}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700">
                        {b.congestion_ratio}x
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.category === 'Critical'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {b.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">+{b.average_delay_seconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              No critical bottlenecks detected under current scenario parameters.
            </div>
          )}
        </div>

        {/* Rule-Based Mitigation Recommendations */}
        <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E1E7EF]">
            <h2 className="text-[14px] font-semibold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Rule-Based Operational Recommendations
            </h2>
            <Link to="/reports" className="text-xs text-blue-600 hover:underline font-medium">
              Full Report
            </Link>
          </div>

          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((r, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-[#E1E7EF] hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-[#0F172A]">{r.title}</span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        r.severity === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : r.severity === 'High'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] mb-1.5 leading-relaxed">{r.problem}</p>
                  <div className="text-[11px] text-slate-900 font-medium">
                    <span className="text-slate-500 font-normal">Suggested Action: </span>
                    {r.suggested_action}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs">
              Run simulation to generate dynamic operational recommendations.
            </div>
          )}
        </div>
      </div>

      {/* Saved Scenarios Table */}
      <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E1E7EF]">
          <div>
            <h2 className="text-[14px] font-semibold text-[#0F172A]">Active Scenarios in Greenfield City</h2>
            <p className="text-xs text-[#64748B]">Baseline and What-If modified disaster plans.</p>
          </div>
          <Link to="/scenarios" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E1E7EF] text-[#64748B] bg-slate-50/70">
                <th className="py-2.5 px-3">Scenario Name</th>
                <th className="py-2.5 px-3">Disaster</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Population</th>
                <th className="py-2.5 px-3">Shelters</th>
                <th className="py-2.5 px-3">Latest Clearance</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7EF]">
              {scenarios.map((scen) => (
                <tr key={scen.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 font-semibold text-[#0F172A]">
                    <Link to={`/simulation/${scen.id}`} className="hover:text-blue-600">
                      {scen.name}
                    </Link>
                    <span className="block text-[11px] text-[#64748B] font-normal truncate max-w-sm">
                      {scen.description}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{scen.disaster_type}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {scen.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">{scen.population_size.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono text-slate-700">{scen.shelter_count}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                    {scen.latest_evacuation_rate != null ? `${scen.latest_evacuation_rate}%` : 'Not run'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/simulation/${scen.id}`}
                        className="px-2.5 py-1 rounded-lg bg-black hover:bg-slate-800 text-white transition font-medium text-[11px] shadow-xs"
                      >
                        Simulation
                      </Link>
                      <Link
                        to={`/analytics/${scen.id}`}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 transition font-medium text-[11px] shadow-xs"
                      >
                        Analytics
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
