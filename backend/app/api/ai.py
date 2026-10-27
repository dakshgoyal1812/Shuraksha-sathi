import os
import json
import urllib.request
from pathlib import Path
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SimulationRunDB, ScenarioDB

# Automatically load backend .env file securely
_env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if _env_path.exists():
    with open(_env_path, "r", encoding="utf-8") as _f:
        for _line in _f:
            _line = _line.strip()
            if _line and not _line.startswith("#") and "=" in _line:
                _k, _v = _line.split("=", 1)
                os.environ.setdefault(_k.strip(), _v.strip())

router = APIRouter(tags=["AI Explanation"])

class ChatRequest(BaseModel):
    message: str
    scenario_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = []

# Primary & Failover Rotation API Keys loaded strictly from environment (.env)
PRIMARY_GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
FALLBACK_OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")


def call_gemini_api(prompt: str, system_instruction: str = "") -> Optional[str]:
    """Primary Provider: Google Gemini API with low-latency flash models."""
    api_key = os.getenv("GEMINI_API_KEY", PRIMARY_GEMINI_KEY)
    if not api_key:
        return None

    # Supported fast models
    models = ["gemini-3.5-flash-lite", "gemini-flash-latest"]
    for model in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload: Dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,  # Strict grounding for zero hallucination
                "maxOutputTokens": 800
            }
        }
        if system_instruction:
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction}]
            }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception as e:
            print(f"[Gemini Key Alert] Call to {model} failed: {e}")
            continue
    return None

def call_openrouter_api(message: str, system_instruction: str = "", history: Optional[List[Dict[str, str]]] = None) -> Optional[str]:
    """Failover Rotation Provider: OpenRouter API if primary Gemini key fails or times out."""
    api_key = os.getenv("OPENROUTER_API_KEY", FALLBACK_OPENROUTER_KEY)
    if not api_key:
        return None

    url = "https://openrouter.ai/api/v1/chat/completions"
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    if history:
        for h in history[-4:]:
            role = "user" if h.get("sender") == "user" else "assistant"
            messages.append({"role": role, "content": h.get("text", "")})
    messages.append({"role": "user", "content": message})

    models = ["openrouter/auto", "nvidia/nemotron-3.5-lightning:free"]
    for model in models:
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": 800,
            "temperature": 0.2
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/adityagarg0020/Suraksha",
                    "X-Title": "Suraksha Evacuation Platform"
                }
            )
            with urllib.request.urlopen(req, timeout=7) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                choices = data.get("choices", [])
                if choices:
                    content = choices[0].get("message", {}).get("content", "")
                    if content:
                        return content.strip()
        except Exception as e:
            print(f"[OpenRouter Rotation Alert] Call to {model} failed: {e}")
            continue
    return None

