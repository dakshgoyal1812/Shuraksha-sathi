# Project Memory: EvacuSafe (Suraksha)

## 1. Project Overview & Identity
- **Project Name:** EvacuSafe (Suraksha)
- **Primary Domain:** Intelligent Disaster Evacuation Planning & Simulation Platform
- **Simulated Environment:** Greenfield City (Synthetic 20-node, 32-edge urban road network with designated hazard zones, residential nodes, and 4 safe haven shelters)
- **Core Technology Stack:**
  - **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v3, Lucide React icons, Recharts (Area, Bar charts).
  - **Backend:** FastAPI (Python 3.10+), NetworkX (Dijkstra shortest-path & dynamic BPR delay congestion modeling), SQLAlchemy ORM, SQLite.
  - **Port Configuration:** Frontend runs on `http://localhost:5173/`, Backend on `http://localhost:8000/`.

---

## 2. Core User Directives & Constraints (Permanent Policy)
- **Design Aesthetic Mandate:** The entire visual presentation strictly adheres to the **ArthaSetu** UI design system (referenced from `https://arthasetu-mocha.vercel.app/stats`).
- **Feature Preservation Mandate:** The project's underlying domain logic, emergency evacuation calculations, NetworkX graph routing algorithms, scenario management, shelter capacities, and disaster modeling must **NEVER** be replaced or overwritten with unrelated gig-worker/financial features.
- **Visual Design Only:** All modifications preserve 100% of the EvacuSafe disaster simulation features while presenting them with the sleek, high-contrast, compact, and data-dense aesthetic of ArthaSetu.

---

## 3. ArthaSetu Design Token Registry

### Color Tokens
| Token | Hex Value | Role & Usage |
|---|---|---|
| `bg-primary` | `#F9FAFB` | Global page body background |
| `surface-card` | `#FFFFFF` | Card & panel background |
| `surface-muted` | `#F8FAFC` | Secondary container & table header background |
| `border-primary` | `#E1E7EF` | Standard card, divider, and panel borders |
| `text-primary` | `#0F172A` | Primary headings, titles, and high-emphasis numbers |
| `text-secondary` | `#475569` | Body text, table descriptions |
| `text-muted` | `#64748B` | Labels, captions, axes, and helper text |
| `badge-black` | `#000000` | Primary brand pill badges and primary action buttons |
| `accent-emerald` | `#10B981` | Safe/Evacuated status, operational badges (`#ECFDF5` bg) |
| `accent-amber` | `#F59E0B` | Congestion warning, moderate stress (`#FFFBEB` bg) |
| `accent-rose` | `#EF4444` | Blocked road, critical bottleneck, unreachable (`#FEF2F2` bg) |
| `accent-blue` | `#0284C7` | In-transit evacuees, secondary analytical curves |
| `grid-pattern` | `#E2E8F0` | Geometric background grid (20px x 30px) with elliptical radial mask (`.grid-wrapper` & `.grid-background`) |

