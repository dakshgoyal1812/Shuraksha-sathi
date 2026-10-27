import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ScenarioDB, ShelterDB, SimulationRunDB
from ..schemas import (
    ScenarioCreate,
    ScenarioUpdate,
    ScenarioResponse,
    ScenarioListItem,
    ShelterResponse
)
from ..simulation.graph_network import DEFAULT_SHELTERS_DATA, DEFAULT_FLOOD_HAZARD_ZONE
from ..seed_data import seed_database

router = APIRouter(prefix="/api/scenarios", tags=["Scenarios"])

def _format_scenario_response(s: ScenarioDB) -> ScenarioResponse:
    shelters_resp = []
    for sh in s.shelters:
        rem = max(0, sh.capacity - sh.assigned_population)
        util = round((sh.assigned_population / max(1, sh.capacity)) * 100.0, 1)
        shelters_resp.append(ShelterResponse(
            id=sh.id,
            scenario_id=sh.scenario_id,
            name=sh.name,
            node_id=sh.node_id,
            x=sh.x,
            y=sh.y,
            capacity=sh.capacity,
            assigned_population=sh.assigned_population,
            availability=sh.availability,
            priority=sh.priority,
            notes=sh.notes or "",
            remaining_capacity=rem,
            utilization_pct=util
        ))

    return ScenarioResponse(
        id=s.id,
        name=s.name,
        description=s.description or "",
        town_name=s.town_name,
        disaster_type=s.disaster_type,
        severity=s.severity,
        population_size=s.population_size,
        hazard_zone=json.loads(s.hazard_zone or "{}"),
        blocked_roads=json.loads(s.blocked_roads or "[]"),
        population_distribution=json.loads(s.population_distribution or "{}"),
        mobility_mix=json.loads(s.mobility_mix or "{}"),
        speed_multiplier=s.speed_multiplier,
        capacity_multiplier=s.capacity_multiplier,
        staggered_evacuation=s.staggered_evacuation,
        allow_shelter_overflow=s.allow_shelter_overflow,
        notes=s.notes or "",
        shelters=shelters_resp,
        created_at=s.created_at,
        updated_at=s.updated_at
    )

@router.get("", response_model=List[ScenarioListItem])
def list_scenarios(db: Session = Depends(get_db)):
    scenarios = db.query(ScenarioDB).order_by(ScenarioDB.created_at.desc()).all()
    result = []
    for s in scenarios:
        latest_run = db.query(SimulationRunDB).filter(
            SimulationRunDB.scenario_id == s.id
        ).order_by(SimulationRunDB.created_at.desc()).first()

        rate = None
        run_id = None
        if latest_run and latest_run.summary_metrics:
            try:
                metrics = json.loads(latest_run.summary_metrics)
                rate = metrics.get("evacuation_rate_pct")
                run_id = latest_run.id
            except Exception:
                pass

        result.append(ScenarioListItem(
            id=s.id,
            name=s.name,
            description=s.description or "",
            town_name=s.town_name,
            disaster_type=s.disaster_type,
            severity=s.severity,
            population_size=s.population_size,
            shelter_count=len(s.shelters),
            created_at=s.created_at,
            latest_run_id=run_id,
            latest_evacuation_rate=rate
        ))
    return result

@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
def create_scenario(data: ScenarioCreate, db: Session = Depends(get_db)):
    if data.population_size <= 0:
        raise HTTPException(status_code=400, detail="Population size must be greater than zero.")

    scenario_id = str(uuid.uuid4())
    scenario = ScenarioDB(
        id=scenario_id,
        name=data.name,
        description=data.description or "",
        town_name=data.town_name,
        disaster_type=data.disaster_type,
        severity=data.severity,
        population_size=data.population_size,
        hazard_zone=json.dumps(data.hazard_zone or DEFAULT_FLOOD_HAZARD_ZONE),
        blocked_roads=json.dumps(data.blocked_roads or []),
        population_distribution=json.dumps(data.population_distribution or {}),
        mobility_mix=json.dumps(data.mobility_mix or {"standard": 0.70, "slow": 0.20, "fast": 0.10}),
        speed_multiplier=data.speed_multiplier,
        capacity_multiplier=data.capacity_multiplier,
        staggered_evacuation=data.staggered_evacuation,
        allow_shelter_overflow=data.allow_shelter_overflow,
        notes=data.notes or ""
    )
    db.add(scenario)
    db.commit()

    # Add shelters if provided, otherwise populate default Greenfield shelters
    shelter_configs = data.shelters if data.shelters else DEFAULT_SHELTERS_DATA
    for s in shelter_configs:
        s_dict = s.dict() if hasattr(s, "dict") else s
        shelter_obj = ShelterDB(
            id=str(uuid.uuid4()),
            scenario_id=scenario_id,
            name=s_dict["name"],
            node_id=s_dict["node_id"],
            x=s_dict["x"],
            y=s_dict["y"],
            capacity=s_dict.get("capacity", 200),
            assigned_population=0,
            availability=s_dict.get("availability", True),
            priority=s_dict.get("priority", 1),
            notes=s_dict.get("notes", "")
        )
        db.add(shelter_obj)
    db.commit()
    db.refresh(scenario)

    return _format_scenario_response(scenario)

