import { Project, ProjectConflict, ConflictSeverity } from '../types';

/**
 * Calculates Haversine distance between two coordinates in meters
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Calculates overlap in days between two date spans
 */
export function calculateDateOverlapDays(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): { overlapDays: number; isOverlapping: boolean; overlapStart?: string; overlapEnd?: string } {
  const tStartA = new Date(startA).getTime();
  const tEndA = new Date(endA).getTime();
  const tStartB = new Date(startB).getTime();
  const tEndB = new Date(endB).getTime();

  const maxStart = Math.max(tStartA, tStartB);
  const minEnd = Math.min(tEndA, tEndB);

  if (maxStart <= minEnd) {
    const diffTime = minEnd - maxStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return {
      overlapDays: diffDays,
      isOverlapping: true,
      overlapStart: new Date(maxStart).toISOString().split('T')[0],
      overlapEnd: new Date(minEnd).toISOString().split('T')[0],
    };
  }

  return { overlapDays: 0, isOverlapping: false };
}

/**
 * Normalizes road segment name for corridor matching
 */
export function areSameCorridor(roadA: string, roadB: string): boolean {
  const cleanA = roadA.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanB = roadB.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
}

/**
 * Deterministic Conflict Detection Engine
 * Examines all project pairs and flags spatial + temporal collisions
 */
