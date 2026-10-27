import math
from typing import Dict, List, Optional, Tuple, Any
import networkx as nx

# Greenfield City Base Coordinates
# Center approx: lat 45.4215, lng -75.6972
LAT_CENTER = 45.4215
LNG_CENTER = -75.6972
SCALE_LAT = 0.00015
SCALE_LNG = 0.00022

DEFAULT_NODES: List[Dict[str, Any]] = [
    # Residential & Neighborhood Nodes
    {"id": "N1", "name": "West Riverside", "type": "residential", "x": 120, "y": 210, "population_weight": 0.16},
    {"id": "N2", "name": "Hillside Estates", "type": "residential", "x": 260, "y": 100, "population_weight": 0.14},
    {"id": "N3", "name": "Oak Valley", "type": "residential", "x": 560, "y": 120, "population_weight": 0.15},
    {"id": "N4", "name": "Sunset Heights", "type": "residential", "x": 100, "y": 380, "population_weight": 0.12},
    {"id": "N5", "name": "Pinehurst District", "type": "residential", "x": 240, "y": 480, "population_weight": 0.13},
    {"id": "N6", "name": "Old River Town", "type": "residential", "x": 350, "y": 280, "population_weight": 0.15},
    {"id": "N7", "name": "South Park District", "type": "residential", "x": 520, "y": 460, "population_weight": 0.15},

    # Intersections & Key Junctions
    {"id": "N8", "name": "West Junction", "type": "intersection", "x": 220, "y": 220, "population_weight": 0.0},
    {"id": "N9", "name": "Downtown Central Plaza", "type": "intersection", "x": 380, "y": 180, "population_weight": 0.0},
    {"id": "N10", "name": "Central River Bridge (South)", "type": "intersection", "x": 420, "y": 290, "population_weight": 0.0},
    {"id": "N11", "name": "North River Bridge", "type": "intersection", "x": 440, "y": 90, "population_weight": 0.0},
    {"id": "N12", "name": "South River Crossing", "type": "intersection", "x": 420, "y": 430, "population_weight": 0.0},
    {"id": "N13", "name": "East Industrial Hub", "type": "intersection", "x": 620, "y": 260, "population_weight": 0.0},
    {"id": "N14", "name": "Metro Transit Junction", "type": "intersection", "x": 480, "y": 220, "population_weight": 0.0},
    {"id": "N15", "name": "Highway 101 Interchange", "type": "intersection", "x": 280, "y": 360, "population_weight": 0.0},
    {"id": "N16", "name": "Valley Bypass Crossing", "type": "intersection", "x": 580, "y": 370, "population_weight": 0.0},

    # Shelters / Safe Havens
    {"id": "N17", "name": "North High School Shelter", "type": "shelter", "x": 480, "y": 40, "population_weight": 0.0, "shelter_id": "S1"},
    {"id": "N18", "name": "East Regional Sports Complex", "type": "shelter", "x": 710, "y": 170, "population_weight": 0.0, "shelter_id": "S2"},
    {"id": "N19", "name": "South Medical Evacuation Base", "type": "shelter", "x": 640, "y": 510, "population_weight": 0.0, "shelter_id": "S3"},
    {"id": "N20", "name": "West Valley Community Arena", "type": "shelter", "x": 60, "y": 480, "population_weight": 0.0, "shelter_id": "S4"},
]

# Calculate Geo lat/lng from (x, y) relative to Greenfield Center
for node in DEFAULT_NODES:
    dx = node["x"] - 400
    dy = node["y"] - 300
    node["lat"] = round(LAT_CENTER - dy * SCALE_LAT, 6)
    node["lng"] = round(LNG_CENTER + dx * SCALE_LNG, 6)

