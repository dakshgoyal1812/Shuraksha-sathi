import { ScenarioListItem, SimulationRun } from '../types/scenario';

export const FALLBACK_SCENARIOS: ScenarioListItem[] = [
  {
    id: "demo-greenfield-flood-optimized",
    name: "Greenfield City — Optimized Route & Staggered Strategy",
    description: "Mitigated scenario featuring emergency bypass routing, reopening of western levee road R-1, expanded North Shelter capacity (+60 beds), and staggered evacuation protocols.",
    town_name: "Greenfield City",
    disaster_type: "Flood",
    severity: "High",
    population_size: 600,
    shelter_count: 4,
    created_at: new Date().toISOString(),
    latest_run_id: "demo-optimized-run",
    latest_evacuation_rate: 100.0,
  },
  {
    id: "demo-greenfield-flood-baseline",
    name: "Greenfield City — Flood Evacuation Drill",
    description: "A hypothetical flood affects the Greenfield River basin. Planners must evacuate the affected population through the available road network while accounting for blocked river crossings and shelter capacity.",
    town_name: "Greenfield City",
    disaster_type: "Flood",
    severity: "High",
    population_size: 600,
    shelter_count: 4,
    created_at: new Date().toISOString(),
    latest_run_id: "demo-baseline-run",
    latest_evacuation_rate: 100.0,
  }
];

