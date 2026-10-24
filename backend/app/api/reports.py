import io
import csv
import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SimulationRunDB, ScenarioDB

# ReportLab imports for genuine PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

router = APIRouter(tags=["Reports"])

@router.get("/api/simulations/{run_id}/report")
def get_report_data(run_id: str, db: Session = Depends(get_db)):
    run = db.query(SimulationRunDB).filter(SimulationRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == run.scenario_id).first()
    metrics = json.loads(run.summary_metrics or "{}")
    recs = json.loads(run.recommendations or "[]")
    events = json.loads(run.timeline_events or "[]")

    return {
        "project": "SurakshaSathi — Intelligent Disaster Evacuation Planning Platform",
        "run_id": run.id,
        "scenario_id": run.scenario_id,
        "scenario_name": run.scenario_name,
        "description": scenario.description if scenario else "",
        "disaster_type": scenario.disaster_type if scenario else "Flood",
        "severity": scenario.severity if scenario else "High",
        "population_size": metrics.get("total_population", 600),
        "created_at": run.created_at.isoformat(),
        "metrics": metrics,
        "bottlenecks": metrics.get("bottlenecks_detail", []),
        "recommendations": recs,
        "timeline_events_count": len(events),
        "assumptions_and_limitations": [
            "All virtual agents represent synthetic population units moving through a mathematical graph network.",
            "Road capacities and congestion delays follow calibrated discrete-time BPR density-speed functions.",
            "Shelter capacities reflect municipal planning constraints and strictly prevent physical over-allocation unless overflow mode is engaged.",
            "This simulation serves strictly as an analytical decision-support tool and does not guarantee real-world evacuation survival rates."
        ]
    }

@router.get("/api/simulations/{run_id}/report.csv")
def download_csv_report(run_id: str, db: Session = Depends(get_db)):
    run = db.query(SimulationRunDB).filter(SimulationRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == run.scenario_id).first()
    metrics = json.loads(run.summary_metrics or "{}")
    bottlenecks = metrics.get("bottlenecks_detail", [])

    output = io.StringIO()
    writer = csv.writer(output)

    # Header section
    writer.writerow(["SURAKSHASATHI SIMULATION REPORT"])
    writer.writerow(["Project", "SurakshaSathi — Intelligent Disaster Evacuation Planning"])
    writer.writerow(["Scenario Name", run.scenario_name])
    writer.writerow(["Disaster Type", scenario.disaster_type if scenario else "Flood"])
    writer.writerow(["Severity Level", scenario.severity if scenario else "High"])
    writer.writerow(["Simulation Run ID", run.id])
    writer.writerow(["Timestamp", run.created_at.strftime("%Y-%m-%d %H:%M:%S UTC")])
    writer.writerow([])

    # Metrics section
    writer.writerow(["EXECUTIVE SUMMARY METRICS"])
    writer.writerow(["Metric", "Value", "Unit"])
    writer.writerow(["Total Simulated Population", metrics.get("total_population", 0), "Persons"])
    writer.writerow(["Successfully Evacuated", metrics.get("successfully_evacuated", 0), "Persons"])
    writer.writerow(["Evacuation Completion Rate", f"{metrics.get('evacuation_rate_pct', 0)}%", "Percentage"])
    writer.writerow(["Population Unable to Reach Shelter", metrics.get("unable_to_reach", 0), "Persons"])
    writer.writerow(["Average Evacuation Time", metrics.get("avg_evacuation_time_min", 0), "Minutes"])
    writer.writerow(["Total Simulation Duration", metrics.get("total_simulation_time_min", 0), "Minutes"])
    writer.writerow(["Max Congestion Ratio", metrics.get("max_congestion_ratio", 0), "Demand/Capacity Ratio"])
    writer.writerow(["Detected Bottlenecks Count", metrics.get("bottlenecks_detected_count", 0), "Roads"])
    writer.writerow(["Blocked Roads Count", metrics.get("blocked_roads_count", 0), "Roads"])
    writer.writerow(["Total Shelter Utilization", f"{metrics.get('total_shelter_utilization_pct', 0)}%", "Percentage"])
    writer.writerow([])

    # Bottlenecks section
    writer.writerow(["DETECTED BOTTLENECKS & CONGESTED CORRIDORS"])
    writer.writerow(["Road ID", "Road Name", "Category", "Simulated Load", "Capacity", "Congestion Ratio", "Average Delay (s)", "Peak Step", "Mitigation"])
    for b in bottlenecks:
        writer.writerow([
            b.get("road_id", ""),
            b.get("road_name", ""),
            b.get("category", ""),
            b.get("simulated_load", 0),
            b.get("configured_capacity", 0),
            b.get("congestion_ratio", 0.0),
            b.get("average_delay_seconds", 0.0),
            b.get("peak_step", 0),
            b.get("suggested_mitigation", "")
        ])

    import re
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', run.scenario_name)
    filename = f"SurakshaSathi_{safe_name}_{run.id[:8]}_Report.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/api/simulations/{run_id}/report.pdf")