DEFAULT_EDGES: List[Dict[str, Any]] = [
    # Road network connecting neighborhoods, intersections, and shelters
    {"id": "R-1", "name": "Riverside Parkway West", "source": "N1", "target": "N8", "length": 420, "capacity": 25, "speed_kmh": 45, "hazard_exposure": 0.6},
    {"id": "R-2", "name": "Hillside Boulevard", "source": "N2", "target": "N8", "length": 550, "capacity": 30, "speed_kmh": 50, "hazard_exposure": 0.1},
    {"id": "R-3", "name": "North Ridgeline Road", "source": "N2", "target": "N11", "length": 720, "capacity": 28, "speed_kmh": 55, "hazard_exposure": 0.1},
    {"id": "R-4", "name": "Sunset Expressway West", "source": "N4", "target": "N15", "length": 500, "capacity": 35, "speed_kmh": 60, "hazard_exposure": 0.2},
    {"id": "R-5", "name": "Arena Connector", "source": "N4", "target": "N20", "length": 380, "capacity": 30, "speed_kmh": 45, "hazard_exposure": 0.0},
    {"id": "R-6", "name": "Pinehurst Avenue", "source": "N5", "target": "N15", "length": 460, "capacity": 25, "speed_kmh": 45, "hazard_exposure": 0.2},
    {"id": "R-7", "name": "Pinehurst South Link", "source": "N5", "target": "N12", "length": 620, "capacity": 28, "speed_kmh": 50, "hazard_exposure": 0.4},
    {"id": "R-8", "name": "Old Town Commercial Way", "source": "N6", "target": "N8", "length": 580, "capacity": 25, "speed_kmh": 40, "hazard_exposure": 0.7},
    {"id": "R-9", "name": "Downtown Central Link", "source": "N8", "target": "N9", "length": 480, "capacity": 40, "speed_kmh": 50, "hazard_exposure": 0.3},
    {"id": "R-10", "name": "Central River Bridge", "source": "N6", "target": "N10", "length": 340, "capacity": 22, "speed_kmh": 40, "hazard_exposure": 0.85},
    {"id": "R-11", "name": "North River Bridge Way", "source": "N9", "target": "N11", "length": 490, "capacity": 35, "speed_kmh": 55, "hazard_exposure": 0.3},
    {"id": "R-12", "name": "South River Crossing", "source": "N10", "target": "N12", "length": 450, "capacity": 30, "speed_kmh": 45, "hazard_exposure": 0.5},
    {"id": "R-13", "name": "Plaza East Connector", "source": "N9", "target": "N14", "length": 410, "capacity": 45, "speed_kmh": 50, "hazard_exposure": 0.1},
    {"id": "R-14", "name": "Metro Transit Bypass", "source": "N10", "target": "N14", "length": 430, "capacity": 32, "speed_kmh": 50, "hazard_exposure": 0.2},
    {"id": "R-15", "name": "North Shelter Access", "source": "N11", "target": "N17", "length": 320, "capacity": 45, "speed_kmh": 45, "hazard_exposure": 0.0},
    {"id": "R-16", "name": "Oak Valley North Link", "source": "N3", "target": "N11", "length": 510, "capacity": 30, "speed_kmh": 50, "hazard_exposure": 0.05},
    {"id": "R-17", "name": "Oak Boulevard Central", "source": "N3", "target": "N14", "length": 560, "capacity": 35, "speed_kmh": 55, "hazard_exposure": 0.1},
    {"id": "R-18", "name": "Sports Complex Expressway", "source": "N3", "target": "N18", "length": 460, "capacity": 40, "speed_kmh": 60, "hazard_exposure": 0.0},
    {"id": "R-19", "name": "Industrial Avenue East", "source": "N14", "target": "N13", "length": 490, "capacity": 35, "speed_kmh": 50, "hazard_exposure": 0.1},
    {"id": "R-20", "name": "East Complex Access", "source": "N13", "target": "N18", "length": 420, "capacity": 40, "speed_kmh": 55, "hazard_exposure": 0.0},
    {"id": "R-21", "name": "Industrial Valley Corridor", "source": "N13", "target": "N16", "length": 510, "capacity": 30, "speed_kmh": 50, "hazard_exposure": 0.2},
    {"id": "R-22", "name": "South River Parkway", "source": "N12", "target": "N7", "length": 480, "capacity": 32, "speed_kmh": 50, "hazard_exposure": 0.3},
    {"id": "R-23", "name": "Valley South Link", "source": "N16", "target": "N7", "length": 430, "capacity": 30, "speed_kmh": 50, "hazard_exposure": 0.1},
    {"id": "R-24", "name": "Medical Base Access Road", "source": "N7", "target": "N19", "length": 360, "capacity": 40, "speed_kmh": 45, "hazard_exposure": 0.0},
    {"id": "R-25", "name": "East Relief Corridor", "source": "N16", "target": "N19", "length": 530, "capacity": 35, "speed_kmh": 55, "hazard_exposure": 0.0},
    {"id": "R-26", "name": "Highway 101 Southbound", "source": "N15", "target": "N5", "length": 410, "capacity": 40, "speed_kmh": 65, "hazard_exposure": 0.1},
    {"id": "R-27", "name": "Highway 101 Mid-Section", "source": "N8", "target": "N15", "length": 520, "capacity": 45, "speed_kmh": 65, "hazard_exposure": 0.2},
    {"id": "R-28", "name": "South Crossing Bridge Link", "source": "N15", "target": "N10", "length": 620, "capacity": 30, "speed_kmh": 50, "hazard_exposure": 0.4},
    {"id": "R-29", "name": "West Arena Perimeter", "source": "N1", "target": "N4", "length": 540, "capacity": 25, "speed_kmh": 45, "hazard_exposure": 0.3},
    {"id": "R-30", "name": "Arena North Link", "source": "N20", "target": "N1", "length": 680, "capacity": 25, "speed_kmh": 45, "hazard_exposure": 0.2},
    {"id": "R-31", "name": "Metro South Expressway", "source": "N14", "target": "N16", "length": 580, "capacity": 40, "speed_kmh": 60, "hazard_exposure": 0.15},
    {"id": "R-32", "name": "Outer North Bypass", "source": "N2", "target": "N17", "length": 690, "capacity": 30, "speed_kmh": 50, "hazard_exposure": 0.0},
]

