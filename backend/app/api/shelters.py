import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ShelterDB, ScenarioDB
from ..schemas import ShelterCreate, ShelterUpdate, ShelterResponse

router = APIRouter(tags=["Shelters"])

def _format_shelter(sh: ShelterDB) -> ShelterResponse:
    rem = max(0, sh.capacity - sh.assigned_population)
    util = round((sh.assigned_population / max(1, sh.capacity)) * 100.0, 1)
    return ShelterResponse(
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
    )

@router.get("/api/scenarios/{scenario_id}/shelters", response_model=List[ShelterResponse])
def get_scenario_shelters(scenario_id: str, db: Session = Depends(get_db)):
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")
    return [_format_shelter(sh) for sh in scenario.shelters]

@router.post("/api/scenarios/{scenario_id}/shelters", response_model=ShelterResponse, status_code=status.HTTP_201_CREATED)
def create_scenario_shelter(scenario_id: str, data: ShelterCreate, db: Session = Depends(get_db)):
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    if data.capacity <= 0:
        raise HTTPException(status_code=400, detail="Shelter capacity must be greater than zero.")

    shelter = ShelterDB(
        id=str(uuid.uuid4()),
        scenario_id=scenario_id,
        name=data.name,
        node_id=data.node_id,
        x=data.x,
        y=data.y,
        capacity=data.capacity,
        assigned_population=0,
        availability=data.availability,
        priority=data.priority,
        notes=data.notes or ""
    )
    db.add(shelter)
    db.commit()
    db.refresh(shelter)
    return _format_shelter(shelter)

@router.put("/api/shelters/{shelter_id}", response_model=ShelterResponse)
def update_shelter(shelter_id: str, data: ShelterUpdate, db: Session = Depends(get_db)):
    shelter = db.query(ShelterDB).filter(ShelterDB.id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found.")

    if data.name is not None:
        shelter.name = data.name
    if data.node_id is not None:
        shelter.node_id = data.node_id
    if data.x is not None:
        shelter.x = data.x
    if data.y is not None:
        shelter.y = data.y
    if data.capacity is not None:
        if data.capacity <= 0:
            raise HTTPException(status_code=400, detail="Shelter capacity must be greater than zero.")
        shelter.capacity = data.capacity
    if data.assigned_population is not None:
        shelter.assigned_population = data.assigned_population
    if data.availability is not None:
        shelter.availability = data.availability
    if data.priority is not None:
        shelter.priority = data.priority
    if data.notes is not None:
        shelter.notes = data.notes

    db.commit()
    db.refresh(shelter)
    return _format_shelter(shelter)

@router.delete("/api/shelters/{shelter_id}")
def delete_shelter(shelter_id: str, db: Session = Depends(get_db)):
    shelter = db.query(ShelterDB).filter(ShelterDB.id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found.")

    # Check minimum shelters constraint
    scenario_shelters_count = db.query(ShelterDB).filter(ShelterDB.scenario_id == shelter.scenario_id).count()
    if scenario_shelters_count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last remaining shelter. At least one shelter is required.")

    db.delete(shelter)
    db.commit()
    return {"message": "Shelter deleted successfully", "id": shelter_id}
