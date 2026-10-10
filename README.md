# InfraNexus AI

> **“One Network. Zero Coordination Blind Spots.”**  
> *Bits and Bytes 24-Hour Web Development Hackathon — IIITDM Kancheepuram*  
> *Category: AI-Powered Municipal Infrastructure Coordination*  
> *Track: CivicTech — Improving Transparency and Coordination in Public Works Projects*

---

## Overview

**InfraNexus AI** is an AI-powered municipal infrastructure coordination platform that helps public agencies detect overlapping roadworks, coordinate departments, reduce repeat excavation, and make public works more transparent for citizens. When one department paves a road only for another agency to excavate it weeks later, taxpayer capital is wasted, vehicular transit is paralyzed, and public trust deteriorates.

InfraNexus AI provides:
1. **Public Infrastructure Intelligence Dashboard**: Transparent tracking of capital municipal projects, progress milestones, and active work zones.
2. **Interactive Infrastructure Map**: Spatial mapping built with Leaflet and OpenStreetMap showing multi-agency work zones (Roads, Water, Drainage, Electricity, Telecom) and citizen report pins.
3. **Deterministic Scheduling Conflict Engine**: Mathematical spatial proximity (Haversine distance) and temporal date overlap calculations that detect road collisions, dual-trenching risks, and premature paving hazards.
4. **AI Coordination Assistant (Gemini API)**: Server-side intelligence synthesizing deconfliction plans, suggested staggered dates, joint trenching feasibility, traffic mitigation steps, and human-in-the-loop approval.
5. **Citizen Reporting & Tracking**: Direct problem submission for road damage, open unbarricaded ditches, and repeated excavation with unique tracking IDs (e.g. `CS-2026-7842`) and status updates.
6. **Department Workspace & Master Audit Logs**: Role-based action queues for municipal engineers, formal deconfliction accords, and immutable audit logs.
7. **Empirical Analytics**: Mathematically derived KPIs reflecting real database records without hallucinated claims.

---

## Tech Stack & Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Clean light interface, deep navy typography, restrained teal accents, zero-pill metadata discipline)
- **Mapping**: Leaflet + OpenStreetMap (custom vector divIcons with SVG pins, buffer radii circles, and conflict vectors)
- **Backend**: Express server (`server.ts`) hosting secure proxy routes for Gemini API and serving Vite in development
- **AI Integration**: `@google/genai` TypeScript SDK using `gemini-3.8-flash` on the server (never exposing keys to the browser)
- **Database & RLS**: Supabase PostgreSQL schema (`supabase/migrations/01_civicsync_schema.sql`) with Row Level Security, composite indexes, and local persistent data layer
- **Deployment**: Configured for Vercel and Node.js Cloud Run environments

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- npm

### 2. Environment Variables
Create a `.env` file in the root directory:

```bash
# Gemini API Key (accessed strictly on the server-side)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Optional: Supabase credentials for real cloud PostgreSQL persistence
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

PORT=3000
```

### 3. Installation & Development

```bash
# Install dependencies
npm install

# Start full-stack development server (Express + Vite on port 3000)
npm run dev

# Run build verification
npm run build
```

---

## Database Schema & Migrations

The full PostgreSQL migration file is located at:
`supabase/migrations/01_civicsync_schema.sql`

It provisions:
- `profiles`: User accounts, RBAC roles (`citizen`, `dept_officer`, `city_admin`), and municipal departments.
- `projects`: Municipal infrastructure works, coordinates, work zone radii, budgets, dates, and progress.
- `project_updates`: Audit log of progress milestones and field notes.
- `citizen_reports`: Public issue submissions with status lifecycle (`submitted` → `verified` → `scheduled_for_work` → `resolved`).
- `project_conflicts`: Deterministic spatial & temporal collision vectors with severity classifications.
- `coordination_decisions`: Formally signed inter-departmental scheduling accords.
- `audit_logs`: Immutable ledger of municipal operations.
- **Row Level Security (RLS)**: Enforces read access for citizens while restricting status transitions, conflict dismissals, and coordination decisions to authorized officers.

---

## Four Role-Based Dashboards

InfraNexus AI provides four distinct, tailored dashboard experiences using the same underlying unified registry:

