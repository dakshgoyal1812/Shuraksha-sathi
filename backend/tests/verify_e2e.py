import urllib.request
import json

def verify_all():
    print("--- EVACUSAFE END-TO-END VERIFICATION ---")
    
    # 1. Health
    health = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/api/health").read().decode())
    print("1. Health check:", health)
    assert health["status"] == "healthy"

    # 2. Scenarios
    scenarios = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/api/scenarios").read().decode())
    print(f"2. Scenarios list: {len(scenarios)} scenarios loaded")
    for s in scenarios:
        print(f"   - {s['name']} (Pop: {s['population_size']}, Clearance: {s['latest_evacuation_rate']}%)")
    assert len(scenarios) >= 2

    # 3. Default Map
    map_data = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/api/map/default").read().decode())
    print(f"3. Greenfield City Map: {len(map_data['nodes'])} nodes, {len(map_data['edges'])} edges, {len(map_data['shelters'])} shelters")
    assert len(map_data["nodes"]) == 20

    # 4. Simulation Execution
    scen_id = scenarios[0]["id"]
    req = urllib.request.Request(
        f"http://127.0.0.1:8000/api/scenarios/{scen_id}/simulate",
        data=b"{}",
        headers={"Content-Type": "application/json"}
    )
    sim_res = json.loads(urllib.request.urlopen(req).read().decode())
    metrics = sim_res["summary_metrics"]
    print(f"4. Simulation Run completed in {sim_res['total_steps']} steps! Evacuation Rate: {metrics['evacuation_rate_pct']}%, Bottlenecks: {len(sim_res['bottlenecks'])}")
    assert sim_res["status"] == "completed"

    # 5. Compare Scenarios
    run_ids = [s["latest_run_id"] for s in scenarios if s.get("latest_run_id")]
    comp_req = urllib.request.Request(
        "http://127.0.0.1:8000/api/compare",
        data=json.dumps({"run_ids": run_ids}).encode(),
        headers={"Content-Type": "application/json"}
    )
    comp_res = json.loads(urllib.request.urlopen(comp_req).read().decode())
    print(f"5. Multi-scenario comparison: {len(comp_res['items'])} compared.")
    print(f"   Trade-off: {comp_res['trade_off_analysis'][:110]}...")

    # 6. CSV Report
    csv_res = urllib.request.urlopen(f"http://127.0.0.1:8000/api/simulations/{sim_res['id']}/report.csv")
    csv_bytes = csv_res.read()
    print(f"6. CSV report downloaded: {len(csv_bytes)} bytes, Content-Type: {csv_res.headers['Content-Type']}")
    assert len(csv_bytes) > 100

    # 7. PDF Report
    pdf_res = urllib.request.urlopen(f"http://127.0.0.1:8000/api/simulations/{sim_res['id']}/report.pdf")
    pdf_bytes = pdf_res.read()
    print(f"7. PDF report generated: {len(pdf_bytes)} bytes, Content-Type: {pdf_res.headers['Content-Type']}")
    assert len(pdf_bytes) > 1000

    # 8. AI Narrative Explanation
    ai_req = urllib.request.Request(
        f"http://127.0.0.1:8000/api/simulations/{sim_res['id']}/ai-explain",
        data=b"{}",
        headers={"Content-Type": "application/json"}
    )
    ai_res = json.loads(urllib.request.urlopen(ai_req).read().decode())
    print(f"8. AI Analytical Narrative: {ai_res['executive_summary'][:120]}...")

    print("--- ALL VERIFICATION CHECKS PASSED PERFECTLY! ---")

if __name__ == "__main__":
    verify_all()
