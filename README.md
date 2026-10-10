InfraNexus AI

One Network. Zero Coordination Blind Spots.

AI-Powered Municipal Infrastructure Coordination Platform
Bits and Bytes 24-Hour Web Development Hackathon — IIITDM Kancheepuram
Track: CivicTech

About the Application

InfraNexus AI is an AI-powered civic technology platform designed to improve coordination between municipal departments working on roads, water supply, drainage, electricity, and telecommunications infrastructure.

When multiple departments independently schedule work on the same road, one agency may finish paving only for another to excavate the same corridor shortly afterward. This leads to repeated construction, wasted public expenditure, traffic disruption, and inconvenience for citizens.

InfraNexus AI addresses this challenge through a unified infrastructure registry, interactive geospatial mapping, deterministic scheduling conflict detection, AI-assisted coordination, citizen grievance tracking, and data-driven analytics.

The platform brings four perspectives into one connected system: citizens, infrastructure engineers, city administrators, and infrastructure analysts.

Four Role-Based Dashboards

1. Public Citizen Dashboard — Transparency and Grievance Tracking

Designed to help citizens understand nearby infrastructure activity and report local problems.

- Nearby Infrastructure Projects: Explore registered public works, project timelines, work locations, and available progress information.
- Interactive Infrastructure Map: View mapped projects, work zones, and reported issues where geographic data is available.
- Public Project Registry: Search and explore available infrastructure records.
- Citizen Grievance Reporting: Submit reports about damaged roads, unsafe excavations, and repeated digging, with optional photographs and location details where supported.
- My Reports & Tracking: Follow submitted complaints through their available status updates.
- Privacy-Aware Access: Public views are intended to exclude private citizen information and internal departmental notes.

Goal: Give citizens better visibility into infrastructure work and a clear way to report issues.

2. Highways Engineer Dashboard — Conflict Detection and Work Coordination

Designed for infrastructure engineers responsible for reviewing roadwork schedules and coordinating with utility departments.

- Assigned Infrastructure Projects: Review relevant road projects, progress, budgets, and execution schedules.
- Corridor Conflict Center: Identify potential clashes between road resurfacing and nearby water, drainage, electricity, or telecommunications projects.
- Spatial and Temporal Analysis: Evaluate geographic proximity and overlapping project dates using deterministic calculations.
- Schedule Management: Review project timelines and proposed adjustments where the workflow is supported.
- AI Coordination Assistant: Explore alternative work sequences, staggered schedules, potential joint-trenching opportunities, and traffic mitigation strategies.
- Citizen Grievance Triage: Review relevant public reports and support their routing to the appropriate workflow.

Goal: Help engineers identify potential conflicts earlier and make better-informed coordination decisions.

3. City Administrator Dashboard — City-Wide Oversight

Designed to provide administrators with a consolidated view of infrastructure activity across departments.

- Unified Project Registry: Review the overall portfolio of registered infrastructure projects.
- Capital Expenditure Overview: Examine recorded project budgets and aggregate financial summaries.
- Cross-Department Coordination: Review potential conflicts involving multiple infrastructure agencies.
- Project and Department Monitoring: Compare project status, progress, and available departmental indicators.
- AI Executive Brief: Generate concise summaries and coordination insights based on relevant available records.
- Data Export: Export supported project information for reporting and further analysis.
- Decision and Activity History: Inspect available coordination decisions and audit records.

Goal: Support informed oversight, interdepartmental coordination, and accountable infrastructure planning.

4. Infrastructure Analytics Dashboard — Data-Driven Insights

Designed to turn infrastructure records into understandable metrics and patterns.

- Conflict Analytics: Examine detected spatial and schedule conflicts.
- Project Distribution: Explore projects by department, category, and status.
- Budget Analysis: Review recorded project budgets and capital allocation summaries.
- Citizen Grievance Analytics: Examine report counts, statuses, and resolution indicators when the underlying data is available.
- Interactive Filters: Narrow results by relevant departments, categories, and project statuses.
- Record-Level Drill-Down: Inspect supporting records behind available charts and metrics.

Goal: Make infrastructure activity easier to evaluate using transparent, traceable data rather than unsupported claims.

AI-Powered Capabilities

AI Coordination Assistant

The Gemini-powered assistant helps users interpret infrastructure information and explore possible coordination strategies.

It can support tasks such as explaining detected conflicts, summarizing relevant project details, suggesting alternative schedules, and outlining possible mitigation measures.

Intelligent Project Question Answering

Users can ask questions about infrastructure projects and coordination issues in natural language. Project-specific answers should be grounded in retrieved records when available, while general questions can be handled separately.

Citizen Complaint Assistance

AI can help categorize citizen-submitted issues and organize their descriptions. Citizens should be able to review the information before submission where that workflow is implemented.

Deterministic Conflict Detection

Spatial proximity and date-overlap calculations are handled through explicit application logic. AI recommendations complement these calculations rather than replacing them.

Human-in-the-Loop Decisions

AI-generated recommendations are intended to assist decision-makers. Schedule changes and consequential coordination actions should require appropriate review and authorization.

Interactive Infrastructure Map

The mapping experience uses Leaflet and OpenStreetMap to present infrastructure projects geographically.

It is designed to help users:

- Explore work zones across different departments.
- Understand the geographic relationship between nearby projects.
- Visualize potential conflicts and reported issues.
- Investigate the relationship between project locations and execution schedules.

The accuracy of map-based analysis depends on the quality of the available project coordinates and work-zone information.

Technology Stack

- Frontend: React, TypeScript, Vite, and Tailwind CSS.
- Mapping: Leaflet and OpenStreetMap.
- Backend: Node.js and Express.
- AI: Google Gemini API.
- Database: Supabase and PostgreSQL.
- Analysis: Haversine distance calculations and date-overlap rules.
- Access Control: Database policies and role-based authorization where configured.

Example Demonstration Scenario

Consider a simulated road resurfacing project scheduled near a planned water pipeline replacement.

1. The conflict engine checks the projects' geographic separation and scheduled dates.
2. If the configured spatial and temporal rules are satisfied, the system flags a potential conflict.
3. The engineer opens the conflict details and reviews the supporting project information.
4. The AI Coordination Assistant proposes possible alternatives, such as changing the execution sequence or investigating joint trenching.
5. An authorized decision-maker reviews the recommendation before any supported schedule change is committed.
6. The administrator and analytics dashboards provide visibility into the relevant records and resulting changes.

This scenario demonstrates how deterministic analysis and AI-assisted planning can work together to support more coordinated public works.

Expected Impact

InfraNexus AI aims to help public agencies:

- Reduce avoidable repeat excavation through earlier conflict identification.
- Improve coordination between infrastructure departments.
- Make project information easier for citizens to discover.
- Provide more structured citizen issue reporting and tracking.
- Support transparent, data-informed planning decisions.
- Improve visibility into project schedules, budgets, and coordination activity.

Demonstration Data Disclosure

The project uses simulated municipal infrastructure data inspired by urban corridors around Kancheepuram, Tambaram, and Chennai. Sample project identifiers, schedules, budgets, conflicts, and grievance records are for demonstration purposes and do not represent verified government records.

Displayed metrics should be interpreted according to their underlying data and calculation rules. The platform is a hackathon prototype and is not an official municipal service.

---

InfraNexus AI — One Network. Zero Coordination Blind Spots.
