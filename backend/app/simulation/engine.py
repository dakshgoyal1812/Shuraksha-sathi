import random
import math
from typing import Dict, List, Any, Optional, Tuple
import networkx as nx

from .graph_network import (
    DEFAULT_NODES,
    DEFAULT_EDGES,
    DEFAULT_SHELTERS_DATA,
    build_networkx_graph,
    calculate_shortest_path
)

class Agent:
    def __init__(
        self,
        agent_id: str,
        start_node: str,
        speed: float = 1.0,
        category: str = "standard"
    ):
        self.id = agent_id
        self.start_node = start_node
        self.current_node = start_node
        self.speed = speed
        self.category = category  # standard, slow, fast
        
        self.target_shelter_id: Optional[str] = None
        self.target_shelter_node: Optional[str] = None
        
        self.path: List[str] = []
        self.edge_index: int = 0
        self.progress_on_edge: float = 0.0
        
        # Status: waiting, moving, rerouting, evacuated, unreachable
        self.status: str = "waiting"
        self.evacuated_at_step: Optional[int] = None
        self.evacuated_at_time_min: Optional[float] = None
        self.unreachable_reason: Optional[str] = None
        self.route_recalculations: int = 0
        self.total_travel_time_sec: float = 0.0
        
        # Coordinates for visualization
        self.x: float = 0.0
        self.y: float = 0.0

