import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Shield,
  Layers,
  Users,
  Building,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Save,
  Play,
  RotateCcw,
  Sparkles,
  MapPin
} from 'lucide-react';
import { GreenfieldMap } from '../components/GreenfieldMap';
import { api } from '../services/api';
import { Scenario, Shelter } from '../types/scenario';

export const ScenarioBuilderPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mapData, setMapData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('Greenfield Severe Flood Drill');
  const [disasterType, setDisasterType] = useState<string>('Flood');
  const [severity, setSeverity] = useState<string>('High');
  const [description, setDescription] = useState<string>(
    'Simulated rapid water rise in Greenfield River resulting in closure of Main River Bridge and North High Road.'
  );
  const [populationSize, setPopulationSize] = useState<number>(500);

  // Network hazards
  const [blockedRoads, setBlockedRoads] = useState<string[]>(['E7', 'E14']);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [capacityMultiplier, setCapacityMultiplier] = useState<number>(1.0);
  const [staggeredEvacuation, setStaggeredEvacuation] = useState<boolean>(false);

  // Population demographics
  const [mobilityStandard, setMobilityStandard] = useState<number>(65);
  const [mobilitySlow, setMobilitySlow] = useState<number>(20);
  const [mobilityFast, setMobilityFast] = useState<number>(15);

  // Shelters
  const [sheltersList, setSheltersList] = useState<Shelter[]>([]);
  const [allowOverflow, setAllowOverflow] = useState<boolean>(false);

  useEffect(() => {
    loadMapAndScenario();
  }, [id]);

  const loadMapAndScenario = async () => {
    try {
      const gMap = await api.getDefaultMap();
      setMapData(gMap);

      if (id) {
        const scen: Scenario = await api.getScenario(id);
        setName(scen.name);
        setDisasterType(scen.disaster_type);
        setSeverity(scen.severity);
        setDescription(scen.description);
        setPopulationSize(scen.population_size);
        setBlockedRoads(scen.blocked_roads || []);
        setSpeedMultiplier(scen.speed_multiplier || 1.0);
        setCapacityMultiplier(scen.capacity_multiplier || 1.0);
        setStaggeredEvacuation(scen.staggered_evacuation || false);
        setSheltersList(scen.shelters || gMap.shelters);
      } else {
        setSheltersList(gMap.shelters || []);
      }
    } catch (e) {
      console.error('Error loading scenario builder data:', e);
    }
  };

  const toggleRoadClosure = (roadId: string) => {
    setBlockedRoads((prev) =>
      prev.includes(roadId) ? prev.filter((r) => r !== roadId) : [...prev, roadId]
    );
  };

  const handleShelterCapacityChange = (shelterId: string, cap: number) => {
    setSheltersList((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, capacity: cap } : s))
    );
  };

  const handleShelterAvailabilityToggle = (shelterId: string) => {
    setSheltersList((prev) =>
      prev.map((s) => (s.id === shelterId ? { ...s, availability: !s.availability } : s))
    );
  };

  const handleSaveScenario = async (runNow: boolean = false) => {
    setIsSaving(true);
    try {
      const payload: Partial<Scenario> = {
        name,
        disaster_type: disasterType,
        severity,
        description,
        population_size: populationSize,
        blocked_roads: blockedRoads,
        speed_multiplier: speedMultiplier,
        capacity_multiplier: capacityMultiplier,
        staggered_evacuation: staggeredEvacuation,
        shelters: sheltersList,
      };

      let savedId = id;
      if (isEditing && id) {
        await api.updateScenario(id, payload);
      } else {
        const created = await api.createScenario(payload);
        savedId = created.id;
      }

      if (runNow && savedId) {
        const runRes = await api.runSimulation(savedId);
        navigate(`/simulation/${savedId}?runId=${runRes.id}`);
      } else {
        navigate(`/scenarios`);
      }
    } catch (err: any) {
      alert('Failed to save scenario: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const stepsList = [
    { num: 1, title: 'Details', icon: Shield },
    { num: 2, title: 'Hazards & Roads', icon: Layers },
    { num: 3, title: 'Population', icon: Users },
    { num: 4, title: 'Shelters', icon: Building },
    { num: 5, title: 'Review & Save', icon: CheckCircle },
  ];

  const totalShelterCap = sheltersList.filter((s) => s.availability).reduce((acc, s) => acc + s.capacity, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-[#E1E7EF] gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              {isEditing ? 'Edit Disaster Scenario' : 'Scenario Builder Wizard'}
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Configure hypothetical disaster drill parameters, road closures, and shelter capacities.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-slate-100 text-[#0F172A] border border-[#E1E7EF]">
            Step {currentStep} of 5
          </span>
        </div>

        {/* Stepper Dots */}
        <div className="grid grid-cols-5 gap-2">
          {stepsList.map((st) => {
            const isDone = currentStep > st.num;
            const isCurr = currentStep === st.num;
            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition text-left ${
                  isCurr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : isDone
                    ? 'bg-slate-100 text-[#0F172A] border border-[#E1E7EF]'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50'
                }`}
              >
                <st.icon className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{st.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-[#E1E7EF] rounded-2xl p-6 sm:p-8 shadow-xs text-xs space-y-6">
        {/* Step 1: Scenario Details */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-base font-bold text-[#0F172A] mb-2">Step 1: Emergency Scenario Identity</h2>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Scenario Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-[#E1E7EF] rounded-xl px-3 py-2 text-[#0F172A] focus:outline-none focus:border-slate-900 text-xs shadow-xs"
                placeholder="e.g. Greenfield City — Severe River Inundation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Disaster Classification</label>
                <select
                  value={disasterType}
                  onChange={(e) => setDisasterType(e.target.value)}
                  className="w-full bg-white border border-[#E1E7EF] rounded-xl px-3 py-2 text-[#0F172A] focus:outline-none focus:border-slate-900 text-xs shadow-xs"
                >
                  <option value="Flood">Flood (River Inundation)</option>
                  <option value="Fire">Wildfire / Industrial Conflagration</option>
                  <option value="Earthquake">Earthquake / Infrastructure Collapse</option>
                  <option value="Custom">Custom Emergency Exercise</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Severity Parameter</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-white border border-[#E1E7EF] rounded-xl px-3 py-2 text-[#0F172A] focus:outline-none focus:border-slate-900 text-xs shadow-xs"
                >
                  <option value="Low">Low (Advisory Precaution)</option>
                  <option value="Moderate">Moderate (Localized Impact)</option>
                  <option value="High">High (Mandatory Order)</option>
                  <option value="Critical">Critical (Immediate Catastrophic)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Scenario Operational Summary</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-[#E1E7EF] rounded-xl px-3 py-2 text-[#0F172A] focus:outline-none focus:border-slate-900 text-xs shadow-xs"
                placeholder="Describe scenario conditions, bridge impacts, and expected challenges..."
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Total Simulated Population: {populationSize} agents</label>
              <input
                type="range"
                min="100"
                max="2500"
                step="50"
                value={populationSize}
                onChange={(e) => setPopulationSize(parseInt(e.target.value))}
                className="w-full accent-black cursor-pointer"
              />
              <span className="text-[#64748B] text-[11px] block mt-1">Supports up to 2,500 discrete agents for local desktop simulation.</span>
            </div>
          </div>
        )}

        {/* Step 2: Hazards & Road Network Closures */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E1E7EF] gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Step 2: Road Network Closures & Hazards</h2>
                <p className="text-[#64748B] text-xs">
                  Click on roads on the map or select checkboxes below to close roads affected by hazard waters.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                {blockedRoads.length} Road(s) Blocked
              </span>
            </div>

            {/* Interactive Map for road toggling */}
            {mapData && (
              <div className="rounded-2xl overflow-hidden border border-[#E1E7EF] shadow-xs">
                <GreenfieldMap
                  nodes={mapData.nodes}
                  edges={mapData.edges}
                  shelters={sheltersList}
                  hazardZone={mapData.hazard_zone}
                  blockedRoads={blockedRoads}
                  height="360px"
                  onRoadClick={(r) => toggleRoadClosure(r.id)}
                />
              </div>
            )}

            {/* Road Checkbox Grid */}
            <div>
              <span className="font-semibold text-slate-700 block mb-2">Road Closure Toggles:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50/70 rounded-xl border border-[#E1E7EF]">
                {mapData?.edges.map((e: any) => {
                  const isBlocked = blockedRoads.includes(e.id);
                  return (
                    <label
                      key={e.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border text-xs transition ${
                        isBlocked
                          ? 'bg-rose-50 border-rose-300 text-rose-800'
                          : 'bg-white border-[#E1E7EF] text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isBlocked}
                        onChange={() => toggleRoadClosure(e.id)}
                        className="rounded border-slate-300 text-rose-600 focus:ring-0"
                      />
                      <span className="font-medium truncate">{e.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Speed & Capacity Adjustments */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E1E7EF]">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Speed Factor: {speedMultiplier}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Road Capacity Factor: {capacityMultiplier}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={capacityMultiplier}
                  onChange={(e) => setCapacityMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div className="flex flex-col justify-center">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={staggeredEvacuation}
                    onChange={(e) => setStaggeredEvacuation(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <span>Staggered Zone Departures</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Population & Mobility */}
        {currentStep === 3 && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] mb-1">Step 3: Synthetic Population Mobility Mix</h2>
              <p className="text-[#64748B] text-xs">
                Configure synthetic demographic speed classes across the virtual population.
              </p>
            </div>

            <div className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-[#E1E7EF]">
              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Standard Evacuees (1.0x Speed):</span>
                  <span className="font-mono font-bold text-slate-900">{mobilityStandard}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={mobilityStandard}
                  onChange={(e) => setMobilityStandard(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Mobility-Limited / Slower Groups (0.65x Speed):</span>
                  <span className="font-mono font-bold text-amber-700">{mobilitySlow}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={mobilitySlow}
                  onChange={(e) => setMobilitySlow(parseInt(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-700 mb-1 font-medium">
                  <span>Vehicular / Express Clearance (1.35x Speed):</span>
                  <span className="font-mono font-bold text-emerald-700">{mobilityFast}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={mobilityFast}
                  onChange={(e) => setMobilityFast(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-[#E1E7EF] text-[#64748B] text-[11px]">
              <b>Note:</b> Virtual agents are distributed across residential zones (West Riverside, Hillside Estates, Oak Valley, Sunset Heights, Pinehurst, and Old River Town) based on residential density weights.
            </div>
          </div>
        )}

        {/* Step 4: Shelter Capacities & Availability */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E1E7EF] gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Step 4: Shelter Capacities & Quotas</h2>
                <p className="text-[#64748B] text-xs">
                  Set capacity limits and operational readiness for each Greenfield safe haven.
                </p>
              </div>
              <div className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${totalShelterCap >= populationSize ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                Total Capacity: {totalShelterCap} / {populationSize} Needed
              </div>
            </div>

            {totalShelterCap < populationSize && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  Warning: Configured active shelter capacity ({totalShelterCap}) is less than simulated population ({populationSize}). Some agents will be unable to reach safety unless capacity is increased.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sheltersList.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-50/70 border border-[#E1E7EF] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F172A] text-sm">{s.name}</span>
                    <button
                      onClick={() => handleShelterAvailabilityToggle(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        s.availability
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {s.availability ? 'OPERATIONAL' : 'OFFLINE'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-[#64748B] text-xs mb-1">
                      Bed Capacity: <span className="font-bold text-[#0F172A] font-mono">{s.capacity}</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="400"
                      step="10"
                      value={s.capacity}
                      disabled={!s.availability}
                      onChange={(e) => handleShelterCapacityChange(s.id, parseInt(e.target.value))}
                      className="w-full accent-black cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  <p className="text-[11px] text-[#64748B] italic">{s.notes || 'Safe municipal reception facility.'}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={allowOverflow}
                  onChange={(e) => setAllowOverflow(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span className="font-medium text-xs">Allow Experimental Shelter Overflow (Ignore Strict Physical Ceilings)</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 5: Review & Save */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] mb-1">Step 5: Review & Verification</h2>
              <p className="text-[#64748B] text-xs">
                Verify scenario inputs prior to persistence and simulation execution.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/70 border border-[#E1E7EF] space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-[#E1E7EF]">
                <div>
                  <span className="text-[#64748B] text-[11px] block font-semibold">Scenario</span>
                  <span className="font-bold text-[#0F172A] text-xs">{name}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-semibold">Disaster / Severity</span>
                  <span className="font-bold text-[#0F172A] text-xs">{disasterType} • {severity}</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-semibold">Population</span>
                  <span className="font-bold text-[#0F172A] font-mono text-xs">{populationSize} agents</span>
                </div>
                <div>
                  <span className="text-[#64748B] text-[11px] block font-semibold">Total Shelter Beds</span>
                  <span className="font-bold text-emerald-700 font-mono text-xs">{totalShelterCap} beds</span>
                </div>
              </div>

              <div>
                <span className="text-[#64748B] text-[11px] block mb-1 font-semibold">Road Closures:</span>
                <span className="font-mono text-xs text-rose-700 font-semibold">
                  {blockedRoads.length > 0 ? blockedRoads.join(', ') : 'None'}
                </span>
              </div>

              <div>
                <span className="text-[#64748B] text-[11px] block mb-1 font-semibold">Mobility Breakdown:</span>
                <span className="text-xs text-slate-700">
                  {mobilityStandard}% Standard • {mobilitySlow}% Slower/Mobility-limited • {mobilityFast}% Vehicular
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E1E7EF]">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E1E7EF] hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-30 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSaveScenario(false)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#E1E7EF] hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Scenario</span>
                </button>

                <button
                  onClick={() => handleSaveScenario(true)}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Save & Run Simulation</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
