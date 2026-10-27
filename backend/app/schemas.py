from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class HazardZoneModel(BaseModel):
    name: str = "Disaster Impact Area"
    polygon: List[List[float]] = []
    risk_factor: float = 1.0
    description: str = ""

class ShelterBase(BaseModel):
    name: str
    node_id: str
    x: float
    y: float
    capacity: int = Field(default=200, ge=1)
    assigned_population: int = 0
    availability: bool = True
    priority: int = 1
    notes: Optional[str] = ""

class ShelterCreate(ShelterBase):
    scenario_id: Optional[str] = None

class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    node_id: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    assigned_population: Optional[int] = None
    availability: Optional[bool] = None
    priority: Optional[int] = None
    notes: Optional[str] = None

class ShelterResponse(ShelterBase):
    id: str
    scenario_id: str
    remaining_capacity: int = 0
    utilization_pct: float = 0.0

    model_config = ConfigDict(from_attributes=True)

class ScenarioBase(BaseModel):
    name: str
    description: Optional[str] = ""
    town_name: str = "Greenfield City"
    disaster_type: str = "Flood"
    severity: str = "High"
    population_size: int = Field(default=600, ge=1, le=50000)
    hazard_zone: Optional[Dict[str, Any]] = {}
    blocked_roads: Optional[List[str]] = []
    population_distribution: Optional[Dict[str, float]] = {}
    mobility_mix: Optional[Dict[str, float]] = {"standard": 0.70, "slow": 0.20, "fast": 0.10}
    speed_multiplier: float = Field(default=1.0, ge=0.1, le=5.0)
    capacity_multiplier: float = Field(default=1.0, ge=0.1, le=5.0)
    staggered_evacuation: bool = False
    allow_shelter_overflow: bool = False
    notes: Optional[str] = ""

class ScenarioCreate(ScenarioBase):
    shelters: Optional[List[ShelterCreate]] = []

class ScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    town_name: Optional[str] = None
    disaster_type: Optional[str] = None
    severity: Optional[str] = None
    population_size: Optional[int] = Field(default=None, ge=1, le=50000)
    hazard_zone: Optional[Dict[str, Any]] = None
    blocked_roads: Optional[List[str]] = None
    population_distribution: Optional[Dict[str, float]] = None
    mobility_mix: Optional[Dict[str, float]] = None
    speed_multiplier: Optional[float] = None
    capacity_multiplier: Optional[float] = None
    staggered_evacuation: Optional[bool] = None
    allow_shelter_overflow: Optional[bool] = None
    notes: Optional[str] = None

class ScenarioResponse(ScenarioBase):
    id: str
    shelters: List[ShelterResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ScenarioListItem(BaseModel):
    id: str
    name: str
    description: str
    town_name: str
    disaster_type: str
    severity: str
    population_size: int
    shelter_count: int
    created_at: datetime
    latest_run_id: Optional[str] = None
    latest_evacuation_rate: Optional[float] = None

class SimulationRunRequest(BaseModel):
    scenario_id: Optional[str] = None
    random_seed: int = 42
    max_steps: int = 120
    step_time_seconds: float = 30.0

class BottleneckItem(BaseModel):
    road_id: str
    road_name: str
    category: str  # Normal, Moderate, High, Critical
    simulated_load: int
    configured_capacity: int
    congestion_ratio: float
    average_delay_seconds: float
    first_detected_step: int
    peak_step: int
    affected_agents: int
    suggested_mitigation: str

class RecommendationItem(BaseModel):
    title: str
    severity: str  # Critical, High, Moderate, Informational
    problem: str
    evidence: str
    suggested_action: str
    expected_impact: str

class SimulationMetrics(BaseModel):
    total_population: int
    successfully_evacuated: int
    remaining_population: int
    unable_to_reach: int
    evacuation_rate_pct: float
    total_simulation_time_min: float
    avg_evacuation_time_min: float
    max_congestion_ratio: float
    bottlenecks_detected_count: int
    blocked_roads_count: int
    average_travel_time_min: float
    route_recalculations_count: int
    total_shelter_capacity: int
    total_shelter_utilization_pct: float

class TimelineEvent(BaseModel):
    step: int
    time_min: float
    event_type: str
    description: str
    severity: str  # info, warning, danger, success
    related_id: Optional[str] = None

class AgentSnapshot(BaseModel):
    id: str
    current_node: str
    target_shelter: str
    x: float
    y: float
    status: str  # waiting, moving, rerouting, evacuated, unreachable
    category: str
    edge_u: Optional[str] = None
    edge_v: Optional[str] = None
    edge_progress: Optional[float] = None

class SimulationStepSnapshot(BaseModel):
    step: int
    simulated_time_min: float
    evacuated_count: int
    moving_count: int
    waiting_count: int
    unreachable_count: int
    evacuation_pct: float
    avg_speed_kmh: float
    road_congestion: Dict[str, float]  # road_id -> congestion_ratio
    shelter_occupancy: Dict[str, int]  # shelter_id -> count
    active_bottlenecks: List[str]      # list of road_ids
    sample_agents: List[AgentSnapshot] = []

class SimulationRunResponse(BaseModel):
    id: str
    scenario_id: str
    scenario_name: str
    status: str
    random_seed: int
    total_steps: int
    simulated_duration_sec: float
    summary_metrics: SimulationMetrics
    timeline_events: List[TimelineEvent]
    step_snapshots: List[SimulationStepSnapshot]
    bottlenecks: List[BottleneckItem]
    recommendations: List[RecommendationItem]
    created_at: datetime

class ComparisonRequest(BaseModel):
    run_ids: List[str]

class ComparisonItem(BaseModel):
    run_id: str
    scenario_name: str
    disaster_type: str
    severity: str
    population_size: int
    successfully_evacuated: int
    evacuation_rate_pct: float
    avg_evacuation_time_min: float
    total_simulation_time_min: float
    bottleneck_count: int
    max_congestion_ratio: float
    unreachable_count: int
    shelter_utilization_pct: float
    score: float

class ComparisonResponse(BaseModel):
    items: List[ComparisonItem]
    best_evacuation_rate_run_id: str
    fastest_evacuation_run_id: str
    fewest_bottlenecks_run_id: str
    trade_off_analysis: str