class SimulationEngine:
    def __init__(
        self,
        scenario_id: str,
        scenario_name: str,
        population_size: int = 600,
        blocked_roads: Optional[List[str]] = None,
        shelters_config: Optional[List[Dict[str, Any]]] = None,
        mobility_mix: Optional[Dict[str, float]] = None,
        speed_multiplier: float = 1.0,
        capacity_multiplier: float = 1.0,
        allow_shelter_overflow: bool = False,
        staggered_evacuation: bool = False,
        random_seed: int = 42,
        max_steps: int = 100,
        step_time_sec: float = 30.0
    ):
        self.scenario_id = scenario_id
        self.scenario_name = scenario_name
        self.population_size = max(10, min(population_size, 5000))
        self.blocked_roads = blocked_roads or []
        self.shelters_config = shelters_config or DEFAULT_SHELTERS_DATA
        self.mobility_mix = mobility_mix or {"standard": 0.70, "slow": 0.20, "fast": 0.10}
        self.speed_multiplier = speed_multiplier
        self.capacity_multiplier = capacity_multiplier
        self.allow_shelter_overflow = allow_shelter_overflow
        self.staggered_evacuation = staggered_evacuation
        self.random_seed = random_seed
        self.max_steps = max_steps
        self.step_time_sec = step_time_sec

        # RNG for determinism
        self.rng = random.Random(random_seed)

        # Node coordinate lookup
        self.node_lookup = {n["id"]: n for n in DEFAULT_NODES}
        self.edge_lookup = {e["id"]: e for e in DEFAULT_EDGES}
        self.edge_pair_lookup = {}
        for e in DEFAULT_EDGES:
            self.edge_pair_lookup[(e["source"], e["target"])] = e
            self.edge_pair_lookup[(e["target"], e["source"])] = e

        # Shelters state: id -> dict
        self.shelters: Dict[str, Dict[str, Any]] = {}
        for s in self.shelters_config:
            self.shelters[s["id"]] = {
                "id": s["id"],
                "name": s["name"],
                "node_id": s["node_id"],
                "x": s["x"],
                "y": s["y"],
                "capacity": int(s["capacity"]),
                "current_occupancy": 0,
                "availability": s.get("availability", True),
                "priority": s.get("priority", 1)
            }

        self.agents: List[Agent] = []
        self.timeline_events: List[Dict[str, Any]] = []
        self.step_snapshots: List[Dict[str, Any]] = []
        self.bottleneck_tracker: Dict[str, Dict[str, Any]] = {}

    def _log_event(self, step: int, event_type: str, description: str, severity: str = "info", related_id: Optional[str] = None):
        sim_time_min = round((step * self.step_time_sec) / 60.0, 1)
        self.timeline_events.append({
            "step": step,
            "time_min": sim_time_min,
            "event_type": event_type,
            "description": description,
            "severity": severity,
            "related_id": related_id
        })

    def _generate_agents(self):
        """Generates synthetic agents across residential nodes based on population weights."""
        residential_nodes = [n for n in DEFAULT_NODES if n["type"] == "residential"]
        weights = [n.get("population_weight", 1.0) for n in residential_nodes]
        total_weight = sum(weights)
        norm_weights = [w / total_weight for w in weights]

        slow_prob = self.mobility_mix.get("slow", 0.20)
        fast_prob = self.mobility_mix.get("fast", 0.10)

        for i in range(self.population_size):
            agent_id = f"A-{i+1:04d}"
            # Choose starting neighborhood
            start_node = self.rng.choices(residential_nodes, weights=norm_weights, k=1)[0]["id"]
            
            # Category and speed
            roll = self.rng.random()
            if roll < slow_prob:
                category = "slow"
                speed = 0.65 * self.speed_multiplier
            elif roll < (slow_prob + fast_prob):
                category = "fast"
                speed = 1.35 * self.speed_multiplier
            else:
                category = "standard"
                speed = 1.0 * self.speed_multiplier

            agent = Agent(agent_id, start_node, speed, category)
            agent.x = self.node_lookup[start_node]["x"] + self.rng.uniform(-8, 8)
            agent.y = self.node_lookup[start_node]["y"] + self.rng.uniform(-8, 8)
            self.agents.append(agent)

    def _assign_initial_shelters_and_routes(self, graph: nx.DiGraph):
        """
        Capacity-aware shelter assignment using Dijkstra's algorithm.
        Sorts agents and allocates to closest open shelter with capacity.
        """
        open_shelters = [s for s in self.shelters.values() if s["availability"] and s["capacity"] > 0]
        if not open_shelters:
            for agent in self.agents:
                agent.status = "unreachable"
                agent.unreachable_reason = "No open shelters configured or available."
            self._log_event(0, "CRITICAL_ALERT", "No open evacuation shelters available in scenario!", "danger")
            return

        # Precompute shortest paths from each node to each shelter node
        shortest_paths: Dict[Tuple[str, str], Tuple[List[str], float]] = {}
        for node in DEFAULT_NODES:
            nid = node["id"]
            for s in open_shelters:
                res = calculate_shortest_path(graph, nid, s["node_id"])
                if res:
                    shortest_paths[(nid, s["id"])] = res

        # Sort agents to allocate fairly by residential district
        self.rng.shuffle(self.agents)

        # Track provisional quotas
        provisional_counts = {s["id"]: 0 for s in open_shelters}

        for agent in self.agents:
            candidate_shelters = []
            for s in open_shelters:
                key = (agent.start_node, s["id"])
                if key in shortest_paths:
                    path, cost = shortest_paths[key]
                    candidate_shelters.append((cost, s, path))

            if not candidate_shelters:
                agent.status = "unreachable"
                agent.unreachable_reason = "No drivable road path exists from starting zone to any shelter."
                continue

            # Sort by travel cost
            candidate_shelters.sort(key=lambda x: x[0])

            # Find closest shelter with spare capacity
            assigned = False
            for cost, s, path in candidate_shelters:
                if self.allow_shelter_overflow or provisional_counts[s["id"]] < s["capacity"]:
                    provisional_counts[s["id"]] += 1
                    agent.target_shelter_id = s["id"]
                    agent.target_shelter_node = s["node_id"]
                    agent.path = list(path)
                    agent.edge_index = 0
                    agent.progress_on_edge = 0.0
                    agent.status = "moving"
                    assigned = True
                    break

            if not assigned:
                # All reachable shelters exceeded capacity
                best_cost, best_s, best_path = candidate_shelters[0]
                agent.target_shelter_id = best_s["id"]
                agent.target_shelter_node = best_s["node_id"]
                agent.path = list(best_path)
                agent.status = "unreachable"
                agent.unreachable_reason = f"All reachable shelters at 100% capacity (Quota full for {best_s['name']})."

        unreachable_count = sum(1 for a in self.agents if a.status == "unreachable")
        if unreachable_count > 0:
            self._log_event(0, "CAPACITY_WARNING", f"{unreachable_count} agents cannot be assigned shelter due to capacity limits or road closures.", "warning")

    def _reroute_agent(self, agent: Agent, graph: nx.DiGraph, current_loads: Dict[str, int]) -> bool:
        """Dynamically reroutes an agent if their path becomes invalid or their target shelter fills up."""
        agent.route_recalculations += 1
        curr_node = agent.current_node

        open_shelters = [
            s for s in self.shelters.values()
            if s["availability"] and (self.allow_shelter_overflow or s["current_occupancy"] < s["capacity"])
        ]

        if not open_shelters:
            agent.status = "unreachable"
            agent.unreachable_reason = "All open shelters are completely filled to capacity."
            return False

        candidates = []
        for s in open_shelters:
            res = calculate_shortest_path(graph, curr_node, s["node_id"])
            if res:
                path, cost = res
                candidates.append((cost, s, path))

        if not candidates:
            agent.status = "unreachable"
            agent.unreachable_reason = f"No alternative route found from {curr_node} to any shelter."
            return False

        candidates.sort(key=lambda x: x[0])
        best_cost, best_s, best_path = candidates[0]

        agent.target_shelter_id = best_s["id"]
        agent.target_shelter_node = best_s["node_id"]
        agent.path = list(best_path)
        agent.edge_index = 0
        agent.progress_on_edge = 0.0
        agent.status = "moving"
        return True

    def run_simulation(self) -> Dict[str, Any]:
        """Executes the full discrete-time agent simulation."""
        self._generate_agents()

        # Build initial road network graph
        initial_graph = build_networkx_graph(
            blocked_edges=self.blocked_roads,
            speed_multiplier=self.speed_multiplier,
            capacity_multiplier=self.capacity_multiplier
        )

        self._log_event(
            0,
            "SIMULATION_INIT",
            f"EvacuSafe initialized with {self.population_size} virtual agents across Greenfield City. {len(self.blocked_roads)} roads blocked.",
            "info"
        )

        if self.blocked_roads:
            blocked_names = [self.edge_lookup[r]["name"] for r in self.blocked_roads if r in self.edge_lookup]
            self._log_event(0, "ROAD_CLOSURE", f"Roads closed due to hazard: {', '.join(blocked_names)}", "warning")

        # Assign initial shelters
        self._assign_initial_shelters_and_routes(initial_graph)

        # Simulation Loop
        completed_step = self.max_steps
        step_sample_interval = 1 if self.max_steps <= 60 else (2 if self.max_steps <= 120 else 3)

        for step in range(1, self.max_steps + 1):
            sim_time_min = round((step * self.step_time_sec) / 60.0, 1)

            # 1. Count active edge loads
            current_edge_loads: Dict[str, int] = {}
            for agent in self.agents:
                if agent.status in ("moving", "rerouting"):
                    if agent.edge_index < len(agent.path) - 1:
                        u = agent.path[agent.edge_index]
                        v = agent.path[agent.edge_index + 1]
                        edge = self.edge_pair_lookup.get((u, v))
                        if edge:
                            eid = edge["id"]
                            current_edge_loads[eid] = current_edge_loads.get(eid, 0) + 1

            # 2. Update road graph with dynamic congestion costs
            active_graph = build_networkx_graph(
                blocked_edges=self.blocked_roads,
                speed_multiplier=self.speed_multiplier,
                capacity_multiplier=self.capacity_multiplier,
                current_edge_loads=current_edge_loads
            )

            # 3. Evaluate Bottlenecks
            step_active_bottlenecks = []
            for eid, edge in self.edge_lookup.items():
                if eid in self.blocked_roads:
                    continue
                load = current_edge_loads.get(eid, 0)
                cap = max(5.0, edge["capacity"] * self.capacity_multiplier)
                ratio = load / cap

                if ratio >= 0.85:
                    if ratio >= 1.3:
                        category = "Critical"
                    elif ratio >= 1.0:
                        category = "High"
                    else:
                        category = "Moderate"

                    step_active_bottlenecks.append(eid)

                    if eid not in self.bottleneck_tracker:
                        self.bottleneck_tracker[eid] = {
                            "road_id": eid,
                            "road_name": edge["name"],
                            "category": category,
                            "simulated_load": load,
                            "configured_capacity": int(cap),
                            "congestion_ratio": round(ratio, 2),
                            "average_delay_seconds": round(ratio * 45.0, 1),
                            "first_detected_step": step,
                            "peak_step": step,
                            "affected_agents": load,
                            "suggested_mitigation": f"Traffic exceeds capacity ({int(ratio*100)}%). Stagger departure times or divert flow to adjacent relief corridors."
                        }
                        if category in ("High", "Critical"):
                            self._log_event(
                                step,
                                "BOTTLENECK_ALERT",
                                f"{edge['name']} exceeded capacity ({int(ratio*100)}% load: {load}/{int(cap)} units).",
                                "danger" if category == "Critical" else "warning",
                                eid
                            )
                    else:
                        b = self.bottleneck_tracker[eid]
                        if load > b["simulated_load"]:
                            b["simulated_load"] = load
                            b["peak_step"] = step
                            b["congestion_ratio"] = round(ratio, 2)
                            b["category"] = category
                            b["affected_agents"] = max(b["affected_agents"], load)
                            b["average_delay_seconds"] = round(ratio * 45.0, 1)

            # 4. Advance Agents
            all_finished = True
            for agent in self.agents:
                if agent.status not in ("moving", "rerouting"):
                    continue

                all_finished = False
                agent.total_travel_time_sec += self.step_time_sec

                if agent.edge_index >= len(agent.path) - 1:
                    # Agent is at destination
                    shelter = self.shelters.get(agent.target_shelter_id)
                    if shelter:
                        if self.allow_shelter_overflow or shelter["current_occupancy"] < shelter["capacity"]:
                            shelter["current_occupancy"] += 1
                            agent.status = "evacuated"
                            agent.evacuated_at_step = step
                            agent.evacuated_at_time_min = sim_time_min
                            node_info = self.node_lookup.get(shelter["node_id"])
                            if node_info:
                                agent.x = node_info["x"]
                                agent.y = node_info["y"]
                            
                            # Check milestone
                            if shelter["current_occupancy"] == shelter["capacity"]:
                                self._log_event(
                                    step,
                                    "SHELTER_FULL",
                                    f"{shelter['name']} has reached 100% capacity ({shelter['capacity']} persons)!",
                                    "warning",
                                    shelter["id"]
                                )
                        else:
                            # Shelter full, must reroute
                            reroute_ok = self._reroute_agent(agent, active_graph, current_edge_loads)
                            if reroute_ok:
                                self._log_event(
                                    step,
                                    "REROUTING",
                                    f"Agent group rerouting from filled {shelter['name']} to alternate shelter.",
                                    "info"
                                )
                    continue

                # Traverse current edge
                u = agent.path[agent.edge_index]
                v = agent.path[agent.edge_index + 1]
                edge = self.edge_pair_lookup.get((u, v))
                if not edge:
                    agent.edge_index += 1
                    continue

                eid = edge["id"]
                load = current_edge_loads.get(eid, 0)
                cap = max(5.0, edge["capacity"] * self.capacity_multiplier)
                congestion_ratio = load / cap

                # Speed reduction factor due to traffic density
                speed_factor = max(0.18, 1.0 - 0.70 * min(2.0, congestion_ratio))
                effective_speed_mps = (edge["speed_kmh"] / 3.6) * agent.speed * speed_factor

                step_distance = effective_speed_mps * self.step_time_sec
                length = float(edge["length"])
                agent.progress_on_edge += step_distance / length

                # Interpolate agent coordinate
                nu = self.node_lookup[u]
                nv = self.node_lookup[v]
                p = min(1.0, agent.progress_on_edge)
                agent.x = round(nu["x"] + (nv["x"] - nu["x"]) * p, 1)
                agent.y = round(nu["y"] + (nv["y"] - nu["y"]) * p, 1)

                if agent.progress_on_edge >= 1.0:
                    agent.edge_index += 1
                    agent.progress_on_edge = 0.0
                    agent.current_node = v

                    # Check if reached final node
                    if agent.edge_index >= len(agent.path) - 1:
                        shelter = self.shelters.get(agent.target_shelter_id)
                        if shelter:
                            if self.allow_shelter_overflow or shelter["current_occupancy"] < shelter["capacity"]:
                                shelter["current_occupancy"] += 1
                                agent.status = "evacuated"
                                agent.evacuated_at_step = step
                                agent.evacuated_at_time_min = sim_time_min
                                agent.x = self.node_lookup[shelter["node_id"]]["x"]
                                agent.y = self.node_lookup[shelter["node_id"]]["y"]
                            else:
                                self._reroute_agent(agent, active_graph, current_edge_loads)

            # 5. Record Step Snapshot
            if step % step_sample_interval == 0 or all_finished or step == self.max_steps:
                evacuated_count = sum(1 for a in self.agents if a.status == "evacuated")
                moving_count = sum(1 for a in self.agents if a.status in ("moving", "rerouting"))
                waiting_count = sum(1 for a in self.agents if a.status == "waiting")
                unreachable_count = sum(1 for a in self.agents if a.status == "unreachable")

                congestion_map = {}
                for eid, edge in self.edge_lookup.items():
                    ld = current_edge_loads.get(eid, 0)
                    cp = max(5.0, edge["capacity"] * self.capacity_multiplier)
                    congestion_map[eid] = round(ld / cp, 2)

                shelter_occ = {sid: s["current_occupancy"] for sid, s in self.shelters.items()}

                # Subsample of agents for clean map visualization (up to 80 representative agents)
                sample_agents = []
                step_sample_stride = max(1, len(self.agents) // 80)
                for a in self.agents[::step_sample_stride]:
                    u_node = a.path[a.edge_index] if (a.path and a.edge_index < len(a.path)) else a.current_node
                    v_node = a.path[a.edge_index + 1] if (a.path and a.edge_index < len(a.path) - 1) else u_node
                    prog = round(a.progress_on_edge, 3) if a.status in ("moving", "rerouting") else 0.0
                    sample_agents.append({
                        "id": a.id,
                        "current_node": a.current_node,
                        "target_shelter": a.target_shelter_id or "",
                        "x": a.x,
                        "y": a.y,
                        "status": a.status,
                        "category": a.category,
                        "edge_u": u_node,
                        "edge_v": v_node,
                        "edge_progress": prog
                    })

                self.step_snapshots.append({
                    "step": step,
                    "simulated_time_min": sim_time_min,
                    "evacuated_count": evacuated_count,
                    "moving_count": moving_count,
                    "waiting_count": waiting_count,
                    "unreachable_count": unreachable_count,
                    "evacuation_pct": round((evacuated_count / self.population_size) * 100.0, 1),
                    "avg_speed_kmh": round(45.0 * self.speed_multiplier, 1),
                    "road_congestion": congestion_map,
                    "shelter_occupancy": shelter_occ,
                    "active_bottlenecks": step_active_bottlenecks,
                    "sample_agents": sample_agents
                })

            if all_finished:
                completed_step = step
                self._log_event(
                    step,
                    "SIMULATION_COMPLETE",
                    f"All active evacuation operations concluded at T+{sim_time_min} min.",
                    "success"
                )
                break

        # Calculate Final Summary Metrics
        evacuated_total = sum(1 for a in self.agents if a.status == "evacuated")
        unreachable_total = sum(1 for a in self.agents if a.status == "unreachable")
        remaining_total = self.population_size - evacuated_total
        evacuation_rate_pct = round((evacuated_total / self.population_size) * 100.0, 1)

        evacuated_agents = [a for a in self.agents if a.status == "evacuated"]
        if evacuated_agents:
            avg_evac_time_min = round(sum(a.evacuated_at_time_min or 0 for a in evacuated_agents) / len(evacuated_agents), 1)
        else:
            avg_evac_time_min = 0.0

        total_sim_time_min = round((completed_step * self.step_time_sec) / 60.0, 1)
        
        max_congestion = 0.0
        for b in self.bottleneck_tracker.values():
            if b["congestion_ratio"] > max_congestion:
                max_congestion = b["congestion_ratio"]

        total_shelter_cap = sum(s["capacity"] for s in self.shelters.values() if s["availability"])
        total_occupancy = sum(s["current_occupancy"] for s in self.shelters.values())
        shelter_util_pct = round((total_occupancy / max(1, total_shelter_cap)) * 100.0, 1)

        summary_metrics = {
            "total_population": self.population_size,
            "successfully_evacuated": evacuated_total,
            "remaining_population": remaining_total,
            "unable_to_reach": unreachable_total,
            "evacuation_rate_pct": evacuation_rate_pct,
            "total_simulation_time_min": total_sim_time_min,
            "avg_evacuation_time_min": avg_evac_time_min,
            "max_congestion_ratio": round(max_congestion, 2),
            "bottlenecks_detected_count": len(self.bottleneck_tracker),
            "blocked_roads_count": len(self.blocked_roads),
            "average_travel_time_min": avg_evac_time_min,
            "route_recalculations_count": sum(a.route_recalculations for a in self.agents),
            "total_shelter_capacity": total_shelter_cap,
            "total_shelter_utilization_pct": shelter_util_pct
        }

        bottlenecks_list = list(self.bottleneck_tracker.values())
        bottlenecks_list.sort(key=lambda x: x["congestion_ratio"], reverse=True)

        return {
            "scenario_id": self.scenario_id,
            "scenario_name": self.scenario_name,
            "status": "completed",
            "random_seed": self.random_seed,
            "total_steps": completed_step,
            "simulated_duration_sec": completed_step * self.step_time_sec,
            "summary_metrics": summary_metrics,
            "timeline_events": self.timeline_events,
            "step_snapshots": self.step_snapshots,
            "bottlenecks": bottlenecks_list,
            "shelters_final": list(self.shelters.values())
        }
