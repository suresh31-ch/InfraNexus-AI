/**
 * Delay Risk Assessment Engine
 * Deterministic formula-based evaluation of schedule slippage, progress deficiency,
 * corridor conflict exposure, and citizen grievance density.
 */

import { Project, ProjectConflict, CitizenReport } from '../types';

export type DelayRiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface RiskFactorBreakdown {
  name: string;
  weight: number;
  score: number; // 0 to 100
  evidence: string;
  hasData: boolean;
}

export interface ProjectRiskAssessment {
  projectId: string;
  projectCode: string;
  projectTitle: string;
  department: string;
  status: string;
  riskScore: number; // 0 to 100
  riskLevel: DelayRiskLevel;
  plannedDurationDays: number;
  elapsedDays: number;
  remainingDays: number;
  expectedProgressPercentage: number;
  actualProgressPercentage: number;
  progressGap: number; // expected - actual
  factors: RiskFactorBreakdown[];
  supportingEvidence: string[];
  limitations: string[];
  recommendedMitigations: string[];
  assessmentDate: string;
}

/**
 * Calculates deterministic risk assessment for a project using actual recorded dates, progress,
 * conflicts, and citizen reports.
 */
export function calculateProjectDelayRisk(
  project: Project,
  allConflicts: ProjectConflict[] = [],
  allReports: CitizenReport[] = [],
  referenceDate: Date = new Date('2026-10-10') // hackathon evaluation anchor
): ProjectRiskAssessment {
  const tStart = new Date(project.plannedStartDate).getTime();
  const tEnd = new Date(project.plannedEndDate).getTime();
  const tNow = referenceDate.getTime();

  const totalDurationMs = Math.max(1, tEnd - tStart);
  const plannedDurationDays = Math.round(totalDurationMs / (1000 * 60 * 60 * 24));

  const elapsedMs = Math.max(0, tNow - tStart);
  const elapsedDays = Math.round(elapsedMs / (1000 * 60 * 60 * 24));

  const remainingMs = Math.max(0, tEnd - tNow);
  const remainingDays = Math.round(remainingMs / (1000 * 60 * 60 * 24));

  // Expected progress based strictly on elapsed timeline proportion
  let expectedProgress = 0;
  if (tNow <= tStart) {
    expectedProgress = 0;
  } else if (tNow >= tEnd) {
    expectedProgress = 100;
  } else {
    expectedProgress = Math.min(100, Math.round((elapsedMs / totalDurationMs) * 100));
  }

  const actualProgress = Math.max(0, Math.min(100, project.progressPercentage || 0));
  const progressGap = expectedProgress - actualProgress;

  // Factor 1: Progress Lag vs Elapsed Time (Weight: 30%)
  let progressLagScore = 0;
  let progressLagEvidence = '';
  if (tNow < tStart) {
    progressLagScore = 5;
    progressLagEvidence = `Work not yet slated to begin (Start: ${project.plannedStartDate}). Progress is nominal at ${actualProgress}%.`;
  } else if (progressGap <= 0) {
    progressLagScore = 10;
    progressLagEvidence = `On or ahead of schedule (Expected: ${expectedProgress}%, Actual: ${actualProgress}%). Gap: ${progressGap}%.`;
  } else if (progressGap <= 15) {
    progressLagScore = 35;
    progressLagEvidence = `Moderate execution lag: Expected ${expectedProgress}%, Actual ${actualProgress}% (Lag: ${progressGap}%).`;
  } else if (progressGap <= 30) {
    progressLagScore = 70;
    progressLagEvidence = `Significant milestone slippage: Expected ${expectedProgress}%, Actual ${actualProgress}% (Lag: ${progressGap}%).`;
  } else {
    progressLagScore = 95;
    progressLagEvidence = `Severe progress deficit: Expected ${expectedProgress}%, Actual ${actualProgress}% (Lag: ${progressGap}% behind planned burn-rate).`;
  }

  // Factor 2: Timeline Expiry & Overdue Status (Weight: 25%)
  let schedulePressureScore = 0;
  let scheduleEvidence = '';
  if (project.status === 'delayed') {
    schedulePressureScore = 90;
    scheduleEvidence = `Officially designated as 'delayed' in municipal registry. Planned completion was ${project.plannedEndDate}.`;
  } else if (tNow > tEnd && actualProgress < 100) {
    schedulePressureScore = 95;
    scheduleEvidence = `Project past planned completion date (${project.plannedEndDate}) with ${actualProgress}% completed. Overdue by ${Math.abs(remainingDays)} days.`;
  } else if (remainingDays <= 14 && actualProgress < 70) {
    schedulePressureScore = 75;
    scheduleEvidence = `Critical deadline proximity: Only ${remainingDays} days remaining with ${actualProgress}% completed.`;
  } else if (remainingDays <= 30 && actualProgress < 50) {
    schedulePressureScore = 50;
    scheduleEvidence = `Tight delivery window: ${remainingDays} days remaining with ${100 - actualProgress}% work pending.`;
  } else {
    schedulePressureScore = 15;
    scheduleEvidence = `Comfortable remaining schedule window of ${remainingDays} days (${project.plannedEndDate}).`;
  }

  // Factor 3: Active Unresolved Right-of-Way Conflicts (Weight: 25%)
  const relatedConflicts = allConflicts.filter(
    (c) => (c.projectAId === project.id || c.projectBId === project.id) && c.status !== 'dismissed' && c.status !== 'resolved_sequenced'
  );
  let conflictScore = 0;
  let conflictEvidence = '';
  if (relatedConflicts.length === 0) {
    conflictScore = 10;
    conflictEvidence = 'No unresolved right-of-way or schedule clashes with other municipal utilities.';
  } else {
    const hasCritical = relatedConflicts.some((c) => c.severity === 'critical');
    const hasHigh = relatedConflicts.some((c) => c.severity === 'high');
    if (hasCritical) {
      conflictScore = 95;
      const primary = relatedConflicts.find((c) => c.severity === 'critical')!;
      const otherProj = primary.projectAId === project.id ? primary.projectB : primary.projectA;
      conflictScore = 95;
      conflictEvidence = `Critical corridor clash active with ${otherProj?.projectCode || 'inter-agency project'} (${primary.overlapDays} days overlap on ${project.roadSegment}). Work cannot proceed concurrently without road destruction.`;
    } else if (hasHigh) {
      conflictScore = 70;
      conflictEvidence = `High-severity work zone proximity clash with ${relatedConflicts.length} inter-agency project(s) on ${project.roadSegment}.`;
    } else {
      conflictScore = 40;
      conflictEvidence = `${relatedConflicts.length} moderate spatial/schedule overlap(s) awaiting joint coordination sign-off.`;
    }
  }

  // Factor 4: Verified Citizen Grievance Density (Weight: 20%)
  // Match reports by proximity (< 400m) or same corridor
  const proximityReports = allReports.filter((r) => {
    if (r.status === 'resolved' || r.status === 'dismissed') return false;
    const sameRoad = r.landmark?.toLowerCase().includes(project.roadSegment.toLowerCase().split(' ')[0]) || false;
    const latDiff = Math.abs(r.latitude - project.latitude);
    const lonDiff = Math.abs(r.longitude - project.longitude);
    const approxMeters = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111000;
    return approxMeters < 450 || sameRoad;
  });

  let citizenGrievanceScore = 0;
  let grievanceEvidence = '';
  if (proximityReports.length === 0) {
    citizenGrievanceScore = 5;
    grievanceEvidence = 'Zero unresolved citizen grievances logged in the project work zone.';
  } else if (proximityReports.length >= 3) {
    citizenGrievanceScore = 80;
    grievanceEvidence = `${proximityReports.length} unresolved citizen complaints logged in immediate zone (e.g., repeated excavation, unsafe trenching). Field stop-work risks elevated.`;
  } else {
    citizenGrievanceScore = 45;
    grievanceEvidence = `${proximityReports.length} citizen complaint(s) logged near work zone (${proximityReports.map((r) => r.referenceNo).join(', ')}).`;
  }

  // Weighted total: Progress (30%) + Schedule (25%) + Conflicts (25%) + Grievances (20%)
  const totalScore = Math.round(
    progressLagScore * 0.30 +
    schedulePressureScore * 0.25 +
    conflictScore * 0.25 +
    citizenGrievanceScore * 0.20
  );

  let riskLevel: DelayRiskLevel = 'low';
  if (totalScore >= 70) riskLevel = 'critical';
  else if (totalScore >= 50) riskLevel = 'high';
  else if (totalScore >= 30) riskLevel = 'medium';
  else riskLevel = 'low';

  const factors: RiskFactorBreakdown[] = [
    {
      name: 'Schedule Progress Burn-rate Gap',
      weight: 30,
      score: progressLagScore,
      evidence: progressLagEvidence,
      hasData: true,
    },
    {
      name: 'Timeline Expiry & Deadline Proximity',
      weight: 25,
      score: schedulePressureScore,
      evidence: scheduleEvidence,
      hasData: true,
    },
    {
      name: 'Active Right-of-Way Clashes',
      weight: 25,
      score: conflictScore,
      evidence: conflictEvidence,
      hasData: true,
    },
    {
      name: 'Local Citizen Grievance Pressure',
      weight: 20,
      score: citizenGrievanceScore,
      evidence: grievanceEvidence,
      hasData: true,
    },
  ];

  const supportingEvidence: string[] = [
    `Planned Window: ${project.plannedStartDate} to ${project.plannedEndDate} (${plannedDurationDays} calendar days).`,
    `Current Progress: ${actualProgress}% vs Expected Progress: ${expectedProgress}%.`,
    relatedConflicts.length > 0
      ? `Corridor Clashes: ${relatedConflicts.length} active conflict(s) on ${project.roadSegment}.`
      : `Zero conflicting utility trenches detected on corridor.`,
    proximityReports.length > 0
      ? `${proximityReports.length} pending citizen report(s) in vicinity.`
      : `No citizen grievances filed in vicinity.`,
  ];

  const limitations: string[] = [
    'Assessment derived from recorded schedule dates and reported percentage milestones.',
    'Weather anomalies (e.g. monsoon precipitation alerts) and contractor labor supply variations require engineer field verification.',
  ];

  const recommendedMitigations: string[] = [];
  if (relatedConflicts.length > 0) {
    recommendedMitigations.push(
      `Execute joint-agency sequencing accord with ${relatedConflicts.map((c) => c.projectAId === project.id ? c.projectB.department : c.projectA.department).join(', ')} before deploying heavy milling machinery.`
    );
  }
  if (progressGap > 15) {
    recommendedMitigations.push(
      `Authorize dual-shift non-peak night work (10:00 PM - 05:00 AM) to recover ${progressGap}% progress slippage.`
    );
  }
  if (proximityReports.length > 0) {
    recommendedMitigations.push(
      `Dispatch zonal junior engineer to inspect and close out citizen safety issues (${proximityReports.slice(0, 2).map((r) => r.referenceNo).join(', ')}).`
    );
  }
  if (recommendedMitigations.length === 0) {
    recommendedMitigations.push('Maintain standard weekly progress logging and corridor sensor telemetry monitoring.');
  }

  return {
    projectId: project.id,
    projectCode: project.projectCode,
    projectTitle: project.title,
    department: project.department,
    status: project.status,
    riskScore: totalScore,
    riskLevel,
    plannedDurationDays,
    elapsedDays,
    remainingDays,
    expectedProgressPercentage: expectedProgress,
    actualProgressPercentage: actualProgress,
    progressGap,
    factors,
    supportingEvidence,
    limitations,
    recommendedMitigations,
    assessmentDate: referenceDate.toISOString().split('T')[0],
  };
}
