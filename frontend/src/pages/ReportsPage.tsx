import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Building,
  AlertTriangle,
  CheckCircle,
  Users,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioListItem } from '../types/scenario';

export const ReportsPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      const list = await api.getScenarios();
      setScenarios(list);
      if (list.length > 0) {
        // Fetch run for first scenario
        const run = await api.getLatestSimulationRun(list[0].id);
        setSelectedRunId(run.id);
        const rep = await api.getReportData(run.id);
        setReportData(rep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = async (scenId: string) => {
    setLoading(true);
    try {
      const run = await api.getLatestSimulationRun(scenId);
      setSelectedRunId(run.id);
      const rep = await api.getReportData(run.id);
      setReportData(rep);
    } catch (e) {
      console.error(e);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const metrics = reportData?.metrics;
  const bottlenecks = reportData?.bottlenecks || [];
  const recommendations = reportData?.recommendations || [];
  const assumptions = reportData?.assumptions_and_limitations || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header / Actions (Hidden during print) */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Formal Evacuation Simulation Reports
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Export comprehensive documentation for emergency preparedness exercises.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {scenarios.length > 0 && (
            <select
              onChange={(e) => handleSelectScenario(e.target.value)}
              className="bg-white border border-[#E1E7EF] text-[#0F172A] text-xs font-medium rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:border-slate-900"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          {selectedRunId && (
            <>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E1E7EF] text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <a
                href={api.getReportCsvUrl(selectedRunId)}
                download
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E1E7EF] text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </a>

              <a
                href={api.getReportPdfUrl(selectedRunId)}
                download
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </>
          )}
        </div>
      </div>

      {/* Printable Report Document Card */}
      {reportData ? (
        <div className="bg-white border border-[#E1E7EF] rounded-2xl p-8 sm:p-10 shadow-xs space-y-8 text-xs text-[#1F2937] print:bg-white print:text-black print:p-0 print:border-none">
          {/* Document Header */}
          <div className="border-b border-[#E1E7EF] pb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block">
                  EVACUSAFE SIMULATION PLATFORM • FORMAL DRILL REPORT
                </span>
                <h2 className="text-2xl font-bold text-[#0F172A] mt-1 tracking-tight">
                  {reportData.scenario_name}
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  {reportData.description}
                </p>
              </div>
              <div className="text-right font-mono text-[11px] text-[#64748B]">
                <div>Run ID: {reportData.run_id.substring(0, 8)}...</div>
                <div>Generated: {new Date(reportData.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#E1E7EF]">
              <div>
                <span className="text-[#64748B] text-[10px] block font-semibold">Disaster Category</span>
                <span className="font-bold text-[#0F172A]">{reportData.disaster_type}</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] block font-semibold">Severity Classification</span>
                <span className="font-bold text-amber-700">{reportData.severity}</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] block font-semibold">Simulated Population</span>
                <span className="font-bold text-[#0F172A] font-mono">{reportData.population_size} Persons</span>
              </div>
              <div>
                <span className="text-[#64748B] text-[10px] block font-semibold">Town Environment</span>
                <span className="font-bold text-[#0F172A]">Greenfield City</span>
              </div>
            </div>
          </div>

          {/* Executive Summary Metrics */}
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              1. Executive Performance Metrics
            </h3>
            {metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Clearance Rate</span>
                  <span className="text-xl font-bold font-mono text-emerald-600">{metrics.evacuation_rate_pct}%</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Successfully Evacuated</span>
                  <span className="text-xl font-bold font-mono text-[#0F172A]">{metrics.successfully_evacuated} persons</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Average Clearance Time</span>
                  <span className="text-xl font-bold font-mono text-[#0F172A]">{metrics.avg_evacuation_time_min} minutes</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50/70 border border-[#E1E7EF]">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Unreachable Population</span>
                  <span className="text-xl font-bold font-mono text-rose-600">{metrics.unable_to_reach} persons</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottleneck Analysis Table */}
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              2. Bottleneck & Corridor Stress Analysis
            </h3>
            {bottlenecks.length > 0 ? (
              <div className="border border-[#E1E7EF] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-[#E1E7EF] text-[#64748B]">
                    <tr>
                      <th className="p-3 font-semibold">Corridor Name</th>
                      <th className="p-3 font-semibold">Category</th>
                      <th className="p-3 font-semibold">Simulated Demand</th>
                      <th className="p-3 font-semibold">Design Limit</th>
                      <th className="p-3 font-semibold">Stress Ratio</th>
                      <th className="p-3 font-semibold">Delay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1E7EF]">
                    {bottlenecks.map((b: any) => (
                      <tr key={b.road_id} className="hover:bg-slate-50/60 transition">
                        <td className="p-3 font-medium text-[#0F172A]">{b.road_name} ({b.road_id})</td>
                        <td className="p-3 font-bold text-amber-700">{b.category}</td>
                        <td className="p-3 font-mono">{b.simulated_load} units</td>
                        <td className="p-3 font-mono">{b.configured_capacity} units</td>
                        <td className="p-3 font-mono font-bold text-amber-700">{b.congestion_ratio}x</td>
                        <td className="p-3 font-mono text-[#64748B]">+{b.average_delay_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[#64748B] italic">No corridors exceeded threshold capacity.</p>
            )}
          </div>

          {/* Rule-Based Recommendations */}
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">
              3. Operational Action Recommendations
            </h3>
            <div className="space-y-3">
              {recommendations.map((r: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50/70 border border-[#E1E7EF] space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-[#0F172A]">
                    <span className="text-sm">{r.title}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-lg bg-white border border-[#E1E7EF] text-[#0F172A] font-semibold">
                      {r.severity}
                    </span>
                  </div>
                  <p className="text-[#475569]">{r.problem}</p>
                  <div className="text-slate-900 font-medium pt-1">
                    <span className="text-[#64748B] font-normal">Action: </span>
                    {r.suggested_action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Assumptions & Disclaimer */}
          <div className="pt-4 border-t border-[#E1E7EF] space-y-2">
            <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              4. Model Assumptions & Operational Limitations
            </h3>
            <ul className="list-disc list-inside space-y-1 text-[#64748B] text-[11px]">
              {assumptions.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center text-[#64748B] text-xs bg-white border border-[#E1E7EF] rounded-2xl shadow-xs">
          Select or run a simulation to generate printable reports.
        </div>
      )}
    </div>
  );
};