export const FALLBACK_LATEST_RUN: SimulationRun = {
  id: "demo-baseline-run",
  scenario_id: "demo-greenfield-flood-baseline",
  scenario_name: "Greenfield City — Flood Evacuation Drill",
  status: "completed",
  random_seed: 42,
  total_steps: 38,
  simulated_duration_sec: 1140.0,
  summary_metrics: {
    total_population: 600,
    successfully_evacuated: 600,
    remaining_population: 0,
    unable_to_reach: 0,
    evacuation_rate_pct: 100.0,
    total_simulation_time_min: 19.0,
    avg_evacuation_time_min: 6.8,
    max_congestion_ratio: 3.84,
    bottlenecks_detected_count: 10,
    blocked_roads_count: 2,
    average_travel_time_min: 6.8,
    route_recalculations_count: 0,
    total_shelter_capacity: 830,
    total_shelter_utilization_pct: 72.3,
  },
  timeline_events: [
    { step: 1, time_min: 0.5, event_type: "SIMULATION_START", description: "Evacuation order broadcast to all 7 residential sectors.", severity: "info" },
    { step: 4, time_min: 2.0, event_type: "BOTTLENECK_ALERT", description: "Old Town Commercial Way exceeded capacity (384% load: 96/25 units).", severity: "danger", related_id: "R-8" },
    { step: 8, time_min: 4.0, event_type: "BOTTLENECK_ALERT", description: "Hillside Boulevard exceeded capacity (215% load: 65/30 units).", severity: "danger", related_id: "R-2" },
    { step: 18, time_min: 9.0, event_type: "SHELTER_FULL", description: "North High School Shelter reached 100% capacity (220/220).", severity: "warning", related_id: "S1" },
    { step: 38, time_min: 19.0, event_type: "SIMULATION_END", description: "100% of affected population (600/600) reached designated shelters.", severity: "success" }
  ],
  step_snapshots: [
    { step: 2, simulated_time_min: 1.0, evacuated_count: 0, moving_count: 600, waiting_count: 0, unreachable_count: 0, evacuation_pct: 0.0, avg_speed_kmh: 48.0, road_congestion: { "R-8": 96, "R-2": 65 }, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 0, "demo-greenfield-flood-baseline-S2": 0, "demo-greenfield-flood-baseline-S3": 0, "demo-greenfield-flood-baseline-S4": 0 }, active_bottlenecks: ["R-8", "R-2"], sample_agents: [] },
    { step: 4, simulated_time_min: 2.0, evacuated_count: 19, moving_count: 581, waiting_count: 0, unreachable_count: 0, evacuation_pct: 3.2, avg_speed_kmh: 46.5, road_congestion: { "R-8": 96, "R-2": 65 }, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 15, "demo-greenfield-flood-baseline-S2": 4, "demo-greenfield-flood-baseline-S3": 0, "demo-greenfield-flood-baseline-S4": 0 }, active_bottlenecks: ["R-8", "R-2"], sample_agents: [] },
    { step: 6, simulated_time_min: 3.0, evacuated_count: 187, moving_count: 413, waiting_count: 0, unreachable_count: 0, evacuation_pct: 31.2, avg_speed_kmh: 44.0, road_congestion: { "R-8": 90, "R-2": 58 }, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 78, "demo-greenfield-flood-baseline-S2": 35, "demo-greenfield-flood-baseline-S3": 28, "demo-greenfield-flood-baseline-S4": 46 }, active_bottlenecks: ["R-8", "R-2"], sample_agents: [] },
    { step: 8, simulated_time_min: 4.0, evacuated_count: 262, moving_count: 338, waiting_count: 0, unreachable_count: 0, evacuation_pct: 43.7, avg_speed_kmh: 42.0, road_congestion: { "R-8": 75, "R-32": 55 }, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 110, "demo-greenfield-flood-baseline-S2": 52, "demo-greenfield-flood-baseline-S3": 44, "demo-greenfield-flood-baseline-S4": 56 }, active_bottlenecks: ["R-8", "R-32"], sample_agents: [] },
    { step: 10, simulated_time_min: 5.0, evacuated_count: 322, moving_count: 278, waiting_count: 0, unreachable_count: 0, evacuation_pct: 53.7, avg_speed_kmh: 40.5, road_congestion: { "R-8": 60, "R-32": 50 }, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 140, "demo-greenfield-flood-baseline-S2": 62, "demo-greenfield-flood-baseline-S3": 54, "demo-greenfield-flood-baseline-S4": 66 }, active_bottlenecks: ["R-8"], sample_agents: [] },
    { step: 12, simulated_time_min: 6.0, evacuated_count: 373, moving_count: 227, waiting_count: 0, unreachable_count: 0, evacuation_pct: 62.2, avg_speed_kmh: 41.0, road_congestion: { "R-8": 45 }, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 165, "demo-greenfield-flood-baseline-S2": 72, "demo-greenfield-flood-baseline-S3": 66, "demo-greenfield-flood-baseline-S4": 70 }, active_bottlenecks: [], sample_agents: [] },
    { step: 16, simulated_time_min: 8.0, evacuated_count: 426, moving_count: 174, waiting_count: 0, unreachable_count: 0, evacuation_pct: 71.0, avg_speed_kmh: 42.5, road_congestion: { "R-8": 30 }, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 195, "demo-greenfield-flood-baseline-S2": 80, "demo-greenfield-flood-baseline-S3": 75, "demo-greenfield-flood-baseline-S4": 76 }, active_bottlenecks: [], sample_agents: [] },
    { step: 20, simulated_time_min: 10.0, evacuated_count: 484, moving_count: 116, waiting_count: 0, unreachable_count: 0, evacuation_pct: 80.7, avg_speed_kmh: 44.0, road_congestion: {}, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 220, "demo-greenfield-flood-baseline-S2": 88, "demo-greenfield-flood-baseline-S3": 86, "demo-greenfield-flood-baseline-S4": 90 }, active_bottlenecks: [], sample_agents: [] },
    { step: 28, simulated_time_min: 14.0, evacuated_count: 555, moving_count: 45, waiting_count: 0, unreachable_count: 0, evacuation_pct: 92.5, avg_speed_kmh: 45.0, road_congestion: {}, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 220, "demo-greenfield-flood-baseline-S2": 94, "demo-greenfield-flood-baseline-S3": 95, "demo-greenfield-flood-baseline-S4": 146 }, active_bottlenecks: [], sample_agents: [] },
    { step: 38, simulated_time_min: 19.0, evacuated_count: 600, moving_count: 0, waiting_count: 0, unreachable_count: 0, evacuation_pct: 100.0, avg_speed_kmh: 46.0, road_congestion: {}, shelter_occupancy: { "demo-greenfield-flood-baseline-S1": 220, "demo-greenfield-flood-baseline-S2": 99, "demo-greenfield-flood-baseline-S3": 101, "demo-greenfield-flood-baseline-S4": 180 }, active_bottlenecks: [], sample_agents: [] }
  ],
  bottlenecks: [
    { road_id: "R-8", road_name: "Old Town Commercial Way", category: "Critical", simulated_load: 96, configured_capacity: 25, congestion_ratio: 3.84, average_delay_seconds: 172.8, first_detected_step: 2, peak_step: 8, affected_agents: 96, suggested_mitigation: "Divert traffic toward Highway 101 Bypass or establish contra-flow lanes." },
    { road_id: "R-2", road_name: "Hillside Boulevard", category: "Critical", simulated_load: 65, configured_capacity: 30, congestion_ratio: 2.15, average_delay_seconds: 96.5, first_detected_step: 2, peak_step: 6, affected_agents: 65, suggested_mitigation: "Stagger evacuation order for North Hillside zone." },
    { road_id: "R-32", road_name: "Outer North Bypass", category: "Critical", simulated_load: 55, configured_capacity: 30, congestion_ratio: 1.82, average_delay_seconds: 78.4, first_detected_step: 4, peak_step: 10, affected_agents: 55, suggested_mitigation: "Direct eastern residential traffic to East Complex." },
    { road_id: "R-10", road_name: "Central River Bridge", category: "High", simulated_load: 36, configured_capacity: 22, congestion_ratio: 1.65, average_delay_seconds: 64.0, first_detected_step: 2, peak_step: 6, affected_agents: 36, suggested_mitigation: "Bridge closed due to flood crest; enforce alternate crossing." }
  ],
  recommendations: [
    {
      title: "Relieve Gridlock on Critical Corridor: Old Town Commercial Way",
      severity: "High",
      problem: "Traffic demand exceeded capacity by 284% on primary evacuation links (Old Town Commercial Way, Hillside Boulevard, Outer North Bypass).",
      evidence: "Peak load reached 96 units vs design capacity of 25 units, introducing simulated travel delays of ~172.8s.",
      suggested_action: "Implement dynamic route diversion towards Highway 101 Bypass or establish one-way contra-flow lanes during initial evacuation hours.",
      expected_impact: "Reduces peak bottleneck delay by an estimated 35-50%."
    },
    {
      title: "Rebalance Asymmetric Shelter Load (North High School Shelter)",
      severity: "Moderate",
      problem: "North High School Shelter reached 100% occupancy, while East Regional Sports Complex remained at only 35%.",
      evidence: "Geographic proximity bias caused excessive convergence on North High School Shelter, leaving East Regional Sports Complex with surplus capacity.",
      suggested_action: "Re-assign residential district routing to direct eastern zones specifically to East Regional Sports Complex via perimeter bypass.",
      expected_impact: "Distributes arrival surges evenly, preventing shelter overcrowding and reducing transit delays."
    },
    {
      title: "Adopt Phased / Staggered Zone Departures",
      severity: "Informational",
      problem: "Simultaneous mass departure caused an acute initial traffic wave within the first 15 minutes.",
      evidence: "Overall network reached max congestion of 3.84 during early simulation steps.",
      suggested_action: "Stagger evacuation order times: issue mandatory departure to high-risk riverfront zones at T+0, and secondary upland zones at T+30 minutes.",
      expected_impact: "Smooths arrival curves and avoids concurrent bridge bottleneck peaks."
    }
  ],
  created_at: new Date().toISOString()
};

