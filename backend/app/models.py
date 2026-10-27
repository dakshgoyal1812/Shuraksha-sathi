import json
import uuid
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base

class ScenarioDB(Base):
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    town_name = Column(String, default="Greenfield City")
    disaster_type = Column(String, default="Flood")  # Flood, Fire, Earthquake, Custom
    severity = Column(String, default="High")       # Low, Moderate, High, Critical
    population_size = Column(Integer, default=600)
    
    # JSON serialized fields
    hazard_zone = Column(Text, default="{}")        # JSON string of hazard polygon & parameters
    blocked_roads = Column(Text, default="[]")      # JSON array of blocked road edge IDs
    population_distribution = Column(Text, default="{}") # JSON dict of neighborhood distribution
    mobility_mix = Column(Text, default="{}")       # JSON dict: {standard: 0.7, slow: 0.2, fast: 0.1}
    
    speed_multiplier = Column(Float, default=1.0)
    capacity_multiplier = Column(Float, default=1.0)
    staggered_evacuation = Column(Boolean, default=False)
    allow_shelter_overflow = Column(Boolean, default=False)
    notes = Column(Text, default="")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shelters = relationship("ShelterDB", back_populates="scenario", cascade="all, delete-orphan")
    simulation_runs = relationship("SimulationRunDB", back_populates="scenario", cascade="all, delete-orphan")


class ShelterDB(Base):
    __tablename__ = "shelters"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)
    name = Column(String, nullable=False)
    node_id = Column(String, nullable=False)  # Associated graph node ID (e.g. N17)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    capacity = Column(Integer, default=200)
    assigned_population = Column(Integer, default=0)
    availability = Column(Boolean, default=True)
    priority = Column(Integer, default=1)  # 1 = high priority
    notes = Column(String, default="")

    scenario = relationship("ScenarioDB", back_populates="shelters")


class SimulationRunDB(Base):
    __tablename__ = "simulation_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=False)
    scenario_name = Column(String, default="")
    status = Column(String, default="completed")  # completed, running, failed
    random_seed = Column(Integer, default=42)
    total_steps = Column(Integer, default=0)
    simulated_duration_sec = Column(Float, default=0.0)
    
    # Stored results
    summary_metrics = Column(Text, default="{}")  # JSON dict with total, evacuated, rate, bottlenecks, etc.
    timeline_events = Column(Text, default="[]")  # JSON list of event objects
    step_snapshots = Column(Text, default="[]")   # JSON list of snapshots for chart/animation replay
    recommendations = Column(Text, default="[]")  # JSON list of rule-based recommendation objects
    
    created_at = Column(DateTime, default=datetime.utcnow)

    scenario = relationship("ScenarioDB", back_populates="simulation_runs")