@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")
    return _format_scenario_response(scenario)

@router.put("/{scenario_id}", response_model=ScenarioResponse)
def update_scenario(scenario_id: str, data: ScenarioUpdate, db: Session = Depends(get_db)):
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    if data.name is not None:
        scenario.name = data.name
    if data.description is not None:
        scenario.description = data.description
    if data.town_name is not None:
        scenario.town_name = data.town_name
    if data.disaster_type is not None:
        scenario.disaster_type = data.disaster_type
    if data.severity is not None:
        scenario.severity = data.severity
    if data.population_size is not None:
        if data.population_size <= 0:
            raise HTTPException(status_code=400, detail="Population size must be greater than zero.")
        scenario.population_size = data.population_size
    if data.hazard_zone is not None:
        scenario.hazard_zone = json.dumps(data.hazard_zone)
    if data.blocked_roads is not None:
        scenario.blocked_roads = json.dumps(data.blocked_roads)
    if data.population_distribution is not None:
        scenario.population_distribution = json.dumps(data.population_distribution)
    if data.mobility_mix is not None:
        scenario.mobility_mix = json.dumps(data.mobility_mix)
    if data.speed_multiplier is not None:
        scenario.speed_multiplier = data.speed_multiplier
    if data.capacity_multiplier is not None:
        scenario.capacity_multiplier = data.capacity_multiplier
    if data.staggered_evacuation is not None:
        scenario.staggered_evacuation = data.staggered_evacuation
    if data.allow_shelter_overflow is not None:
        scenario.allow_shelter_overflow = data.allow_shelter_overflow
    if data.notes is not None:
        scenario.notes = data.notes

    db.commit()
    db.refresh(scenario)
    return _format_scenario_response(scenario)

@router.delete("/{scenario_id}")
def delete_scenario(scenario_id: str, db: Session = Depends(get_db)):
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")
    db.delete(scenario)
    db.commit()
    return {"message": "Scenario deleted successfully", "id": scenario_id}

@router.post("/{scenario_id}/duplicate", response_model=ScenarioResponse)
def duplicate_scenario(scenario_id: str, db: Session = Depends(get_db)):
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    new_id = str(uuid.uuid4())
    new_scenario = ScenarioDB(
        id=new_id,
        name=f"Copy of {scenario.name}",
        description=scenario.description,
        town_name=scenario.town_name,
        disaster_type=scenario.disaster_type,
        severity=scenario.severity,
        population_size=scenario.population_size,
        hazard_zone=scenario.hazard_zone,
        blocked_roads=scenario.blocked_roads,
        population_distribution=scenario.population_distribution,
        mobility_mix=scenario.mobility_mix,
        speed_multiplier=scenario.speed_multiplier,
        capacity_multiplier=scenario.capacity_multiplier,
        staggered_evacuation=scenario.staggered_evacuation,
        allow_shelter_overflow=scenario.allow_shelter_overflow,
        notes=scenario.notes
    )
    db.add(new_scenario)
    db.commit()

    # Clone shelters
    for sh in scenario.shelters:
        new_sh = ShelterDB(
            id=str(uuid.uuid4()),
            scenario_id=new_id,
            name=sh.name,
            node_id=sh.node_id,
            x=sh.x,
            y=sh.y,
            capacity=sh.capacity,
            assigned_population=0,
            availability=sh.availability,
            priority=sh.priority,
            notes=sh.notes
        )
        db.add(new_sh)
    db.commit()
    db.refresh(new_scenario)

    return _format_scenario_response(new_scenario)

@router.post("/reset-demo")
def reset_to_demo_endpoint():
    seed_database(force=True)
    return {"message": "Database successfully reset to official Greenfield City demonstration scenarios."}