export const FALLBACK_ANALYTICS = {
  run_id: "demo-baseline-run",
  scenario_id: "demo-greenfield-flood-baseline",
  scenario_name: "Greenfield City — Flood Evacuation Drill",
  summary_metrics: FALLBACK_LATEST_RUN.summary_metrics,
  progress_curve: [
    { step: 2, time_min: 1.0, evacuated: 0, in_transit: 600, waiting: 0, unreachable: 0, evacuation_pct: 0.0 },
    { step: 4, time_min: 2.0, evacuated: 19, in_transit: 581, waiting: 0, unreachable: 0, evacuation_pct: 3.2 },
    { step: 6, time_min: 3.0, evacuated: 187, in_transit: 413, waiting: 0, unreachable: 0, evacuation_pct: 31.2 },
    { step: 8, time_min: 4.0, evacuated: 262, in_transit: 338, waiting: 0, unreachable: 0, evacuation_pct: 43.7 },
    { step: 10, time_min: 5.0, evacuated: 322, in_transit: 278, waiting: 0, unreachable: 0, evacuation_pct: 53.7 },
    { step: 12, time_min: 6.0, evacuated: 373, in_transit: 227, waiting: 0, unreachable: 0, evacuation_pct: 62.2 },
    { step: 14, time_min: 7.0, evacuated: 387, in_transit: 213, waiting: 0, unreachable: 0, evacuation_pct: 64.5 },
    { step: 16, time_min: 8.0, evacuated: 426, in_transit: 174, waiting: 0, unreachable: 0, evacuation_pct: 71.0 },
    { step: 18, time_min: 9.0, evacuated: 470, in_transit: 130, waiting: 0, unreachable: 0, evacuation_pct: 78.3 },
    { step: 20, time_min: 10.0, evacuated: 484, in_transit: 116, waiting: 0, unreachable: 0, evacuation_pct: 80.7 },
    { step: 24, time_min: 12.0, evacuated: 486, in_transit: 114, waiting: 0, unreachable: 0, evacuation_pct: 81.0 },
    { step: 28, time_min: 14.0, evacuated: 555, in_transit: 45, waiting: 0, unreachable: 0, evacuation_pct: 92.5 },
    { step: 34, time_min: 17.0, evacuated: 575, in_transit: 25, waiting: 0, unreachable: 0, evacuation_pct: 95.8 },
    { step: 38, time_min: 19.0, evacuated: 600, in_transit: 0, waiting: 0, unreachable: 0, evacuation_pct: 100.0 }
  ],
  shelter_comparison: [
    { shelter_id: "demo-greenfield-flood-baseline-S1", name: "North High School Shelter", occupancy: 220, capacity: 220, utilization_pct: 100.0, status: "Full" },
    { shelter_id: "demo-greenfield-flood-baseline-S2", name: "East Regional Sports Complex", occupancy: 99, capacity: 280, utilization_pct: 35.4, status: "Available" },
    { shelter_id: "demo-greenfield-flood-baseline-S3", name: "South Medical Evacuation Base", occupancy: 101, capacity: 150, utilization_pct: 67.3, status: "Available" },
    { shelter_id: "demo-greenfield-flood-baseline-S4", name: "West Valley Community Arena", occupancy: 180, capacity: 180, utilization_pct: 100.0, status: "Full" }
  ],
  bottlenecks: [
    { road_id: "R-8", road_name: "Old Town Commercial Way", category: "Critical", simulated_load: 96, configured_capacity: 25, congestion_ratio: 3.84, average_delay_seconds: 172.8, first_detected_step: 2, peak_step: 8, affected_agents: 96, suggested_mitigation: "Divert traffic toward Highway 101 Bypass or establish contra-flow lanes." },
    { road_id: "R-2", road_name: "Hillside Boulevard", category: "Critical", simulated_load: 65, configured_capacity: 30, congestion_ratio: 2.15, average_delay_seconds: 96.5, first_detected_step: 2, peak_step: 6, affected_agents: 65, suggested_mitigation: "Stagger evacuation order for North Hillside zone." },
    { road_id: "R-32", road_name: "Outer North Bypass", category: "Critical", simulated_load: 55, configured_capacity: 30, congestion_ratio: 1.82, average_delay_seconds: 78.4, first_detected_step: 4, peak_step: 10, affected_agents: 55, suggested_mitigation: "Direct eastern residential traffic to East Complex." },
    { road_id: "R-10", road_name: "Central River Bridge", category: "High", simulated_load: 36, configured_capacity: 22, congestion_ratio: 1.65, average_delay_seconds: 64.0, first_detected_step: 2, peak_step: 6, affected_agents: 36, suggested_mitigation: "Bridge closed due to flood crest; enforce alternate crossing." },
    { road_id: "R-1", road_name: "Riverside Parkway West", category: "High", simulated_load: 37, configured_capacity: 25, congestion_ratio: 1.48, average_delay_seconds: 52.2, first_detected_step: 2, peak_step: 8, affected_agents: 37, suggested_mitigation: "Deploy portable flood barriers along lower embankment." },
    { road_id: "R-11", road_name: "North River Bridge Way", category: "High", simulated_load: 44, configured_capacity: 35, congestion_ratio: 1.25, average_delay_seconds: 38.0, first_detected_step: 4, peak_step: 12, affected_agents: 44, suggested_mitigation: "Optimize signal timing at North Bridge intersection." }
  ],
  travel_time_distribution: [
    { range: "0-10 min", count: 150 },
    { range: "10-20 min", count: 270 },
    { range: "20-30 min", count: 120 },
    { range: "30+ min", count: 60 }
  ],
  recommendations: FALLBACK_LATEST_RUN.recommendations
};
