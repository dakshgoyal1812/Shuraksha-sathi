import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ScenarioDB
from ..simulation.graph_network import get_default_graph_data, DEFAULT_EDGES, DEFAULT_NODES

router = APIRouter(tags=["Map"])

@router.get("/api/map/default")
def get_default_map():
    """Returns the default fictional Greenfield City graph representation."""
    return get_default_graph_data()

@router.get("/api/scenarios/{scenario_id}/map")
def get_scenario_map(scenario_id: str, db: Session = Depends(get_db)):
    """Returns graph data customized with scenario-specific blocked roads and hazard zone."""
    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found.")

    default_data = get_default_graph_data()
    blocked_roads_set = set(json.loads(scenario.blocked_roads or "[]"))
    hazard_zone = json.loads(scenario.hazard_zone or "{}")

    # Annotate edges with blocked status
    edges_annotated = []
    for e in default_data["edges"]:
        e_copy = dict(e)
        e_copy["is_blocked"] = e["id"] in blocked_roads_set
        edges_annotated.append(e_copy)

    # Format shelters from scenario database
    shelters_list = []
    for sh in scenario.shelters:
        shelters_list.append({
            "id": sh.id,
            "name": sh.name,
            "node_id": sh.node_id,
            "x": sh.x,
            "y": sh.y,
            "capacity": sh.capacity,
            "assigned_population": sh.assigned_population,
            "availability": sh.availability,
            "priority": sh.priority,
            "notes": sh.notes or ""
        })

    return {
        "town_name": scenario.town_name,
        "scenario_id": scenario.id,
        "scenario_name": scenario.name,
        "center": default_data["center"],
        "bounds": default_data["bounds"],
        "nodes": default_data["nodes"],
        "edges": edges_annotated,
        "shelters": shelters_list if shelters_list else default_data["shelters"],
        "hazard_zone": hazard_zone if hazard_zone else default_data["default_hazard_zone"],
        "blocked_roads": list(blocked_roads_set)
    }
