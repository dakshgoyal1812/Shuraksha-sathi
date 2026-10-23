export interface HazardZone {
  name: string;
  polygon: number[][];
  risk_factor: number;
  description: string;
}

export interface Shelter {
  id: string;
  scenario_id: string;
  name: string;
  node_id: string;
  x: number;
  y: number;
  capacity: number;
  assigned_population: number;
  availability: boolean;
  priority: number;
  notes?: string;
  remaining_capacity: number;
  utilization_pct: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  town_name: string;
  disaster_type: string;
  severity: string;
  population_size: number;
  hazard_zone?: HazardZone;
  blocked_roads: string[];
  population_distribution?: Record<string, number>;
  mobility_mix?: {
    standard: number;
    slow: number;
    fast: number;
  };
  speed_multiplier: number;
  capacity_multiplier: number;
  staggered_evacuation: boolean;
  allow_shelter_overflow: boolean;
  notes?: string;
  shelters: Shelter[];
  created_at: string;
  updated_at: string;
}

export interface ScenarioListItem {
  id: string;
  name: string;
  description: string;
  town_name: string;
  disaster_type: string;
  severity: string;
  population_size: number;
  shelter_count: number;
  created_at: string;
  latest_run_id?: string;
  latest_evacuation_rate?: number;
}

export interface RoadNode {
  id: string;
  name: string;
  type: 'residential' | 'intersection' | 'shelter';
  x: number;
  y: number;
  lat: number;
  lng: number;
  population_weight?: number;
  shelter_id?: string;
}

export interface RoadEdge {
  id: string;
  name: string;
  source: string;
  target: string;
  length: number;
  capacity: number;
  speed_kmh: number;
  hazard_exposure: number;
  is_blocked?: boolean;
}

export interface MapData {
  town_name: string;
  scenario_id?: string;
  scenario_name?: string;
  center: { lat: number; lng: number };
  bounds: { min_x: number; max_x: number; min_y: number; max_y: number };
  nodes: RoadNode[];
  edges: RoadEdge[];
  shelters: Shelter[];
  hazard_zone: HazardZone;
  blocked_roads?: string[];
}

export interface Bottleneck {
  road_id: string;
  road_name: string;
  category: 'Normal' | 'Moderate' | 'High' | 'Critical';
  simulated_load: number;
  configured_capacity: number;
  congestion_ratio: number;
  average_delay_seconds: number;
  first_detected_step: number;
  peak_step: number;
  affected_agents: number;
  suggested_mitigation: string;
}

export interface Recommendation {
  title: string;
  severity: 'Critical' | 'High' | 'Moderate' | 'Informational';
  problem: string;
  evidence: string;
  suggested_action: string;
  expected_impact: string;
}

export interface TimelineEvent {
  step: number;
  time_min: number;
  event_type: string;
  description: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
  related_id?: string;
}

export interface AgentSnapshot {
  id: string;
  current_node: string;
  target_shelter: string;
  x: number;
  y: number;
  status: 'waiting' | 'moving' | 'rerouting' | 'evacuated' | 'unreachable';
  category: string;
  edge_u?: string;
  edge_v?: string;
  edge_progress?: number;
}

export interface SimulationStepSnapshot {
  step: number;
  simulated_time_min: number;
  evacuated_count: number;
  moving_count: number;
  waiting_count: number;
  unreachable_count: number;
  evacuation_pct: number;
  avg_speed_kmh: number;
  road_congestion: Record<string, number>;
  shelter_occupancy: Record<string, number>;
  active_bottlenecks: string[];
  sample_agents: AgentSnapshot[];
}

export interface SimulationMetrics {
  total_population: number;
  successfully_evacuated: number;
  remaining_population: number;
  unable_to_reach: number;
  evacuation_rate_pct: number;
  total_simulation_time_min: number;
  avg_evacuation_time_min: number;
  max_congestion_ratio: number;
  bottlenecks_detected_count: number;
  blocked_roads_count: number;
  average_travel_time_min: number;
  route_recalculations_count: number;
  total_shelter_capacity: number;
  total_shelter_utilization_pct: number;
}

export interface SimulationRun {
  id: string;
  scenario_id: string;
  scenario_name: string;
  status: string;
  random_seed: number;
  total_steps: number;
  simulated_duration_sec: number;
  summary_metrics: SimulationMetrics;
  timeline_events: TimelineEvent[];
  step_snapshots: SimulationStepSnapshot[];
  bottlenecks: Bottleneck[];
  recommendations: Recommendation[];
  created_at: string;
}

export interface ComparisonItem {
  run_id: string;
  scenario_name: string;
  disaster_type: string;
  severity: string;
  population_size: number;
  successfully_evacuated: number;
  evacuation_rate_pct: number;
  avg_evacuation_time_min: number;
  total_simulation_time_min: number;
  bottleneck_count: number;
  max_congestion_ratio: number;
  unreachable_count: number;
  shelter_utilization_pct: number;
  score: number;
}

export interface ComparisonResponse {
  items: ComparisonItem[];
  best_evacuation_rate_run_id: string;
  fastest_evacuation_run_id: string;
  fewest_bottlenecks_run_id: string;
  trade_off_analysis: string;
}
