import pytest
import json
from app.simulation.graph_network import (
    DEFAULT_NODES,
    DEFAULT_EDGES,
    DEFAULT_SHELTERS_DATA,
    build_networkx_graph,
    calculate_shortest_path
)
from app.simulation.engine import SimulationEngine
from app.simulation.recommendations import generate_recommendations

def test_graph_network_creation():
    """Verify that Greenfield City graph has valid nodes, edges, and connectivity."""
    G = build_networkx_graph(blocked_edges=[])
    assert len(G.nodes) == len(DEFAULT_NODES)
    assert len(G.edges) > 30

def test_shortest_path_routing():
    """Verify Dijkstra routing calculates valid paths."""
    G = build_networkx_graph(blocked_edges=[])
    result = calculate_shortest_path(G, "N1", "N17")
    assert result is not None
    path, cost = result
    assert path[0] == "N1"
    assert path[-1] == "N17"
    assert cost > 0

def test_blocked_roads_excluded():
    """Verify blocked roads are strictly omitted from active routes."""
    # When Central Bridge (R-10) is blocked, no path can use R-10
    G_blocked = build_networkx_graph(blocked_edges=["R-10"])
    # Verify R-10 is not in graph
    for u, v, data in G_blocked.edges(data=True):
        assert data.get("id") != "R-10"

def test_simulation_engine_run():
    """Verify simulation engine executes deterministically and outputs valid metrics."""
    engine = SimulationEngine(
        scenario_id="test-scenario",
        scenario_name="Test Drill",
        population_size=100,
        blocked_roads=["R-10"],
        shelters_config=DEFAULT_SHELTERS_DATA,
        random_seed=42,
        max_steps=50
    )
    result = engine.run_simulation()
    assert result["status"] == "completed"
    metrics = result["summary_metrics"]
    assert metrics["total_population"] == 100
    assert metrics["successfully_evacuated"] + metrics["unable_to_reach"] <= 100
    assert metrics["evacuation_rate_pct"] >= 0.0
    assert len(result["step_snapshots"]) > 0
    assert len(result["timeline_events"]) > 0

def test_rule_based_recommendations():
    """Verify rule-based recommendations respond to simulation metrics."""
    mock_metrics = {
        "total_population": 600,
        "successfully_evacuated": 480,
        "unable_to_reach": 120,
        "evacuation_rate_pct": 80.0,
        "max_congestion_ratio": 1.45,
        "total_shelter_capacity": 550
    }
    mock_bottlenecks = [{
        "road_name": "Central River Bridge",
        "category": "Critical",
        "congestion_ratio": 1.45,
        "simulated_load": 45,
        "configured_capacity": 30,
        "average_delay_seconds": 65.0
    }]
    mock_shelters = [
        {"name": "Shelter A", "capacity": 200, "current_occupancy": 195},
        {"name": "Shelter B", "capacity": 200, "current_occupancy": 60}
    ]

    recs = generate_recommendations(mock_metrics, mock_bottlenecks, mock_shelters, ["R-10"])
    assert len(recs) >= 3
    severities = [r["severity"] for r in recs]
    assert "Critical" in severities
    assert "High" in severities
