import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Play,
  Copy,
  ArrowRight,
  Sliders,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { ScenarioListItem, ComparisonResponse, ComparisonItem } from '../types/scenario';

export const ComparePage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadComparisonData();
  }, []);

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const scenList = await api.getScenarios();
      setScenarios(scenList);

      // Collect latest run IDs from available scenarios
      const runIdsToCompare: string[] = [];
      for (const s of scenList.slice(0, 3)) {
        try {
          const run = await api.getLatestSimulationRun(s.id);
          runIdsToCompare.push(run.id);
        } catch {
          // No run for this scenario
        }
      }

      if (runIdsToCompare.length > 0) {
        setSelectedRunIds(runIdsToCompare);
        const comp = await api.compareSimulationRuns(runIdsToCompare);
        setComparison(comp);
      }
    } catch (e) {
      console.error('Error loading comparison data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateForWhatIf = async (scenarioId: string) => {
    setDuplicatingId(scenarioId);
    try {
      const duplicated = await api.duplicateScenario(scenarioId);
      navigate(`/scenarios/${duplicated.id}/edit`);
    } catch (err: any) {
      alert('Failed to duplicate scenario: ' + err.message);
    } finally {
      setDuplicatingId(null);
    }
  };

  const items = comparison?.items || [];

  // Chart data
  const chartData = items.map((it) => ({
    name: it.scenario_name.length > 18 ? it.scenario_name.substring(0, 16) + '...' : it.scenario_name,
    evac_rate: it.evacuation_rate_pct,
    avg_time: it.avg_evacuation_time_min,
    bottlenecks: it.bottleneck_count,
    score: it.score,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
            <GitCompare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Strategy Comparison & What-If Analysis
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Evaluate alternative evacuation strategies side-by-side using empirical performance criteria.
            </p>
          </div>
        </div>

        {scenarios.length > 0 && (
          <button
            onClick={() => handleDuplicateForWhatIf(scenarios[0].id)}
            disabled={duplicatingId != null}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
          >
            <Copy className="w-4 h-4" />
            <span>Create What-If Branch</span>
          </button>
        )}
      </div>

      {/* Synthesis & Trade-Off Banner */}
      {comparison && (
        <div className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#0F172A] font-bold uppercase tracking-wider text-[11px]">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Synthesized Strategy Trade-Off Analysis</span>
          </div>
          <p className="text-[#475569] leading-relaxed text-xs">
            {comparison.trade_off_analysis}
          </p>
        </div>
      )}

      {/* Multi-Run KPI Comparison Matrix */}
      {items.length > 0 ? (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs overflow-x-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E1E7EF]">
            <span className="font-bold text-[#0F172A] text-sm">Empirical Evaluation Matrix</span>
            <span className="text-xs text-[#64748B]">Green badges indicate best performing metric</span>
          </div>

          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E1E7EF] text-[#64748B]">
                <th className="pb-3 font-semibold">Strategy / Scenario</th>
                <th className="pb-3 font-semibold">Disaster</th>
                <th className="pb-3 text-center font-semibold">Clearance %</th>
                <th className="pb-3 text-center font-semibold">Avg Time</th>
                <th className="pb-3 text-center font-semibold">Bottlenecks</th>
                <th className="pb-3 text-center font-semibold">Max Stress</th>
                <th className="pb-3 text-center font-semibold">Shelter Util</th>
                <th className="pb-3 text-center font-semibold">Overall Score</th>
                <th className="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E7EF]">
              {items.map((it) => {
                const isBestRate = it.run_id === comparison?.best_evacuation_rate_run_id;
                const isFastest = it.run_id === comparison?.fastest_evacuation_run_id;
                const isFewestB = it.run_id === comparison?.fewest_bottlenecks_run_id;

                return (
                  <tr key={it.run_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 font-bold text-[#0F172A] max-w-xs">
                      {it.scenario_name}
                      <span className="block font-normal text-[10px] text-[#94A3B8] font-mono">
                        Run: {it.run_id.substring(0, 8)}...
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-600">
                      {it.disaster_type} ({it.severity})
                    </td>

                    {/* Evacuation Rate */}
                    <td className="py-3.5 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          isBestRate ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-[#0F172A]'
                        }`}
                      >
                        {it.evacuation_rate_pct}%
                      </span>
                    </td>

                    {/* Avg Evacuation Time */}
                    <td className="py-3.5 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          isFastest ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-[#0F172A]'
                        }`}
                      >
                        {it.avg_evacuation_time_min}m
                      </span>
                    </td>

                    {/* Bottlenecks */}
                    <td className="py-3.5 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                          isFewestB ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-amber-700'
                        }`}
                      >
                        {it.bottleneck_count}
                      </span>
                    </td>

                    {/* Max Congestion Ratio */}
                    <td className="py-3.5 text-center font-mono text-slate-700">
                      {it.max_congestion_ratio}x
                    </td>

                    {/* Shelter Util */}
                    <td className="py-3.5 text-center font-mono text-slate-700">
                      {it.shelter_utilization_pct}%
                    </td>

                    {/* Score */}
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[#0F172A] border border-[#E1E7EF] font-bold text-xs">
                        {it.score} / 100
                      </span>
                    </td>

                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          to={`/analytics/${it.run_id}`}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E1E7EF] hover:bg-slate-50 text-slate-700 text-[11px] font-medium transition"
                        >
                          Analytics
                        </Link>
                        <a
                          href={api.getReportPdfUrl(it.run_id)}
                          download
                          className="px-2.5 py-1 rounded-lg bg-black hover:bg-slate-800 text-white text-[11px] font-medium transition shadow-xs"
                        >
                          PDF
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-[#E1E7EF] rounded-2xl text-[#64748B] text-xs shadow-xs">
          <GitCompare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <span>At least two simulation runs are needed to generate comparative analytics.</span>
        </div>
      )}

      {/* Comparative Charts Grid */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Clearance Rate Comparison */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Evacuation Clearance Rate (%)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} />
                  <YAxis stroke="#94A3B8" fontSize={11} domain={[0, 100]} tick={{ fill: '#64748B' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7EF', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }} />
                  <Bar dataKey="evac_rate" name="Clearance %" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Average Clearance Time Comparison */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
            <h3 className="text-sm font-bold text-[#0F172A] mb-3">Average Evacuation Time (Minutes)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E1E7EF" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} />
                  <YAxis stroke="#94A3B8" fontSize={11} tick={{ fill: '#64748B' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1E7EF', borderRadius: '12px', fontSize: '12px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)' }} />
                  <Bar dataKey="avg_time" name="Avg Minutes" fill="#0F172A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