1. **Dashboard 1: Public Citizen (`/overview` with Public Citizen persona)**
   - **Overview of Nearby Works**: Ward-level road closures, detours, and planned utility excavations.
   - **Interactive Map**: Live spatial boundaries and disruption radii along transit corridors.
   - **Public Project Registry**: Searchable index of public works, contractors, and timelines.
   - **Grievance Submission**: File geotagged issues with optional photo attachment, generating reference IDs (e.g. `CS-2026-7842`).
   - **"My Reports" 5-Stage Tracker**: Real-time progress updates (*Submitted* → *Geotag Verified* → *Sub-Division Assigned* → *Work Dispatched* → *Resolved*).
   - **Privacy Protection**: Never displays other citizens' phone numbers, emails, or internal staff notes.

2. **Dashboard 2: Highways Engineer (`/overview` with Highways Engineer persona)**
   - **Assigned Road Infrastructure**: State highways right-of-way contracts (`HW-2026-089`, `HW-2026-031`).
   - **Corridor Conflict Center**: Highlights detected clashes with water pipelines and power ducts on GST Road (32 days overlap, 186m separation).
   - **Schedule Update Workflow**: Adjust planned execution dates or record field progress milestones with engineering justifications.
   - **AI Staging Assistant Link**: One-click launch to review Gemini-powered sequence reversal mitigations.
   - **Citizen Grievance Triage**: Work order queue for road cold-patching and contractor back-charges.

3. **Dashboard 3: City Administrator (`/overview` with City Admin persona)**
   - **City-Wide Infrastructure Intelligence**: ₹2,080.5L total capital outlay across 7 registered projects.
   - **Cross-Department Coordination Center**: Inter-agency authority over Highways, MetroWater, TNEB, Municipal Corp, and Telecom.
   - **Department Administration**: Agency compliance benchmarks, active work allocations, and liaisons.
   - **AI Executive Brief**: Grounded summary synthesized from live database records.
   - **Exportable Reports**: One-click CSV and JSON exports for municipal audits.

4. **Dashboard 4: Infrastructure Analytics (`Analytics` tab or Hub D4)**
   - **4 Verified Core KPIs**:
     - *Excavation Clashes Averted*: 1 (detected via Haversine < 200m + Date Overlap).
     - *Capital Expenditure Protected*: ₹420.0 Lakhs (the value of the road surface spared from premature digging).
     - *Average Resolution Time*: 4.2 Hours.
     - *Citizen Grievance Resolution Rate*: 78% (7 total, 5 resolved, 2 in inspection).
   - **Interactive Scope Filters**: Department, Category, and Status.
   - **Record Drill-Down Inspector**: Click any chart or metric to view the actual underlying database records.

---

## 2–5 Minute Evaluation & Demo Walkthrough

1. **Step 1: Public Citizen Experience**
   - In the top *Hackathon Persona Switcher*, select **Public Citizen**.
   - Notice the top bar adapts: *+ Report Issue* appears instead of *+ New Project*.
   - Review *Active Road Closures* on GST Road and search the public projects registry.
   - Click *My Reports & Tracking* to observe the 5-step remediation tracker for `CS-2026-7842`.

2. **Step 2: Highways Engineer Experience**
   - Switch to **Highways Engineer** (*Er. R. Senthil Kumar*).
   - Observe the *Corridor Trenching Clash* alert on GST Road: Highways Bitumen Resurfacing (`HW-2026-089`) colliding with MetroWater Pipeline (`WS-2026-114`) by 32 days over a 186m stretch.
   - Open *Map Explorer* to see the amber marker and glowing red conflict boundary.

3. **Step 3: AI Assistant & Schedule Optimization**
   - Click *AI Assistant* in the top navigation.
   - Click **Run Gemini Schedule Optimization**: Watch Gemini synthesize the civil mitigation brief recommending sequence reversal.
   - Click **Authorize & Commit Re-sequencing to Master Registry**:
     - Automatically updates `HW-2026-089` dates to start December 15.
     - Decrements the pending conflict badge in the header from 2 to 1.
     - Logs a signed cryptographic entry in the Audit Trail.

4. **Step 4: City Administrator & Analytics Inspection**
   - Switch to **City Admin (IAS)** (*Dr. Meenakshi Sundaram, IAS*).
   - Review the city-wide capital outlay (₹2,080.5L) and department coordination scores.
   - Download the Master Registry CSV or JSON export.
   - Click *Analytics* (Dashboard 4) and click on **Excavation Clashes Averted** or **Project Distribution** to open the live **Record Drill-Down Inspector**!

---

## Demonstration Data Disclosure

All seeded projects in this demonstration represent **simulated municipal works** along the Kancheepuram, Tambaram, and Chennai urban transit corridors (e.g., GST Road, Vandalur-Kelambakkam link). They are designed for evaluating scheduling conflict algorithms and hackathon judging, and do not represent actual government records.
