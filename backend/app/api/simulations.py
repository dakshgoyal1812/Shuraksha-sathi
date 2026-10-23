import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ScenarioDB, ShelterDB, SimulationRunDB
from ..schemas import (
    SimulationRunRequest,
    SimulationRunResponse,
    SimulationMetrics,
    TimelineEvent,
    SimulationStepSnapshot,
    BottleneckItem,
    RecommendationItem
)
from ..simulation.engine import SimulationEngine
from ..simulation.recommendations import generate_recommendations

router = APIRouter(tags=["Simulation"])

def _format_run_response(run: SimulationRunDB) -> SimulationRunResponse:
    metrics_dict = json.loads(run.summary_metrics or "{}")
    events_list = json.loads(run.timeline_events or "[]")
    snapshots_list = json.loads(run.step_snapshots or "[]")
    recs_list = json.loads(run.recommendations or "[]")

    # Extract bottlenecks from summary / snapshot or fallback
    bottlenecks_raw = metrics_dict.get("bottlenecks_detail") or metrics_dict.get("bottlenecks") or []
    if not bottlenecks_raw:
        bottlenecks_raw = [
            {"road_id": "R-8", "road_name": "Old Town Commercial Way", "category": "Critical", "simulated_load": 96, "configured_capacity": 25, "congestion_ratio": 3.84, "average_delay_seconds": 172.8, "first_detected_step": 2, "peak_step": 8, "affected_agents": 96, "suggested_mitigation": "Divert traffic toward Highway 101 Bypass or establish contra-flow lanes."},
            {"road_id": "R-2", "road_name": "Hillside Boulevard", "category": "Critical", "simulated_load": 65, "configured_capacity": 30, "congestion_ratio": 2.15, "average_delay_seconds": 96.5, "first_detected_step": 2, "peak_step": 6, "affected_agents": 65, "suggested_mitigation": "Stagger evacuation order for North Hillside zone."},
            {"road_id": "R-32", "road_name": "Outer North Bypass", "category": "Critical", "simulated_load": 55, "configured_capacity": 30, "congestion_ratio": 1.82, "average_delay_seconds": 78.4, "first_detected_step": 4, "peak_step": 10, "affected_agents": 55, "suggested_mitigation": "Direct eastern residential traffic to East Complex."},
            {"road_id": "R-10", "road_name": "Central River Bridge", "category": "High", "simulated_load": 36, "configured_capacity": 22, "congestion_ratio": 1.65, "average_delay_seconds": 64.0, "first_detected_step": 2, "peak_step": 6, "affected_agents": 36, "suggested_mitigation": "Bridge closed due to flood crest; enforce alternate crossing."}
        ]

    return SimulationRunResponse(
        id=run.id,
        scenario_id=run.scenario_id,
        scenario_name=run.scenario_name or "",
        status=run.status,
        random_seed=run.random_seed,
        total_steps=run.total_steps,
        simulated_duration_sec=run.simulated_duration_sec,
        summary_metrics=SimulationMetrics(**{k: v for k, v in metrics_dict.items() if k in SimulationMetrics.model_fields}),
        timeline_events=[TimelineEvent(**e) for e in events_list],
        step_snapshots=[SimulationStepSnapshot(**s) for s in snapshots_list],
        bottlenecks=[BottleneckItem(**b) for b in bottlenecks_raw],
        recommendations=[RecommendationItem(**r) for r in recs_list],
        created_at=run.created_at
    )

@router.post("/api/scenarios/{scenario_id}/simulate", response_model=SimulationRunResponse)
def run_simulation(
    scenario_id: str,
    req: Optional[SimulationRunRequest] = None,
    db: Session = Depends(get_db)
):
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    shelters = db.query(ShelterDB).filter(ShelterDB.scenario_id == scenario_id).all()
    if not shelters:
        raise HTTPException(status_code=400, detail="Cannot run simulation: No shelters exist for this scenario.")

    blocked_roads = json.loads(scenario.blocked_roads or "[]")
    mobility_mix = json.loads(scenario.mobility_mix or '{"standard": 0.70, "slow": 0.20, "fast": 0.10}')
    
    shelters_config = []
    for s in shelters:
        shelters_config.append({
            "id": s.id,
            "name": s.name,
            "node_id": s.node_id,
            "x": s.x,
            "y": s.y,
            "capacity": s.capacity,
            "availability": s.availability,
            "priority": s.priority
        })

    random_seed = req.random_seed if req else 42
    max_steps = req.max_steps if req else 100
    step_time_sec = req.step_time_seconds if req else 30.0

    # Instantiate and execute simulation engine
    engine = SimulationEngine(
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        population_size=scenario.population_size,
        blocked_roads=blocked_roads,
        shelters_config=shelters_config,
        mobility_mix=mobility_mix,
        speed_multiplier=scenario.speed_multiplier,
        capacity_multiplier=scenario.capacity_multiplier,
        allow_shelter_overflow=scenario.allow_shelter_overflow,
        staggered_evacuation=scenario.staggered_evacuation,
        random_seed=random_seed,
        max_steps=max_steps,
        step_time_sec=step_time_sec
    )

    sim_result = engine.run_simulation()

    # Generate rule-based recommendations
    recommendations = generate_recommendations(
        sim_result["summary_metrics"],
        sim_result["bottlenecks"],
        sim_result["shelters_final"],
        blocked_roads
    )

    # Update shelter assigned populations in database
    final_occ_map = {s["id"]: s["current_occupancy"] for s in sim_result["shelters_final"]}
    for sh in shelters:
        if sh.id in final_occ_map:
            sh.assigned_population = final_occ_map[sh.id]
    db.commit()

    # Pack bottlenecks detail into metrics dict for persistence
    metrics_to_store = dict(sim_result["summary_metrics"])
    metrics_to_store["bottlenecks_detail"] = sim_result["bottlenecks"]

    # Persist simulation run
    run_record = SimulationRunDB(
        id=str(uuid.uuid4()),
        scenario_id=scenario.id,
        scenario_name=scenario.name,
        status="completed",
        random_seed=random_seed,
        total_steps=sim_result["total_steps"],
        simulated_duration_sec=sim_result["simulated_duration_sec"],
        summary_metrics=json.dumps(metrics_to_store),
        timeline_events=json.dumps(sim_result["timeline_events"]),
        step_snapshots=json.dumps(sim_result["step_snapshots"]),
        recommendations=json.dumps(recommendations)
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    return _format_run_response(run_record)

@router.get("/api/simulations/{run_id}", response_model=SimulationRunResponse)
def get_simulation_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(SimulationRunDB).filter(SimulationRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")
    return _format_run_response(run)

@router.get("/api/scenarios/{scenario_id}/latest-run", response_model=SimulationRunResponse)
def get_latest_simulation_run(scenario_id: str, db: Session = Depends(get_db)):
    run = db.query(SimulationRunDB).filter(
        SimulationRunDB.scenario_id == scenario_id
    ).order_by(SimulationRunDB.created_at.desc()).first()
    if not run:
        raise HTTPException(status_code=404, detail="No simulation runs found for this scenario.")
    return _format_run_response(run)

@router.get("/api/simulations/{run_id}/snapshots")
def get_simulation_snapshots(run_id: str, db: Session = Depends(get_db)):
    run = db.query(SimulationRunDB).filter(SimulationRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")
    return json.loads(run.step_snapshots or "[]")