### Layout & Sizing Tokens
- **Border Radius:** `rounded-2xl` (16px) for major cards, modals, and charts; `rounded-xl` (12px) for inputs and sub-cards; `rounded-lg` (8px) for buttons and status badges; `rounded-full` for chips and FAB.
- **Shadows:** `shadow-xs` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`) for standard cards; `shadow-xl` / `shadow-2xl` for floating action modals and dropdowns.
- **Typography:** Inter sans-serif; clean weights (400, 500, 600, 700); tabular numerals for metrics and timestamps.
- **Background Pattern:** `.grid-wrapper` + `.grid-background` providing a subtle modern geometric grid with a radial gradient mask.
- **Chatbot Component:** `SurakshaChatbot.tsx` (with backwards-compatible `ArthaSetuChatbot.tsx` alias) — persistent right-side floating action button (FAB) featuring the authentic Suraksha EOC Shield beacon and opening the interactive Suraksha Disaster Evacuation Operations AI Assistant with 24/7 incident command status, disaster quick chips (bottlenecks, shelters, NDMA guidelines, clearance rates, survival kits), message action toolbar, and live Gemini/ground-truth conversational replies.

---

## 4. Key Application Routes & Views
1. **`/` — [LandingPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/LandingPage.tsx):**
   - Clean hero banner, live interactive map preview, 4 core value proposition cards, and quick navigation triggers.
2. **`/dashboard` — [DashboardPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/DashboardPage.tsx):**
   - 6 ArthaSetu-styled KPI metric cards (Total Population, Evacuated, In-Transit, Clearance Rate, Bottlenecks, Shelter Utilization).
   - Real-time clearance progress curve (AreaChart) and shelter intake load bar.
   - Identified critical bottlenecks table with demand-to-capacity stress ratios.
   - Rule-based mitigation action recommendations and active scenario drill list.
3. **`/scenarios` — [ScenarioListPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/ScenarioListPage.tsx):**
   - Grid of saved disaster drills with severity tags, population sizes, shelter counts, and one-click "Run Simulation" or "Edit" buttons.
4. **`/scenarios/new` & `/scenarios/:id/edit` — [ScenarioBuilderPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/ScenarioBuilderPage.tsx):**
   - 5-step wizard with pill step indicators:
     1. Details & Disaster Type (Flood, Wildfire, Earthquake, Custom)
     2. Hazards & Road Closures (interactive map click toggles and road grid)
     3. Population Mobility Breakdown (Standard, Mobility-Limited, Vehicular)
     4. Safe Haven Shelter Capacities (bed limits and operational readiness)
     5. Review & One-Click Execution
5. **`/simulation/:id` — [SimulationWorkspacePage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/SimulationWorkspacePage.tsx):**
   - Mission control header with Play, Pause, Step, Reset, and Speed toggles (1x, 2x, 5x, 10x).
   - Greenfield City interactive map canvas with live agent movement dots, congestion heat overlays, and road status inspector.
   - Timeline scrub slider for precise temporal analysis.
   - Real-time status gauges, shelter occupancy progress bars, and event logging.
6. **`/shelters` — [ShelterManagementPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/ShelterManagementPage.tsx):**
   - Total bed capacity aggregate KPIs, interactive capacity sliders per shelter, online/offline toggles, and modal dialog to add new facilities.
7. **`/analytics/:id` — [AnalyticsPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/AnalyticsPage.tsx):**
   - 14 quantitative metrics grid (Clearance rate, average time, max congestion, recalculations, capacity shortages).
   - 4 Recharts panels: Evacuation clearance curve, shelter utilization comparison, road congestion ratio ranking, and travel time distribution.
   - Export buttons for CSV raw data and official PDF summaries.
8. **`/compare` — [ComparePage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/ComparePage.tsx):**
   - Multi-run empirical evaluation matrix with green badges for best-performing strategies and side-by-side comparative bar charts.
   - What-if branch generator button.
9. **`/reports` — [ReportsPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/ReportsPage.tsx):**
   - Formal municipal disaster audit report ready for print or export.
10. **`/settings` — [SettingsPage.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/pages/SettingsPage.tsx):**
    - Engine diagnostics (FastAPI, NetworkX, SQLite), congestion detection threshold sliders, deterministic random seed settings, and demo reset.
11. **Floating Action Button (FAB) — [QuickActionFAB.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/components/QuickActionFAB.tsx):**
    - Accessible from all application pages in the bottom-right corner; opens instant modal with one-click actions for new scenarios, shelter checks, and report downloads.

---

## 5. Development & Build Instructions

### Frontend
- Working directory: `c:\Users\Rishika\Suraksha\frontend`
- Install dependencies: `npm install`
- Start dev server: `npm run dev` (Runs on `http://localhost:5173/`)
- Typecheck & Production Build: `npm run build` (`tsc -b && vite build`)

### Backend
- Working directory: `c:\Users\Rishika\Suraksha\backend`
- Start FastAPI server: `uvicorn app.main:app --reload --port 8000`
- API documentation: `http://localhost:8000/docs`

---

## 6. Key Files & Architecture Map
- [frontend/src/App.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/App.tsx) — Main layout, routing, and global FAB placement.
- [frontend/src/index.css](file:///c:/Users/Rishika/Suraksha/frontend/src/index.css) — CSS variable definitions for ArthaSetu tokens and body backgrounds.
- [frontend/tailwind.config.js](file:///c:/Users/Rishika/Suraksha/frontend/tailwind.config.js) — Tailwind extensions for `arthasetu.*` color tokens, radius, and shadows.
- [frontend/src/components/Navbar.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/components/Navbar.tsx) — ArthaSetu topbar with environment pill and scenario selector.
- [frontend/src/components/Sidebar.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/components/Sidebar.tsx) — Clean navigation menu with active route pill badges.
- [frontend/src/components/MetricCard.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/components/MetricCard.tsx) — Standard KPI metric card with status badges.
- [frontend/src/components/GreenfieldMap.tsx](file:///c:/Users/Rishika/Suraksha/frontend/src/components/GreenfieldMap.tsx) — SVG/network graph visualization with floating frosted white controls.
- [ARTHASETU_UI_GUIDE.md](file:///c:/Users/Rishika/Suraksha/ARTHASETU_UI_GUIDE.md) — Comprehensive design token and component guide.
