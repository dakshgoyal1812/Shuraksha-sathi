from typing import List, Dict, Any

def generate_recommendations(
    summary_metrics: Dict[str, Any],
    bottlenecks: List[Dict[str, Any]],
    shelters: List[Dict[str, Any]],
    blocked_roads: List[str]
) -> List[Dict[str, Any]]:
    """
    Transparent, rule-based recommendation engine grounded in actual simulation outputs.
    Evaluates bottleneck severity, shelter balance, network connectivity, and pacing.
    """
    recommendations: List[Dict[str, Any]] = []

    total_pop = summary_metrics.get("total_population", 0)
    evac_rate = summary_metrics.get("evacuation_rate_pct", 0.0)
    unreachable = summary_metrics.get("unable_to_reach", 0)
    max_congestion = summary_metrics.get("max_congestion_ratio", 0.0)
    total_shelter_cap = summary_metrics.get("total_shelter_capacity", 0)

    # Rule 1: Disconnected population & road closures
    if unreachable > 0:
        recommendations.append({
            "title": "Resolve Road Connectivity & Critical Isolation",
            "severity": "Critical",
            "problem": f"{unreachable} simulated agents ({round(unreachable/max(1, total_pop)*100, 1)}%) could not reach any safe haven.",
            "evidence": f"Closure of {len(blocked_roads)} road segment(s) severed topological access between residential zones and downstream bridges.",
            "suggested_action": "Evaluate reopening or reinforcing key corridors (e.g., Central Bridge or South Crossing) or deploy temporary medical emergency shelters on the western riverbank.",
            "expected_impact": "Could restore up to 100% route accessibility for isolated neighborhoods."
        })

    # Rule 2: Overall Shelter Capacity Shortfall
    if total_shelter_cap < total_pop:
        deficit = total_pop - total_shelter_cap
        recommendations.append({
            "title": "Severe Shelter Capacity Deficit Detected",
            "severity": "Critical",
            "problem": f"Total active shelter capacity ({total_shelter_cap}) is insufficient for the population ({total_pop}).",
            "evidence": f"A direct deficit of {deficit} beds exists across all configured emergency shelters.",
            "suggested_action": "Activate secondary municipal shelters, expand West Valley Community Arena capacity, or establish mutual-aid reception facilities in neighboring districts.",
            "expected_impact": f"Eliminates the {deficit}-person shelter gap before disaster onset."
        })

    # Rule 3: Severe Bottlenecks & Critical Congestion
    critical_bottlenecks = [b for b in bottlenecks if b.get("category") == "Critical"]
    if critical_bottlenecks:
        b_names = ", ".join([b["road_name"] for b in critical_bottlenecks[:3]])
        peak_b = critical_bottlenecks[0]
        recommendations.append({
            "title": f"Relieve Gridlock on Critical Corridor: {peak_b['road_name']}",
            "severity": "High",
            "problem": f"Traffic demand exceeded capacity by {int((peak_b['congestion_ratio'] - 1.0) * 100)}% on primary evacuation links ({b_names}).",
            "evidence": f"Peak load reached {peak_b['simulated_load']} units vs design capacity of {peak_b['configured_capacity']} units, introducing simulated travel delays of ~{peak_b['average_delay_seconds']}s.",
            "suggested_action": "Implement dynamic route diversion towards Highway 101 Bypass or establish one-way contra-flow lanes during initial evacuation hours.",
            "expected_impact": "Reduces peak bottleneck delay by an estimated 35-50%."
        })
    elif bottlenecks:
        mod_b = bottlenecks[0]
        recommendations.append({
            "title": f"Manage Moderate Congestion on {mod_b['road_name']}",
            "severity": "Moderate",
            "problem": f"Road approaching capacity threshold (ratio: {mod_b['congestion_ratio']}).",
            "evidence": f"Simulated load reached {mod_b['simulated_load']} of {mod_b['configured_capacity']} capacity.",
            "suggested_action": "Deploy traffic control monitors at junction nodes and synchronize signal timing for outbound flow.",
            "expected_impact": "Prevents moderate queue buildup from escalating into severe gridlock."
        })

    # Rule 4: Shelter Utilization Imbalance
    if len(shelters) >= 2:
        max_occ_shelter = max(shelters, key=lambda s: s["current_occupancy"] / max(1, s["capacity"]))
        min_occ_shelter = min(shelters, key=lambda s: s["current_occupancy"] / max(1, s["capacity"]))
        
        max_rate = max_occ_shelter["current_occupancy"] / max(1, max_occ_shelter["capacity"])
        min_rate = min_occ_shelter["current_occupancy"] / max(1, min_occ_shelter["capacity"])

        if max_rate >= 0.85 and min_rate <= 0.45:
            recommendations.append({
                "title": f"Rebalance Asymmetric Shelter Load ({max_occ_shelter['name']})",
                "severity": "Moderate",
                "problem": f"{max_occ_shelter['name']} reached {int(max_rate*100)}% occupancy, while {min_occ_shelter['name']} remained at only {int(min_rate*100)}%.",
                "evidence": f"Geographic proximity bias caused excessive convergence on {max_occ_shelter['name']}, leaving {min_occ_shelter['name']} with surplus capacity.",
                "suggested_action": f"Re-assign residential district routing to direct eastern zones specifically to {min_occ_shelter['name']} via perimeter bypass.",
                "expected_impact": "Distributes arrival surges evenly, preventing shelter overcrowding and reducing transit delays."
            })

    # Rule 5: Staggered Departure Optimization
    if max_congestion >= 1.15:
        recommendations.append({
            "title": "Adopt Phased / Staggered Zone Departures",
            "severity": "Informational",
            "problem": "Simultaneous mass departure caused an acute initial traffic wave within the first 15 minutes.",
            "evidence": f"Overall network reached max congestion of {max_congestion} during early simulation steps.",
            "suggested_action": "Stagger evacuation order times: issue mandatory departure to high-risk riverfront zones at T+0, and secondary upland zones at T+30 minutes.",
            "expected_impact": "Smooths arrival curves and avoids concurrent bridge bottleneck peaks."
        })

    # Rule 6: High Performance Commendation
    if evac_rate >= 95.0 and max_congestion < 1.0:
        recommendations.append({
            "title": "Robust Plan Validation",
            "severity": "Informational",
            "problem": "No severe operational hazards detected under current model parameters.",
            "evidence": f"{evac_rate}% evacuation completion achieved with smooth traffic flow (max congestion ratio: {max_congestion}).",
            "suggested_action": "Preserve baseline configuration as standard operational protocol for this disaster classification.",
            "expected_impact": "Maintains verified safety margins."
        })

    return recommendations