def download_pdf_report(run_id: str, db: Session = Depends(get_db)):
    run = db.query(SimulationRunDB).filter(SimulationRunDB.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Simulation run not found.")

    scenario = db.query(ScenarioDB).filter(ScenarioDB.id == run.scenario_id).first()
    metrics = json.loads(run.summary_metrics or "{}")
    bottlenecks = metrics.get("bottlenecks_detail", [])
    recs = json.loads(run.recommendations or "[]")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#070D1E")
    )
    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569")
    )
    h2_style = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=14,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B")
    )

    story = []

    # Title & Header
    story.append(Paragraph("SURAKSHASATHI — DISASTER EVACUATION REPORT", title_style))
    story.append(Paragraph(f"Scenario: <b>{run.scenario_name}</b> | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    story.append(Spacer(1, 12))

    # Overview Info Table
    info_data = [
        ["Disaster Type", scenario.disaster_type if scenario else "Flood", "Severity Level", scenario.severity if scenario else "High"],
        ["Simulated Population", f"{metrics.get('total_population', 0):,} persons", "Evacuated Count", f"{metrics.get('successfully_evacuated', 0):,} persons"],
        ["Evacuation Rate", f"{metrics.get('evacuation_rate_pct', 0)}%", "Avg Clearance Time", f"{metrics.get('avg_evacuation_time_min', 0)} min"],
        ["Unreachable Population", f"{metrics.get('unable_to_reach', 0)} persons", "Max Congestion Ratio", f"{metrics.get('max_congestion_ratio', 0)}x capacity"]
    ]
    info_table = Table(info_data, colWidths=[120, 150, 130, 140])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    # Bottlenecks Table
    story.append(Paragraph("Critical Bottlenecks & Congested Corridors", h2_style))
    if bottlenecks:
        b_table_data = [["Road Segment", "Category", "Peak Load", "Capacity", "Congestion Ratio", "Delay"]]
        for b in bottlenecks[:6]:
            b_table_data.append([
                b.get("road_name", ""),
                b.get("category", ""),
                str(b.get("simulated_load", 0)),
                str(b.get("configured_capacity", 0)),
                f"{b.get('congestion_ratio', 0.0)}x",
                f"{b.get('average_delay_seconds', 0.0)}s"
            ])
        b_table = Table(b_table_data, colWidths=[170, 70, 70, 70, 80, 80])
        b_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0B1528")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(b_table)
    else:
        story.append(Paragraph("No critical bottlenecks exceeded defined safety thresholds.", body_style))

    story.append(Spacer(1, 14))

    # Recommendations
    story.append(Paragraph("Actionable Rule-Based Mitigation Recommendations", h2_style))
    for r in recs[:4]:
        story.append(Paragraph(f"• <b>[{r.get('severity', 'Info').upper()}] {r.get('title', '')}</b>: {r.get('problem', '')} <i>Action:</i> {r.get('suggested_action', '')}", body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 12))

    # Disclaimer & Assumptions
    story.append(Paragraph("Model Assumptions & Mandatory Planning Disclaimer", h2_style))
    disclaimer_text = (
        "<b>Notice:</b> SurakshaSathi is a software-based discrete-time simulation system designed for emergency planning and preparedness drills. "
        "All simulated populations, vehicle flows, and congestion metrics are derived from mathematical graph models and synthetic distributions. "
        "Actual disaster events involve human panic, real-time debris, and micro-behavior that this model abstracts. "
        "Results do not guarantee physical safety or life preservation and should supplement, never replace, certified civil protection procedures."
    )
    story.append(Paragraph(disclaimer_text, ParagraphStyle("Disc", parent=body_style, fontSize=7.5, leading=10, textColor=colors.HexColor("#64748B"))))

    doc.build(story)
    buffer.seek(0)
    import re
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', run.scenario_name)
    filename = f"SurakshaSathi_{safe_name}_{run.id[:8]}_Report.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
