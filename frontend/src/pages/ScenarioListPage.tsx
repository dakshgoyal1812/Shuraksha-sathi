import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Play,
  Copy,
  Edit2,
  Trash2,
  BarChart3,
  RefreshCw,
  Clock,
  Users,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ScenarioListItem } from '../types/scenario';

export const ScenarioListPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const data = await api.getScenarios();
      setScenarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (scenarioId: string) => {
    setActionInProgress(scenarioId);
    try {
      await api.duplicateScenario(scenarioId);
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to duplicate scenario: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (scenarioId: string) => {
    if (scenarios.length <= 1) {
      alert('Cannot delete the last remaining scenario. Keep at least one demonstration drill.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this scenario and all associated runs?')) {
      return;
    }
    setActionInProgress(scenarioId);
    try {
      await api.deleteScenario(scenarioId);
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to delete scenario: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRunDrill = async (scenarioId: string) => {
    setActionInProgress(scenarioId);
    try {
      await api.runSimulation(scenarioId);
      navigate(`/simulation/${scenarioId}`);
    } catch (err: any) {
      alert('Failed to execute simulation: ' + err.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            Saved Disaster Scenarios
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Persisted disaster drills, baseline models, and What-If modified operational plans.
          </p>
        </div>

        <Link
          to="/scenarios/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Create Scenario</span>
        </Link>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scen) => (
          <div
            key={scen.id}
            className="p-5 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-[#E1E7EF]">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-base hover:text-blue-600 transition">
                    <Link to={`/simulation/${scen.id}`}>{scen.name}</Link>
                  </h3>
                  <span className="text-[11px] text-[#64748B] font-mono block mt-0.5">
                    Town: {scen.town_name} • Created: {new Date(scen.created_at).toLocaleDateString()}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                  {scen.disaster_type} • {scen.severity}
                </span>
              </div>

              <p className="text-xs text-[#64748B] mb-4 line-clamp-2 leading-relaxed">
                {scen.description || 'Configured disaster evacuation exercise.'}
              </p>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-[#E1E7EF] text-[11px] mb-4">
                <div>
                  <span className="text-[#64748B] block">Population</span>
                  <span className="font-mono font-bold text-[#0F172A]">{scen.population_size}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Shelters</span>
                  <span className="font-mono font-bold text-[#0F172A]">{scen.shelter_count}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Clearance</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {scen.latest_evacuation_rate != null ? `${scen.latest_evacuation_rate}%` : 'Not run'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E1E7EF]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleRunDrill(scen.id)}
                  disabled={actionInProgress === scen.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
                  title="Run simulation"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                  <span>Run</span>
                </button>

                <button
                  onClick={() => handleDuplicate(scen.id)}
                  disabled={actionInProgress === scen.id}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs"
                  title="Duplicate for What-If"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <Link
                  to={`/scenarios/${scen.id}/edit`}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-xs"
                  title="Edit Scenario"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => handleDelete(scen.id)}
                  disabled={actionInProgress === scen.id}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 transition shadow-xs"
                  title="Delete Scenario"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <Link
                to={`/simulation/${scen.id}`}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