export function detectSchedulingConflicts(
  projects: Project[],
  existingConflicts: ProjectConflict[] = [],
  proximityThresholdMeters: number = 350
): ProjectConflict[] {
  const activeProjects = projects.filter((p) => p.status !== 'completed' && p.status !== 'halted');
  const detectedConflicts: ProjectConflict[] = [];

  // Map existing conflict resolutions/dismissals so user actions are preserved
  const existingMap = new Map<string, ProjectConflict>();
  existingConflicts.forEach((c) => {
    const key = [c.projectAId, c.projectBId].sort().join(':::');
    existingMap.set(key, c);
  });

  for (let i = 0; i < activeProjects.length; i++) {
    for (let j = i + 1; j < activeProjects.length; j++) {
      const projA = activeProjects[i];
      const projB = activeProjects[j];

      // Distance
      const distance = calculateHaversineDistanceMeters(
        projA.latitude,
        projA.longitude,
        projB.latitude,
        projB.longitude
      );

      // Same road name match
      const sameRoad = areSameCorridor(projA.roadSegment, projB.roadSegment);

      // If neither close nor same corridor, skip
      if (distance > proximityThresholdMeters && !sameRoad) {
        continue;
      }

      // Date overlap
      const dateOverlap = calculateDateOverlapDays(
        projA.plannedStartDate,
        projA.plannedEndDate,
        projB.plannedStartDate,
        projB.plannedEndDate
      );

      // Check proximity time window even if not direct overlap:
      // If road resurfacing happens shortly before excavation (within 45 days after paving)
      const tEndA = new Date(projA.plannedEndDate).getTime();
      const tStartB = new Date(projB.plannedStartDate).getTime();
      const tEndB = new Date(projB.plannedEndDate).getTime();
      const tStartA = new Date(projA.plannedStartDate).getTime();

      const daysAfterA = (tStartB - tEndA) / (1000 * 60 * 60 * 24);
      const daysAfterB = (tStartA - tEndB) / (1000 * 60 * 60 * 24);

      const isResurfacingA = projA.workCategory === 'road_resurfacing';
      const isResurfacingB = projB.workCategory === 'road_resurfacing';
      const isExcavationA = ['water_pipeline', 'drainage', 'telecom_duct', 'power_grid'].includes(projA.workCategory);
      const isExcavationB = ['water_pipeline', 'drainage', 'telecom_duct', 'power_grid'].includes(projB.workCategory);

      let isPavingPremature = false;
      let prematureDetail = '';

      if (isResurfacingA && isExcavationB && daysAfterA >= 0 && daysAfterA <= 45) {
        isPavingPremature = true;
        prematureDetail = `${projA.title} (Resurfacing) finishes just ${Math.round(daysAfterA)} days before ${projB.title} (${projB.workCategory.replace('_', ' ')}) begins trench excavation. Freshly paved blacktop will be ruined!`;
      } else if (isResurfacingB && isExcavationA && daysAfterB >= 0 && daysAfterB <= 45) {
        isPavingPremature = true;
        prematureDetail = `${projB.title} (Resurfacing) finishes just ${Math.round(daysAfterB)} days before ${projA.title} begins trench excavation. Freshly laid road surface will be excavated!`;
      }

      if (!dateOverlap.isOverlapping && !isPavingPremature) {
        continue;
      }

      // We have a confirmed conflict!
      let severity: ConflictSeverity = 'moderate';
      let categoryType = 'Spatial & Temporal Overlap';
      let reason = '';

      if (dateOverlap.isOverlapping) {
        if ((isResurfacingA && isExcavationB) || (isResurfacingB && isExcavationA)) {
          severity = 'critical';
          categoryType = 'Destructive Sequence (Paving vs Excavation)';
          reason = `Concurrent execution on ${projA.roadSegment}: Road Resurfacing and underground utility excavation planned during the exact same period (${dateOverlap.overlapDays} days overlap). Surface paving will be torn up by trench cutters.`;
        } else if (isExcavationA && isExcavationB) {
          severity = 'high';
          categoryType = 'Dual Utility Excavation Collision';
          reason = `Dual underground work zones within ${distance}m on ${projA.roadSegment} overlapping for ${dateOverlap.overlapDays} days (${dateOverlap.overlapStart} to ${dateOverlap.overlapEnd}). Risk of trench collapse, utility line strikes, and total road closure.`;
        } else if (distance < 100) {
          severity = 'high';
          categoryType = 'Severe Corridor Chokepoint';
          reason = `Both work zones are separated by only ${distance}m on ${projA.roadSegment} with ${dateOverlap.overlapDays} days concurrent disruption. Creates total traffic paralysis without coordinated diversions.`;
        } else {
          severity = dateOverlap.overlapDays > 14 ? 'high' : 'moderate';
          categoryType = 'Work Zone Proximity Collision';
          reason = `Both municipal projects occupy the ${projA.roadSegment} corridor (approx. ${distance}m apart) during overlapping work window (${dateOverlap.overlapDays} days).`;
        }
      } else if (isPavingPremature) {
        severity = 'critical';
        categoryType = 'Uncoordinated Sequence Hazard';
        reason = prematureDetail;
      }

      // Check if previously recorded
      const pairKey = [projA.id, projB.id].sort().join(':::');
      const existing = existingMap.get(pairKey);

      const conflictId = existing ? existing.id : `conf_${projA.id.slice(0, 6)}_${projB.id.slice(0, 6)}`;
      const status = existing ? existing.status : 'pending_review';
      const dismissalReason = existing ? existing.dismissalReason : undefined;
      const resolutionDecisionId = existing ? existing.resolutionDecisionId : undefined;

      detectedConflicts.push({
        id: conflictId,
        projectAId: projA.id,
        projectBId: projB.id,
        projectA: projA,
        projectB: projB,
        roadSegment: projA.roadSegment,
        conflictCategory: categoryType,
        overlapDays: dateOverlap.overlapDays,
        distanceMeters: distance,
        severity,
        conflictReason: reason,
        status,
        dismissalReason,
        resolutionDecisionId,
        detectedAt: existing?.detectedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Preserve previously resolved/dismissed conflicts even if dates have shifted out of collision window
  existingConflicts.forEach((ec) => {
    const isAlreadyIncluded = detectedConflicts.some((dc) => dc.id === ec.id);
    if (!isAlreadyIncluded && ['coordinated', 'resolved_sequenced', 'override_concurrent', 'dismissed'].includes(ec.status)) {
      const projA = projects.find((p) => p.id === ec.projectAId) || ec.projectA;
      const projB = projects.find((p) => p.id === ec.projectBId) || ec.projectB;
      detectedConflicts.push({
        ...ec,
        projectA: projA,
        projectB: projB,
        overlapDays: 0,
        conflictReason: ec.status === 'resolved_sequenced' 
          ? `Deconflicted: Sequence successfully realigned to prevent concurrent corridor disruption on ${ec.roadSegment}.`
          : ec.conflictReason,
      });
    }
  });

  // Sort critical first, then high, moderate, low, then resolved
  const severityWeight: Record<ConflictSeverity, number> = {
    critical: 4,
    high: 3,
    moderate: 2,
    low: 1,
  };

  return detectedConflicts.sort((a, b) => {
    if (a.status === 'pending_review' && b.status !== 'pending_review') return -1;
    if (b.status === 'pending_review' && a.status !== 'pending_review') return 1;
    return severityWeight[b.severity] - severityWeight[a.severity];
  });
}
