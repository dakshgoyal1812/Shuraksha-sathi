import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["fictional_town"] == "Greenfield City"

def test_get_scenarios():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 1
    assert any("Greenfield City" in s["name"] for s in scenarios)

def test_get_default_map():
    response = client.get("/api/map/default")
    assert response.status_code == 200
    map_data = response.json()
    assert "nodes" in map_data
    assert "edges" in map_data
    assert len(map_data["nodes"]) >= 20

def test_simulation_run_and_report_endpoints():
    # 1. Get first scenario
    scenarios = client.get("/api/scenarios").json()
    scen_id = scenarios[0]["id"]

    # 2. Trigger simulation
    sim_resp = client.post(f"/api/scenarios/{scen_id}/simulate")
    assert sim_resp.status_code == 200
    run_data = sim_resp.json()
    run_id = run_data["id"]
    assert run_data["status"] == "completed"
    assert "summary_metrics" in run_data

    # 3. Test Analytics endpoint
    analytics_resp = client.get(f"/api/simulations/{run_id}/analytics")
    assert analytics_resp.status_code == 200
    analytics_data = analytics_resp.json()
    assert "progress_curve" in analytics_data

    # 4. Test Report JSON endpoint
    report_resp = client.get(f"/api/simulations/{run_id}/report")
    assert report_resp.status_code == 200
    assert "assumptions_and_limitations" in report_resp.json()

    # 5. Test CSV download endpoint
    csv_resp = client.get(f"/api/simulations/{run_id}/report.csv")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "EVACUSAFE SIMULATION REPORT" in csv_resp.text

    # 6. Test PDF download endpoint
    pdf_resp = client.get(f"/api/simulations/{run_id}/report.pdf")
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.headers["content-type"]
    assert len(pdf_resp.content) > 1000