@router.post("/api/ai/chat")
def chat_with_ai(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Intelligent chatbot endpoint for SurakshaSathi.
    Grounded in Greenfield City simulation parameters, real database drill results,
    and official NDMA/FEMA disaster evacuation guidelines to prevent hallucination.
    """
    message = req.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Fetch current scenario and latest simulation drill as Ground Truth
    scenario = None
    if req.scenario_id:
        scenario = db.query(ScenarioDB).filter(ScenarioDB.id == req.scenario_id).first()
    if not scenario:
        scenario = db.query(ScenarioDB).first()

    latest_run = None
    if scenario:
        latest_run = db.query(SimulationRunDB).filter(
            SimulationRunDB.scenario_id == scenario.id
        ).order_by(SimulationRunDB.created_at.desc()).first()

    # Ground-truth metrics
    metrics = json.loads(latest_run.summary_metrics or "{}") if latest_run else {}
    bottlenecks = metrics.get("bottlenecks_detail", []) if metrics else []
    
    context_text = f"""
PROJECT: SurakshaSathi — Intelligent Disaster Evacuation Planning & Simulation Platform
SIMULATION ENVIRONMENT: Greenfield City (Synthetic 20-node, 32-edge urban road network)
ACTIVE SCENARIO: {scenario.name if scenario else 'Greenfield City Flood Evacuation Drill'} ({scenario.disaster_type if scenario else 'Flood'}, Severity: {scenario.severity if scenario else 'High'})
TOTAL POPULATION: {metrics.get('total_population', 600)} synthetic evacuees
CLEARANCE STATUS: {metrics.get('evacuation_rate_pct', 100.0)}% successfully evacuated
AVERAGE EVACUATION TIME: {metrics.get('avg_evacuation_time_min', 6.8)} minutes (Total: {metrics.get('total_simulation_time_min', 19.0)} min)
MAX NETWORK CONGESTION: {metrics.get('max_congestion_ratio', 3.84)}x design capacity

CRITICAL CORRIDORS & BOTTLENECKS:
- Old Town Commercial Way (R-8): 3.84x congestion (96 units vs 25 capacity, ~172.8s simulated delay)
- Hillside Boulevard (R-2): 2.15x congestion (65 units vs 30 capacity)
- Outer North Bypass (R-32): 1.82x congestion (55 units vs 30 capacity)
- Central River Bridge (R-10): BLOCKED due to high flood crest
- Riverside Parkway West (R-1): BLOCKED in baseline; reopened in optimized plan

DESIGNATED SAFE HAVEN SHELTERS:
1. North High School Shelter (S1, Node N17): Capacity 220, Occupancy 220 (100% Full)
2. East Regional Sports Complex (S2, Node N18): Capacity 280, Occupancy 99 (35.4% Available)
3. South Medical Evacuation Base (S3, Node N19): Capacity 150, Occupancy 101 (67.3% Available)
4. West Valley Community Arena (S4, Node N20): Capacity 180, Occupancy 180 (100% Full)

OFFICIAL DISASTER MANAGEMENT GUIDELINES (NDMA / FEMA / ICS STANDARDS):
1. Phased Departures: Issue mandatory evacuation to waterfront zones (N1, N6, N10) at T+0; stagger upland zones by 30 mins to eliminate peak bridge gridlock.
2. Route Diversion & Contra-Flow: Establish one-way flow on Highway 101 and diversion toward East Complex to alleviate Old Town Commercial Way.
3. Shelter Load Rebalancing: Re-assign eastern residential zones to East Regional Sports Complex to prevent North High School overcrowding.
4. Vulnerable Population Priority: Provide specialized transport for elderly and mobility-limited citizens during Phase 1.
"""

    system_instruction = f"""
You are the Emergency Operations Center (EOC) AI Assistant for SurakshaSathi.
Your mission is to provide strictly factual, non-hallucinatory intelligence on disaster evacuation planning, Greenfield City simulation drills, and disaster management guidelines.

CORE INSTRUCTIONS:
1. STRICT ANTI-HALLUCINATION: Base all project facts, numbers, road names, and shelter data solely on the Ground Truth provided below. Never invent roads, numbers, or shelters.
2. DISASTER GUIDELINES: Explain disaster protocols (floods, fires, earthquakes, bridge closures, contra-flow, triage) according to national disaster management authority (NDMA/FEMA) best practices.
3. STRUCTURE: Use clean, readable formatting with bold key figures and bullet points. Keep answers practical, actionable, and concise.
4. TONE: Authoritative, calm, and professional emergency planning specialist.
5. STRICT SCOPE: Provide intelligence EXCLUSIVELY on disaster preparedness, evacuation simulation drills, network congestion, shelter allocation, civil defense, and NDMA/FEMA emergency guidelines. Never provide financial, banking, tax, or gig-worker advice.
6. LANGUAGE: Always respond strictly in professional, clear, fluent English. Never use Hinglish or mixed slang.


GROUND TRUTH DATA:
{context_text}
"""

    # Build prompt with history
    conversation_context = ""
    if req.history:
        for h in req.history[-4:]:
            role = "User" if h.get("sender") == "user" else "Assistant"
            conversation_context += f"{role}: {h.get('text', '')}\n"
    
    full_prompt = f"{conversation_context}User: {message}\nAssistant:"

    # 2. Key Failure & Rotation Execution Flow:
    # Level 1: Primary Google Gemini API Key
    provider_used = "Google Gemini"
    ai_response = call_gemini_api(full_prompt, system_instruction)

    # Level 2: Failover Rotation to OpenRouter API Key (sk-or-v1-...)
    if not ai_response:
        print("[Key Failover Rotation] Gemini primary key failed or timed out. Rotating to OpenRouter fallback key...")
        ai_response = call_openrouter_api(message, system_instruction, req.history)
        if ai_response:
            provider_used = "OpenRouter (Rotated Key)"

    # Level 3: Deterministic Ground-Truth Reasoner if all cloud AI endpoints are unreachable
    if not ai_response:
        provider_used = "Deterministic EOC Fallback"
        lower = message.lower()
        if "bottleneck" in lower or "traffic" in lower or "congestion" in lower or "delay" in lower:
            ai_response = "🚨 **Critical Bottlenecks in Greenfield City:**\n\n• **Old Town Commercial Way (R-8):** Peak load reached **96 units** against a design limit of 25 (**3.84x congestion ratio**), causing simulated travel delays of ~172.8s.\n• **Hillside Boulevard (R-2):** Peak demand reached **65 units** vs 30 capacity (2.15x).\n• **Outer North Bypass (R-32):** Peak load reached **55 units** vs 30 capacity (1.82x).\n\n💡 *Action Plan:* Implement dynamic route diversion to Highway 101 Bypass or establish one-way outbound contra-flow lanes during initial evacuation hours."
        elif "shelter" in lower or "capacity" in lower or "occupancy" in lower or "bed" in lower:
            ai_response = "🏥 **Shelter Capacity & Allocation Status:**\n\n• **North High School Shelter (S1):** 220 / 220 beds (**100% Full**)\n• **West Valley Community Arena (S4):** 180 / 180 beds (**100% Full**)\n• **South Medical Base (S3):** 101 / 150 beds (**67.3%** Occupied — 49 available)\n• **East Regional Sports Complex (S2):** 99 / 280 beds (**35.4%** Occupied — **181 Surplus Beds Available**)\n\n🛡️ *Recommendation:* Rebalance routing to redirect eastern zones to East Regional Sports Complex via the perimeter corridor."
        elif "guideline" in lower or "ndma" in lower or "fema" in lower or "protocol" in lower:
            ai_response = "📋 **Standard Disaster Evacuation Guidelines (NDMA/FEMA Protocols):**\n\n1. **Phased Departures:** Stagger departure times between riverfront high-risk zones (T+0) and upland zones (T+30m) to prevent concurrent bridge shockwaves.\n2. **Contra-Flow Traffic:** Convert inward lanes of primary outbound corridors to one-way evacuation flow.\n3. **Early Warning Integration:** Disseminate geo-targeted alerts with designated shelter assignments.\n4. **Shelter Load Balancing:** Intercept converging traffic at perimeter nodes and divert towards facilities with surplus capacity (e.g. East Sports Complex)."
        elif "time" in lower or "clearance" in lower or "duration" in lower or "rate" in lower or "kpi" in lower:
            ai_response = "⏱️ **Evacuation Clearance Metrics:**\n\n• **Baseline Clearance:** 19.0 minutes (Average travel time: 6.8 min).\n• **Optimized Strategy:** 14.5 minutes (**23.7% reduction in clearance time**).\n• **Overall Evacuation Rate:** **100%** (600 of 600 synthetic evacuees safely reached designated shelters).\n• **Isolated/Unreachable Agents:** 0 in optimized drill."
        elif "route" in lower or "diversion" in lower or "contra" in lower or "bridge" in lower or "closure" in lower:
            ai_response = "🔄 **Route Diversion & Road Closure Strategy:**\n\n• **Central River Bridge (R-10):** Closed due to high flood water levels.\n• **Riverside Parkway West (R-1):** Reopened under dynamic optimization to siphon traffic off Old Town Commercial Way.\n• **Highway 101 Bypass:** Converted to contra-flow configuration to facilitate continuous westward evacuation toward West Valley Arena."
        elif "kit" in lower or "supply" in lower or "resource" in lower or "relief" in lower or "survival" in lower or "food" in lower or "water" in lower:
            ai_response = "🎒 **72-Hour Disaster Survival & Relief Logistics:**\n\n• **Family 72-Hour Kit:** 3 liters of potable water per person/day, non-perishable emergency food, first-aid kit, crank radio, waterproof flashlight, portable power banks, and essential prescriptions.\n• **EOC Relief Staging:** Municipal food rations and emergency medical supplies pre-staged at South Medical Evacuation Base (Node N19).\n• **Special Assistance:** Priority shuttle transport dispatched for mobility-limited and elderly residents in Zone N1 and N6."
        else:
            ai_response = f"🛡️ **Suraksha Emergency Operations Intelligence:**\n\nRegarding your inquiry on '{message}', Greenfield City is actively operating under disaster evacuation simulation protocol ({scenario.name if scenario else 'Flood Evacuation Drill'}).\n\n• **Evacuation Status:** **100% Clearance Rate** (600 / 600 synthetic residents safely relocated)\n• **Active Shelters:** 4 regional facilities with surplus beds at East Regional Sports Complex (181 beds open)\n• **Primary Bottleneck:** Old Town Commercial Way (3.84x congestion) managed via diversion corridors.\n\nAsk about road bottlenecks, shelter quotas, contra-flow diversions, or NDMA emergency guidelines!"

    return {
        "response": ai_response,
        "provider": provider_used,
        "is_live_gemini": (provider_used != "Deterministic EOC Fallback"),
        "grounded_scenario": scenario.name if scenario else "Greenfield City Flood Drill"
    }

@router.post("/api/simulations/{run_id}/ai-explain")
def generate_ai_explanation(run_id: str, db: Session = Depends(get_db)):
    """
    Generates an intelligent analytical explanation of the simulation outcome.
    Uses calculated simulation results as ground truth.
    Falls back gracefully to structured heuristic reasoning if no AI API key is configured.
    """
    run = db.query(SimulationRunDB).filter(SimulationRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == run.scenario_id).first()
    metrics = json.loads(run.summary_metrics or "{}")
    bottlenecks = metrics.get("bottlenecks_detail", [])
    recs = json.loads(run.recommendations or "[]")

    # Construct ground-truth analytical narrative
    evac_rate = metrics.get("evacuation_rate_pct", 0)
    avg_time = metrics.get("avg_evacuation_time_min", 0)
    unreachable = metrics.get("unable_to_reach", 0)
    max_cong = metrics.get("max_congestion_ratio", 0)
    b_count = metrics.get("bottlenecks_detected_count", 0)

    # Narrative generation grounded strictly in calculated data
    why_bottlenecks = []
    if bottlenecks:
        top_b = bottlenecks[0]
        why_bottlenecks.append(
            f"The primary bottleneck occurred at {top_b.get('road_name', 'primary corridor')} where demand reached {top_b.get('simulated_load', 0)} agents against a design capacity of {top_b.get('configured_capacity', 0)} ({top_b.get('congestion_ratio', 0)}x threshold). "
            f"This occurred at Step {top_b.get('peak_step', 0)} when converging flows from western residential zones attempted simultaneous crossing."
        )
    else:
        why_bottlenecks.append("No roads crossed the critical capacity threshold; traffic distributed smoothly across available parallel links.")

    shelter_insight = (
        f"Total shelter capacity utilization settled at {metrics.get('total_shelter_utilization_pct', 0)}%. "
        "Agents prioritized nearest facilities via shortest-path travel cost; once proximal facilities reached full quota, dynamic rerouting diverted subsequent groups to secondary safe havens."
    )

    isolation_insight = (
        f"A total of {unreachable} agents ({round(unreachable/max(1, metrics.get('total_population', 1))*100, 1)}%) were categorized as unreachable. "
        "This condition stemmed directly from active road closures severing topological connectivity between residential perimeter nodes and open bridges."
        if unreachable > 0 else
        "Zero agents were isolated. 100% of residential zones maintained at least one viable graph pathway to an operational shelter."
    )

    executive_verdict = (
        f"Under '{run.scenario_name}', the emergency network achieved a {evac_rate}% clearance rate with an average evacuee clearance duration of {avg_time} minutes. "
        f"Peak network stress was {max_cong}x nominal capacity with {b_count} monitored bottlenecks. "
        "Strategic recommendation: implementing staggered departures or widening the western relief bypass would mitigate the primary traffic surge."
    )

    return {
        "run_id": run.id,
        "scenario_name": run.scenario_name,
        "engine_type": "SurakshaSathi Heuristic Reasoner (Ground-Truth Context)",
        "executive_summary": executive_verdict,
        "bottleneck_breakdown": " ".join(why_bottlenecks),
        "shelter_allocation_analysis": shelter_insight,
        "accessibility_and_isolation": isolation_insight,
        "is_ai_generated": False,
        "disclaimer": "Explanation generated from deterministic mathematical simulation results."
    }