DEFAULT_SHELTERS_DATA: List[Dict[str, Any]] = [
    {
        "id": "S1",
        "name": "North High School Shelter",
        "node_id": "N17",
        "x": 480,
        "y": 40,
        "capacity": 220,
        "priority": 1,
        "availability": True,
        "notes": "Equipped with backup power, gymnasium staging, and food supplies."
    },
    {
        "id": "S2",
        "name": "East Regional Sports Complex",
        "node_id": "N18",
        "x": 710,
        "y": 170,
        "capacity": 280,
        "priority": 1,
        "availability": True,
        "notes": "Large multi-hall facility with ample staging space and direct highway access."
    },
    {
        "id": "S3",
        "name": "South Medical Evacuation Base",
        "node_id": "N19",
        "x": 640,
        "y": 510,
        "capacity": 150,
        "priority": 2,
        "availability": True,
        "notes": "Medical triage facility prioritized for mobility-limited and elderly populations."
    },
    {
        "id": "S4",
        "name": "West Valley Community Arena",
        "node_id": "N20",
        "x": 60,
        "y": 480,
        "capacity": 180,
        "priority": 2,
        "availability": True,
        "notes": "Western sector primary refuge center with emergency water reserves."
    }
]

# Flood Hazard Zone Polygon (encompassing River lowlands and Central Bridge)
DEFAULT_FLOOD_HAZARD_ZONE = {
    "name": "Greenfield River Inundation Zone",
    "polygon": [
        [310, 240],
        [460, 240],
        [470, 340],
        [370, 360],
        [300, 310]
    ],
    "risk_factor": 1.8,
    "description": "High water levels affecting Old River Town and Central River Bridge approach."
}

def get_default_graph_data() -> Dict[str, Any]:
    """Returns the full Greenfield City graph representation."""
    return {
        "town_name": "Greenfield City",
        "center": {"lat": LAT_CENTER, "lng": LNG_CENTER},
        "bounds": {
            "min_x": 40, "max_x": 740,
            "min_y": 20, "max_y": 550
        },
        "nodes": DEFAULT_NODES,
        "edges": DEFAULT_EDGES,
        "shelters": DEFAULT_SHELTERS_DATA,
        "default_hazard_zone": DEFAULT_FLOOD_HAZARD_ZONE
    }

def build_networkx_graph(
    blocked_edges: Optional[List[str]] = None,
    speed_multiplier: float = 1.0,
    capacity_multiplier: float = 1.0,
    current_edge_loads: Optional[Dict[str, int]] = None,
    hazard_multiplier: float = 1.0
) -> nx.DiGraph:
    """
    Builds a directed NetworkX graph representing Greenfield City road network.
    Includes dynamic travel cost calculations based on length, speed, capacity,
    hazard exposure, and active traffic load.
    """
    blocked_set = set(blocked_edges or [])
    G = nx.DiGraph()

    for node in DEFAULT_NODES:
        G.add_node(
            node["id"],
            name=node["name"],
            type=node["type"],
            x=node["x"],
            y=node["y"],
            lat=node["lat"],
            lng=node["lng"]
        )

    for edge in DEFAULT_EDGES:
        edge_id = edge["id"]
        if edge_id in blocked_set:
            continue  # Blocked road is completely omitted from the drivable graph

        u = edge["source"]
        v = edge["target"]
        length = float(edge["length"])
        base_speed = float(edge["speed_kmh"]) * speed_multiplier
        capacity = max(5.0, float(edge["capacity"]) * capacity_multiplier)
        hazard = float(edge.get("hazard_exposure", 0.0)) * hazard_multiplier

        # Current traffic load
        load = float(current_edge_loads.get(edge_id, 0)) if current_edge_loads else 0.0
        congestion_ratio = load / capacity

        # Cost function: Travel Time + Congestion Penalty + Hazard Penalty
        # Base time in seconds: length (m) / (speed (km/h) / 3.6)
        base_travel_time = length / (max(5.0, base_speed) / 3.6)
        congestion_penalty = base_travel_time * (2.2 * (congestion_ratio ** 2))
        hazard_penalty = base_travel_time * (hazard * 1.5)
        
        cost = base_travel_time + congestion_penalty + hazard_penalty

        # Bidirectional road
        G.add_edge(u, v, id=edge_id, name=edge["name"], weight=cost, length=length,
                   capacity=capacity, base_speed=base_speed, congestion_ratio=congestion_ratio)
        G.add_edge(v, u, id=edge_id, name=edge["name"], weight=cost, length=length,
                   capacity=capacity, base_speed=base_speed, congestion_ratio=congestion_ratio)

    return G

def calculate_shortest_path(
    G: nx.DiGraph,
    start_node: str,
    target_node: str
) -> Optional[Tuple[List[str], float]]:
    """Finds the shortest path and total travel cost using Dijkstra's algorithm."""
    try:
        path = nx.shortest_path(G, source=start_node, target=target_node, weight="weight")
        cost = nx.shortest_path_length(G, source=start_node, target=target_node, weight="weight")
        return path, cost
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return None
