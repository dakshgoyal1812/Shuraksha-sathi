import React, { useState, useEffect } from 'react';
import {
  Building,
  Shield,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Users,
  Percent
} from 'lucide-react';
import { api } from '../services/api';
import { Shelter, ScenarioListItem } from '../types/scenario';

export const ShelterManagementPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Shelter Modal
  const [isAddingShelter, setIsAddingShelter] = useState<boolean>(false);
  const [newShelterName, setNewShelterName] = useState<string>('');
  const [newShelterCapacity, setNewShelterCapacity] = useState<number>(200);
  const [newShelterNodeId, setNewShelterNodeId] = useState<string>('N17');
  const [newShelterNotes, setNewShelterNotes] = useState<string>('');

  useEffect(() => {
    loadScenariosAndShelters();
  }, []);

  const loadScenariosAndShelters = async () => {
    setLoading(true);
    try {
      const list = await api.getScenarios();
      setScenarios(list);
      if (list.length > 0) {
        const firstId = list[0].id;
        setSelectedScenarioId(firstId);
        const shList = await api.getShelters(firstId);
        setShelters(shList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScenarioChange = async (scenId: string) => {
    setSelectedScenarioId(scenId);
    setLoading(true);
    try {
      const shList = await api.getShelters(scenId);
      setShelters(shList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (shelter: Shelter) => {
    try {
      const updated = await api.updateShelter(shelter.id, {
        availability: !shelter.availability,
      });
      setShelters((prev) => prev.map((s) => (s.id === shelter.id ? updated : s)));
    } catch (err: any) {
      alert('Failed to update shelter: ' + err.message);
    }
  };

  const handleCapacityChange = async (shelter: Shelter, newCap: number) => {
    if (newCap <= 0) return;
    try {
      const updated = await api.updateShelter(shelter.id, { capacity: newCap });
      setShelters((prev) => prev.map((s) => (s.id === shelter.id ? updated : s)));
    } catch (err: any) {
      alert('Failed to update capacity: ' + err.message);
    }
  };

  const handleDeleteShelter = async (shelterId: string) => {
    if (shelters.length <= 1) {
      alert('Cannot delete the last remaining shelter. At least one safe refuge is required.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this shelter from the scenario?')) {
      return;
    }
    try {
      await api.deleteShelter(shelterId);
      setShelters((prev) => prev.filter((s) => s.id !== shelterId));
    } catch (err: any) {
      alert('Failed to delete shelter: ' + err.message);
    }
  };

  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShelterName.trim()) {
      alert('Please enter a shelter name.');
      return;
    }

    try {
      const created = await api.createShelter(selectedScenarioId, {
        name: newShelterName,
        node_id: newShelterNodeId,
        x: 480, // Default coord near node
        y: 80,
        capacity: newShelterCapacity,
        availability: true,
        priority: 1,
        notes: newShelterNotes,
      });
      setShelters((prev) => [...prev, created]);
      setIsAddingShelter(false);
      setNewShelterName('');
      setNewShelterNotes('');
    } catch (err: any) {
      alert('Failed to create shelter: ' + err.message);
    }
  };

  const totalCap = shelters.filter((s) => s.availability).reduce((acc, s) => acc + s.capacity, 0);
  const totalOccupancy = shelters.reduce((acc, s) => acc + s.assigned_population, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            Shelter Capacity & Readiness Management
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Configure municipal evacuation centers, bed quotas, and intake prioritization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {scenarios.length > 0 && (
            <select
              value={selectedScenarioId}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-white border border-[#E2E8F0] text-slate-800 text-xs rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:border-slate-900 font-medium cursor-pointer"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsAddingShelter(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Add Shelter</span>
          </button>
        </div>
      </div>

      {/* Aggregate Capacity Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <span className="text-[12px] font-semibold text-[#64748B] block mb-1">
            Active Bed Capacity
          </span>
          <span className="text-2xl font-bold font-sans text-[#0F172A]">{totalCap} beds</span>
          <p className="text-[11px] text-[#94A3B8] mt-1">Across {shelters.filter((s) => s.availability).length} operational shelters.</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <span className="text-[12px] font-semibold text-[#64748B] block mb-1">
            Assigned Occupancy
          </span>
          <span className="text-2xl font-bold font-sans text-blue-600">{totalOccupancy} evacuees</span>
          <p className="text-[11px] text-[#94A3B8] mt-1">Based on latest drill simulation output.</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E1E7EF] shadow-xs">
          <span className="text-[12px] font-semibold text-[#64748B] block mb-1">
            System Utilization
          </span>
          <span className="text-2xl font-bold font-sans text-emerald-700">
            {totalCap > 0 ? Math.round((totalOccupancy / totalCap) * 100) : 0}%
          </span>
          <p className="text-[11px] text-[#94A3B8] mt-1">
            {totalCap - totalOccupancy} remaining surplus bed capacity.
          </p>
        </div>
      </div>

      {/* Shelters Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shelters.map((s) => {
          const utilPct = s.utilization_pct || Math.round((s.assigned_population / Math.max(1, s.capacity)) * 100);
          let statusLabel = 'Available';
          let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';

          if (!s.availability) {
            statusLabel = 'Unavailable';
            statusColor = 'text-slate-500 bg-slate-100 border-slate-200';
          } else if (utilPct >= 100) {
            statusLabel = 'Full';
            statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
          } else if (utilPct >= 80) {
            statusLabel = 'Near Capacity';
            statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
          } else if (utilPct > 0) {
            statusLabel = 'Partially Occupied';
            statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
          }

          return (
            <div
              key={s.id}
              className={`p-5 rounded-2xl border shadow-xs transition ${
                s.availability ? 'bg-white border-[#E1E7EF] hover:border-slate-300' : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#E1E7EF]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-sm">{s.name}</h3>
                    <span className="text-[11px] text-[#64748B] font-mono">Graph Node: {s.node_id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${statusColor}`}>
                    {statusLabel}
                  </span>
                  <button
                    onClick={() => handleDeleteShelter(s.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                    title="Remove shelter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs text-[#0F172A] font-medium">
                  <span>Occupancy: {s.assigned_population} / {s.capacity}</span>
                  <span className="font-mono font-bold">{utilPct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      utilPct >= 100 ? 'bg-rose-500' : (utilPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500')
                    }`}
                    style={{ width: `${Math.min(100, utilPct)}%` }}
                  />
                </div>
              </div>

              {/* Editable Capacity Slider */}
              <div className="space-y-2 pt-2 border-t border-[#E1E7EF] text-xs">
                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Adjust Capacity Limit:</span>
                  <span className="font-mono font-bold text-[#0F172A] text-sm">{s.capacity}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="450"
                  step="10"
                  value={s.capacity}
                  disabled={!s.availability}
                  onChange={(e) => handleCapacityChange(s, parseInt(e.target.value))}
                  className="w-full accent-slate-900 disabled:opacity-40"
                />

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleToggleAvailability(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                      s.availability
                        ? 'bg-white border border-[#E2E8F0] hover:bg-slate-50 text-slate-700'
                        : 'bg-black hover:bg-slate-800 text-white'
                    }`}
                  >
                    {s.availability ? 'Take Offline' : 'Activate Shelter'}
                  </button>

                  <span className="text-[11px] text-[#94A3B8]">
                    Priority Tier {s.priority}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Shelter Modal Dialog */}
      {isAddingShelter && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E1E7EF] rounded-2xl p-6 max-w-md w-full shadow-2xl text-xs space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#E1E7EF]">
              <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Add Evacuation Shelter
              </h2>
              <button onClick={() => setIsAddingShelter(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateShelter} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Facility Name</label>
                <input
                  type="text"
                  required
                  value={newShelterName}
                  onChange={(e) => setNewShelterName(e.target.value)}
                  placeholder="e.g. North Ridge Civic Pavilion"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#0F172A] text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Bed Capacity</label>
                  <input
                    type="number"
                    min="20"
                    max="1000"
                    value={newShelterCapacity}
                    onChange={(e) => setNewShelterCapacity(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#0F172A] text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Node</label>
                  <select
                    value={newShelterNodeId}
                    onChange={(e) => setNewShelterNodeId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#0F172A] text-xs focus:outline-none focus:border-slate-900"
                  >
                    <option value="N17">N17 (North High Area)</option>
                    <option value="N18">N18 (East Sports Area)</option>
                    <option value="N19">N19 (South Medical Area)</option>
                    <option value="N20">N20 (West Valley Arena)</option>
                    <option value="N9">N9 (Downtown Central)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Operational Notes</label>
                <textarea
                  rows={2}
                  value={newShelterNotes}
                  onChange={(e) => setNewShelterNotes(e.target.value)}
                  placeholder="Generator status, supplies, special staging..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-[#0F172A] text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E1E7EF]">
                <button
                  type="button"
                  onClick={() => setIsAddingShelter(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-black hover:bg-slate-800 text-white font-bold"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
