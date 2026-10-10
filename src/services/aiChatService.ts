/**
 * Gemini-grounded query handler for municipal infrastructure
 * Gathers authentic project, conflict, and report state from dataStore and formats clean queries
 */

import { dataStore } from '../lib/dataStore';
import { calculateProjectDelayRisk } from './delayRiskEngine';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: Array<{
    type: 'project' | 'conflict' | 'report';
    id: string;
    code: string;
    title: string;
  }>;
  suggestedFollowUps?: string[];
  isHeuristicFallback?: boolean;
}

export async function askInfraNexusAi(
  userPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{
  text: string;
  sources?: Array<{ type: 'project' | 'conflict' | 'report'; id: string; code: string; title: string }>;
  suggestedFollowUps?: string[];
  isHeuristicFallback?: boolean;
}> {
  const projects = dataStore.getProjects();
  const conflicts = dataStore.getConflicts();
  const reports = dataStore.getReports();

  // Prepare verified context
  const contextSummary = {
    currentSystemDate: '2026-10-10',
    totalProjectsCount: projects.length,
    activeConflictsCount: conflicts.filter((c) => c.status !== 'dismissed').length,
    openCitizenReportsCount: reports.filter((r) => r.status !== 'resolved').length,
    projects: projects.map((p) => ({
      id: p.id,
      code: p.projectCode,
      title: p.title,
      department: p.department,
      roadSegment: p.roadSegment,
      plannedStartDate: p.plannedStartDate,
      plannedEndDate: p.plannedEndDate,
      progressPercentage: p.progressPercentage,
      status: p.status,
      budgetLakhs: p.estimatedBudget,
      contractor: p.contractor,
      coordinates: `${p.latitude}, ${p.longitude}`,
    })),
    conflicts: conflicts.map((c) => ({
      id: c.id,
      pair: `${c.projectA?.projectCode} (${c.projectA?.department}) vs ${c.projectB?.projectCode} (${c.projectB?.department})`,
      roadSegment: c.roadSegment,
      overlapDays: c.overlapDays,
      distanceMeters: c.distanceMeters,
      severity: c.severity,
      status: c.status,
      reason: c.conflictReason,
    })),
    recentReports: reports.slice(0, 5).map((r) => ({
      referenceNo: r.referenceNo,
      category: r.category,
      title: r.title,
      landmark: r.landmark,
      status: r.status,
      assignedTo: r.departmentAssigned,
    })),
  };

  try {
    const res = await fetch('/api/ai/ask-infranexus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: userPrompt,
        context: contextSummary,
        conversationHistory: history.slice(-6),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend /api/ai/ask-infranexus endpoint unreachable, using client-side grounded response:', err);
  }

  // Deterministic local grounded intelligence fallback
  return generateDeterministicGrounding(userPrompt, projects, conflicts, reports);
}

function generateDeterministicGrounding(
  prompt: string,
  projects: any[],
  conflicts: any[],
  reports: any[]
) {
  const pLower = prompt.toLowerCase();
  const sources: Array<{ type: 'project' | 'conflict' | 'report'; id: string; code: string; title: string }> = [];

  // Match: conflicts with water or pipeline
  if (pLower.includes('water') || pLower.includes('conflict') || pLower.includes('pipeline') || pLower.includes('overlap')) {
    const activeConflicts = conflicts.filter((c) => c.status !== 'dismissed');
    const waterConflict = activeConflicts.find((c) =>
      c.projectA?.department.includes('Water') || c.projectB?.department.includes('Water')
    );

    if (waterConflict) {
      sources.push({
        type: 'conflict',
        id: waterConflict.id,
        code: `${waterConflict.projectA?.projectCode} & ${waterConflict.projectB?.projectCode}`,
        title: waterConflict.roadSegment,
      });

      return {
        text: `**Active Water Pipeline Conflict Detected:**\n\nThere is a **${waterConflict.severity.toUpperCase()}** corridor clash on **${waterConflict.roadSegment}** between:\n- **${waterConflict.projectA?.projectCode}**: ${waterConflict.projectA?.title} (${waterConflict.projectA?.plannedStartDate} to ${waterConflict.projectA?.plannedEndDate})\n- **${waterConflict.projectB?.projectCode}**: ${waterConflict.projectB?.title} (${waterConflict.projectB?.plannedStartDate} to ${waterConflict.projectB?.plannedEndDate})\n\n**Overlap Evidence:** The projects share ${waterConflict.overlapDays} concurrent calendar days within ${waterConflict.distanceMeters}m right-of-way proximity.\n\n**Engineering Recommendation:** Water pipeline deep trenching (2.4m) must finish with verified soil backfill compaction *before* bitumen resurfacing begins to avoid tearing up freshly paved asphalt.`,
        sources,
        suggestedFollowUps: [
          'What is the recommended work sequence for GST Road?',
          'Which projects are at risk of delay?',
          'Show unresolved citizen complaints on this corridor',
        ],
        isHeuristicFallback: true,
      };
    }
  }

  // Match: delayed or delay risk
  if (pLower.includes('delay') || pLower.includes('risk') || pLower.includes('behind')) {
    const scored = projects.map((p) => calculateProjectDelayRisk(p, conflicts, reports));
    const highRisks = scored.filter((s) => s.riskLevel === 'critical' || s.riskLevel === 'high');

    highRisks.forEach((hr) => {
      sources.push({
        type: 'project',
        id: hr.projectId,
        code: hr.projectCode,
        title: hr.projectTitle,
      });
    });

    const listStr = highRisks
      .map(
        (hr) =>
          `• **${hr.projectCode} (${hr.projectTitle})** — **${hr.riskLevel.toUpperCase()} RISK (Score: ${hr.riskScore}/100)**\n  *Evidence:* ${hr.supportingEvidence[1]} | ${hr.supportingEvidence[2]}`
      )
      .join('\n\n');

    return {
      text: `**Deterministic Delay-Risk Analysis (Reference Date: 2026-10-10):**\n\nIdentified **${highRisks.length} project(s)** with elevated schedule slippage or corridor conflict risks:\n\n${listStr}\n\n*Heuristic Rubric:* Based on schedule burn-rate lag (30%), deadline expiry proximity (25%), active utility clashes (25%), and verified citizen grievance density (20%).`,
      sources,
      suggestedFollowUps: [
        'Why is HW-2026-031 classified as high risk?',
        'What should be completed before road resurfacing?',
        'Summarize unresolved infrastructure conflicts',
      ],
      isHeuristicFallback: true,
    };
  }

  // Match: citizen complaints
  if (pLower.includes('citizen') || pLower.includes('complaint') || pLower.includes('grievance') || pLower.includes('report')) {
    const openReports = reports.filter((r) => r.status !== 'resolved');
    openReports.slice(0, 3).forEach((r) => {
      sources.push({
        type: 'report',
        id: r.id,
        code: r.referenceNo,
        title: r.title,
      });
    });

    return {
      text: `**Citizen Grievance Status:**\n\nThere are **${openReports.length} unresolved citizen grievances** currently tracked across municipal corridors:\n\n${openReports
        .slice(0, 3)
        .map(
          (r) =>
            `• **${r.referenceNo}** (${r.category.replace('_', ' ')}): "${r.title}" at ${r.landmark}. Assigned to **${r.departmentAssigned || 'Triage'}**.`
        )
        .join('\n')}\n\nAll reports are linked to spatial coordinates for field verification by zonal junior engineers.`,
      sources,
      suggestedFollowUps: [
        'Which projects have unresolved citizen complaints?',
        'How can a citizen report repeated excavation?',
        'Which departments need to coordinate next?',
      ],
      isHeuristicFallback: true,
    };
  }

  // General fallback
  const firstP = projects[0];
  if (firstP) {
    sources.push({
      type: 'project',
      id: firstP.id,
      code: firstP.projectCode,
      title: firstP.title,
    });
  }

  return {
    text: `**InfraNexus AI Municipal Overview:**\n\nCurrently tracking **${projects.length} municipal projects**, **${conflicts.length} inter-agency right-of-way relationships**, and **${reports.length} citizen submissions** in the Chennai/Kancheepuram corridor.\n\nAll decisions are grounded in real database dates, spatial coordinates, and deterministic civil engineering rules. How can I assist with your coordination workflow?`,
    sources,
    suggestedFollowUps: [
      'Which road projects may conflict with water pipeline work next month?',
      'Which projects may be at risk of delay?',
      'Summarize unresolved infrastructure conflicts',
    ],
    isHeuristicFallback: true,
  };
}
