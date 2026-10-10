InfraNexus AI

One Network. Zero Coordination Blind Spots.

Live Demo: https://infra-nexus-ai.vercel.app/
GitHub Repository: https://github.com/suresh31-ch/InfraNexus-AI

1. Problem Statement

Municipal departments such as highways, water supply, drainage, and telecommunications often plan infrastructure projects independently. This can result in multiple departments working on the same road or location at different times without proper coordination.

For example, a road may be resurfaced and then excavated shortly afterward to install a water pipeline. This leads to repeated construction, wasted public funds, traffic congestion, project delays, and inconvenience for citizens.

The main challenge is the lack of a shared system that helps departments identify potential conflicts and coordinate their work before construction begins.

2. Our Solution

InfraNexus AI is an AI-assisted CivicTech platform that brings infrastructure project information into one shared interface.

It helps users explore projects on a map, identify potential location and schedule conflicts, review coordination suggestions, and monitor infrastructure-related information through role-based dashboards.

The goal is to encourage proactive planning, reduce avoidable rework, and improve coordination between municipal departments.

3. Dashboard Explanation

InfraNexus AI provides four role-based dashboards, each designed for a different type of user.

Dashboard 1: Public Citizen Dashboard

Purpose: Improve public visibility and make it easier for citizens to report infrastructure issues.

Key capabilities:

- Explore infrastructure projects and their reported status.
- View project locations on the map.
- Submit reports about road damage, excavation, and other infrastructure concerns.
- Help bring local issues to the attention of relevant teams.

Example: A citizen notices road damage near a construction site and submits a report for review.

Dashboard 2: Highways Engineer Dashboard

Purpose: Help engineering teams review roadwork and coordinate with other infrastructure departments.

Key capabilities:

- Review relevant roadwork and infrastructure projects.
- Identify potential overlaps between projects based on location and schedule.
- Examine conflict information to understand where coordination may be needed.
- Review AI-assisted suggestions for sequencing or coordinating work.

Example: A planned road resurfacing project overlaps with a proposed water pipeline installation. The engineer can review the potential conflict and consider coordinating the schedules before work begins.

Dashboard 3: City Admin Dashboard

Purpose: Provide city administrators with a broader view of infrastructure activity and coordination needs.

Key capabilities:

- Review infrastructure projects across departments.
- Monitor potential conflicts and project statuses.
- Identify projects that may require interdepartmental coordination.
- Support planning and prioritization using the information available in the platform.

Example: An administrator reviews overlapping projects and identifies which departments need to coordinate their work.

Dashboard 4: Infrastructure Analytics Dashboard

Purpose: Present infrastructure and coordination information in a format that supports planning and evaluation.

Key capabilities:

- Review project and conflict-related indicators.
- Understand patterns in reported infrastructure activity.
- Examine available coordination and resolution metrics.
- Support data-informed decisions about infrastructure planning.

Example: An administrator reviews available conflict indicators to identify areas where better coordination may be needed.

Note: Metrics based on demonstration data are illustrative and should not be interpreted as verified real-world savings or official municipal statistics.

4. Key Features

- Interactive Infrastructure Map: Explore project locations and identify areas where work may overlap.
- Spatial and Schedule Conflict Detection: Identify potential conflicts using project proximity and date overlap.
- AI Coordination Assistant: Generate coordination suggestions and explanations of potential conflicts using the configured AI service.
- Citizen Reporting: Provide a workflow for submitting infrastructure-related concerns.
- Department Coordination: Support project review and collaboration across departments.
- Analytics and Monitoring: Present available project and conflict indicators.
- Role-Based Dashboards: Organize information according to the needs of citizens, engineers, administrators, and analytics users.

Feature availability depends on the current implementation and configuration of the application.

5. Technology Stack

- Frontend: React, TypeScript, Vite
- Styling: Tailwind CSS
- Mapping: Leaflet, OpenStreetMap
- Backend: Node.js, Express
- Database: Supabase, PostgreSQL
- AI Integration: Google Gemini API

6. Setup Instructions

Prerequisites

- Node.js and npm
- Git

Step 1: Clone the Repository

git clone https://github.com/suresh31-ch/InfraNexus-AI.git
cd InfraNexus-AI

Step 2: Install Dependencies

npm install

Step 3: Configure the Application

Configure any required application settings according to the project configuration.

Step 4: Start the Development Server

If the project defines the standard Vite development script, run:

npm run dev

If the application requires a separate backend process, start it using the appropriate script configured in the project.

Step 5: Open the Application

Open the local URL displayed in your terminal to access the application.

7. Demonstration Scenario

Imagine a municipality has scheduled road resurfacing on a particular street. A water supply department separately plans to install a pipeline along the same route.

InfraNexus AI can help identify the possible spatial and scheduling conflict, make the relevant project information visible, and provide coordination suggestions so the departments can consider a better sequence of work.

This demonstrates how shared project information and early conflict detection can help prevent avoidable rework.

8. Expected Impact

InfraNexus AI aims to:

- Reduce unnecessary repeat excavation and roadwork.
- Improve communication between municipal departments.
- Identify potential conflicts earlier in project planning.
- Improve visibility into infrastructure activity.
- Provide a channel for citizen-reported issues.
- Support better infrastructure planning through shared information.

These are intended benefits, not measured outcomes unless validated against real-world data.

9. Demo Data Disclaimer

Demonstration projects may use simulated data associated with locations such as Kancheepuram, Tambaram, and Chennai. Unless independently verified, these records are not official government records and do not represent live municipal project information.

10. Hackathon Information

Developed for the Bits and Bytes 24-Hour Web Development Hackathon at IIITDM Kancheepuram.

InfraNexus AI — One Network. Zero Coordination Blind Spots.
