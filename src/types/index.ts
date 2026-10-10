export type UserRole = 'citizen' | 'dept_officer' | 'city_admin';

export type Department =
  | 'Highways & Road Infrastructure'
  | 'Water Supply & Sewage Board'
  | 'Electricity & Power Utilities'
  | 'Optical Fiber & Telecom'
  | 'City Municipal Corporation';

export type WorkCategory =
  | 'road_resurfacing'
  | 'drainage'
  | 'water_pipeline'
  | 'power_grid'
  | 'telecom_duct'
  | 'gas_pipeline';

export type ProjectStatus = 'planned' | 'in_progress' | 'delayed' | 'completed' | 'halted';

export interface Project {
  id: string;
  projectCode: string;
  title: string;
  description: string;
  department: Department;
  workCategory: WorkCategory;
  roadSegment: string;
  zone: string;
  contractor: string;
  estimatedBudget: number; // in Lakhs or Crores or INR
  plannedStartDate: string; // YYYY-MM-DD
  plannedEndDate: string; // YYYY-MM-DD
  actualStartDate?: string;
  actualEndDate?: string;
  status: ProjectStatus;
  progressPercentage: number;
  latitude: number;
  longitude: number;
  workZoneRadiusMeters: number;
  isDemoSeed?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  updatedBy: string;
  updateType: 'status_change' | 'progress_milestone' | 'schedule_adjustment' | 'field_note';
  note: string;
  progressAfter?: number;
  isInternal: boolean;
  createdAt: string;
}

export type CitizenReportCategory =
  | 'road_damage'
  | 'unsafe_excavation'
  | 'stalled_work'
  | 'drainage_issues'
  | 'repeated_excavation';

export type CitizenReportStatus =
  | 'submitted'
  | 'verified'
  | 'scheduled_for_work'
  | 'resolved'
  | 'dismissed';

export interface CitizenReport {
  id: string;
  referenceNo: string;
  title: string;
  description: string;
  category: CitizenReportCategory;
  latitude: number;
  longitude: number;
  landmark: string;
  imageUrl?: string;
  reporterName: string;
  reporterContact?: string;
  reporterUserId?: string;
  status: CitizenReportStatus;
  currentStep?: number; // 1: Submitted, 2: Geotag Verified, 3: Assigned to Highways Sub-division, 4: Remediation in Progress, 5: Resolved
  departmentAssigned?: Department;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ConflictSeverity = 'critical' | 'high' | 'moderate' | 'low';
export type ConflictStatus = 'pending_review' | 'coordinated' | 'resolved_sequenced' | 'dismissed' | 'override_concurrent';

export interface ProjectConflict {
  id: string;
  projectAId: string;
  projectBId: string;
  projectA: Project;
  projectB: Project;
  roadSegment: string;
  conflictCategory: string;
  overlapDays: number;
  distanceMeters: number;
  severity: ConflictSeverity;
  conflictReason: string;
  status: ConflictStatus;
  dismissalReason?: string;
  resolutionDecisionId?: string;
  detectedAt: string;
  updatedAt: string;
}

export interface CoordinationDecision {
  id: string;
  conflictId: string;
  decisionType:
    | 'reschedule_project_b'
    | 'reschedule_project_a'
    | 'joint_trenching'
    | 'single_phase_execution'
    | 'dismissed_distinct_lanes';
  justification: string;
  approvedBy: string;
  agreedStartDate?: string;
  agreedEndDate?: string;
  aiRecommendationAccepted: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  department: Department | 'Public Citizen';
  designation?: string;
}
