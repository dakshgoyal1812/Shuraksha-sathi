import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from .database import engine, SessionLocal, Base
from .models import ScenarioDB, ShelterDB, SimulationRunDB
from .simulation.graph_network import (
    DEFAULT_SHELTERS_DATA,
    DEFAULT_FLOOD_HAZARD_ZONE
)
from .simulation.engine import SimulationEngine
from .simulation.recommendations import generate_recommendations

def seed_database(force: bool = False):
    """Initializes tables and seeds default demonstration scenarios."""
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        existing_scenario = db.query(ScenarioDB).filter(
            ScenarioDB.name == "Greenfield City — Flood Evacuation Drill"
        ).first()

        if existing_scenario and not force:
            print("Default demonstration scenario already exists.")
            return

        if force:
            print("Force resetting database to clean demo state...")
            db.query(SimulationRunDB).delete()
            db.query(ShelterDB).delete()
            db.query(ScenarioDB).delete()
            db.commit()

        print("Seeding Greenfield City Demo Scenario...")

        # 1. Primary Demo Scenario: Baseline Flood Evacuation Drill
        scenario_id = "demo-greenfield-flood-baseline"
        baseline_scenario = ScenarioDB(
            id=scenario_id,
            name="Greenfield City — Flood Evacuation Drill",
            description="A hypothetical flood affects the Greenfield River basin. Planners must evacuate the affected population through the available road network while accounting for blocked river crossings and shelter capacity.",
            town_name="Greenfield City",
            disaster_type="Flood",
            severity="High",
            population_size=600,
            hazard_zone=json.dumps(DEFAULT_FLOOD_HAZARD_ZONE),
            blocked_roads=json.dumps(["R-10", "R-1"]),  # Central River Bridge & Riverside West blocked
            population_distribution=json.dumps({
                "N1": 0.16, "N2": 0.14, "N3": 0.15,
                "N4": 0.12, "N5": 0.13, "N6": 0.15, "N7": 0.15
            }),
            mobility_mix=json.dumps({"standard": 0.70, "slow": 0.20, "fast": 0.10}),
            speed_multiplier=1.0,
            capacity_multiplier=1.0,
            staggered_evacuation=False,
            allow_shelter_overflow=False,
            notes="Default baseline drill. Demonstrates bridge choke points and capacity-aware shelter routing."
        )
        db.add(baseline_scenario)
        db.commit()

        # Add Shelters to Baseline
        shelters_config_baseline = []
        for s in DEFAULT_SHELTERS_DATA:
            shelter_record = ShelterDB(
                id=f"{scenario_id}-{s['id']}",
                scenario_id=scenario_id,
                name=s["name"],
                node_id=s["node_id"],
                x=s["x"],
                y=s["y"],
                capacity=s["capacity"],
                availability=s["availability"],
                priority=s["priority"],
                notes=s["notes"]
            )
            db.add(shelter_record)
            shelters_config_baseline.append({
                "id": shelter_record.id,
                "name": s["name"],
                "node_id": s["node_id"],
                "x": s["x"],
                "y": s["y"],
                "capacity": s["capacity"],
                "availability": s["availability"],
                "priority": s["priority"]
            })
        db.commit()

        # Run simulation engine for baseline
        engine_baseline = SimulationEngine(
            scenario_id=scenario_id,
            scenario_name=baseline_scenario.name,
            population_size=600,
            blocked_roads=["R-10", "R-1"],
            shelters_config=shelters_config_baseline,
            speed_multiplier=1.0,
            capacity_multiplier=1.0,
            random_seed=42
        )
        res_baseline = engine_baseline.run_simulation()
        recs_baseline = generate_recommendations(
            res_baseline["summary_metrics"],
            res_baseline["bottlenecks"],
            res_baseline["shelters_final"],
            ["R-10", "R-1"]
        )

        run_record_baseline = SimulationRunDB(
            id=str(uuid.uuid4()),
            scenario_id=scenario_id,
            scenario_name=baseline_scenario.name,
            status="completed",
            random_seed=42,
            total_steps=res_baseline["total_steps"],
            simulated_duration_sec=res_baseline["simulated_duration_sec"],
            summary_metrics=json.dumps({**res_baseline["summary_metrics"], "bottlenecks_detail": res_baseline["bottlenecks"]}),
            timeline_events=json.dumps(res_baseline["timeline_events"]),
            step_snapshots=json.dumps(res_baseline["step_snapshots"]),
            recommendations=json.dumps(recs_baseline)
        )
        db.add(run_record_baseline)
        db.commit()

        # 2. Optimized Scenario for What-If & Strategy Comparison
        opt_scenario_id = "demo-greenfield-flood-optimized"
        optimized_scenario = ScenarioDB(
            id=opt_scenario_id,
            name="Greenfield City — Optimized Route & Staggered Strategy",
            description="Mitigated scenario featuring emergency bypass routing, reopening of western levee road R-1, expanded North Shelter capacity (+60 beds), and staggered evacuation protocols.",
            town_name="Greenfield City",
            disaster_type="Flood",
            severity="High",
            population_size=600,
            hazard_zone=json.dumps(DEFAULT_FLOOD_HAZARD_ZONE),
            blocked_roads=json.dumps(["R-10"]),  # Only Central Bridge blocked, R-1 open
            population_distribution=json.dumps({
                "N1": 0.16, "N2": 0.14, "N3": 0.15,
                "N4": 0.12, "N5": 0.13, "N6": 0.15, "N7": 0.15
            }),
            mobility_mix=json.dumps({"standard": 0.70, "slow": 0.20, "fast": 0.10}),
            speed_multiplier=1.1,
            capacity_multiplier=1.15,
            staggered_evacuation=True,
            allow_shelter_overflow=False,
            notes="Optimized plan with enhanced contra-flow capacity and expanded North High School shelter."
        )
        db.add(optimized_scenario)
        db.commit()

        # Shelters for Optimized (North High School boosted from 220 to 280)
        shelters_config_opt = []
        for s in DEFAULT_SHELTERS_DATA:
            boosted_cap = s["capacity"] + 60 if s["id"] == "S1" else s["capacity"]
            shelter_record = ShelterDB(
                id=f"{opt_scenario_id}-{s['id']}",
                scenario_id=opt_scenario_id,
                name=s["name"],
                node_id=s["node_id"],
                x=s["x"],
                y=s["y"],
                capacity=boosted_cap,
                availability=s["availability"],
                priority=s["priority"],
                notes=s["notes"]
            )
            db.add(shelter_record)
            shelters_config_opt.append({
                "id": shelter_record.id,
                "name": s["name"],
                "node_id": s["node_id"],
                "x": s["x"],
                "y": s["y"],
                "capacity": boosted_cap,
                "availability": s["availability"],
                "priority": s["priority"]
            })
        db.commit()

        # Run simulation for optimized scenario
        engine_opt = SimulationEngine(
            scenario_id=opt_scenario_id,
            scenario_name=optimized_scenario.name,
            population_size=600,
            blocked_roads=["R-10"],
            shelters_config=shelters_config_opt,
            speed_multiplier=1.1,
            capacity_multiplier=1.15,
            random_seed=42
        )
        res_opt = engine_opt.run_simulation()
        recs_opt = generate_recommendations(
            res_opt["summary_metrics"],
            res_opt["bottlenecks"],
            res_opt["shelters_final"],
            ["R-10"]
        )

        run_record_opt = SimulationRunDB(
            id=str(uuid.uuid4()),
            scenario_id=opt_scenario_id,
            scenario_name=optimized_scenario.name,
            status="completed",
            random_seed=42,
            total_steps=res_opt["total_steps"],
            simulated_duration_sec=res_opt["simulated_duration_sec"],
            summary_metrics=json.dumps({**res_opt["summary_metrics"], "bottlenecks_detail": res_opt["bottlenecks"]}),
            timeline_events=json.dumps(res_opt["timeline_events"]),
            step_snapshots=json.dumps(res_opt["step_snapshots"]),
            recommendations=json.dumps(recs_opt)
        )
        db.add(run_record_opt)
        db.commit()

        print("Database successfully seeded with 2 demonstration scenarios and completed simulation runs!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database(force=True)
