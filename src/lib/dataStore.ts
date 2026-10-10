import { Project, CitizenReport, ProjectConflict, CoordinationDecision, AuditLog, UserProfile, UserRole } from '../types';
import { detectSchedulingConflicts } from './conflictEngine';
import {
  isSupabaseConfigured,
  fetchSupabaseProjects,
  upsertSupabaseProject,
  fetchSupabaseReports,
  insertSupabaseReport,
  updateSupabaseReportStatus,
} from './supabaseClient';

const STORAGE_KEYS = {
  PROJECTS: 'civicsync_projects_v1',
  REPORTS: 'civicsync_reports_v1',
  CONFLICTS: 'civicsync_conflicts_v1',
  DECISIONS: 'civicsync_decisions_v1',
  AUDIT: 'civicsync_audit_v1',
  USER_ROLE: 'civicsync_user_role_v1',
};

// Seed demonstration projects (Kancheepuram & Chennai Metropolitan Municipal Corridor)
export const INITIAL_DEMO_PROJECTS: Project[] = [
  {
    id: 'proj_gst_resurfacing',
    projectCode: 'HW-2026-089',
    title: 'GST Road Bitumen Resurfacing & Milling',
    description: 'High-density asphalt resurfacing of the 4-lane arterial carriageway between Tambaram and Chromepet corridor to improve vehicular transit quality.',
    department: 'Highways & Road Infrastructure',
    workCategory: 'road_resurfacing',
    roadSegment: 'Grand Southern Trunk (GST) Road - Tambaram Corridor',
    zone: 'Zone 3 - Southern Metropolitan',
    contractor: 'Apex Infra Highways Pvt Ltd',
    estimatedBudget: 420.0, // Lakhs
    plannedStartDate: '2026-10-18',
    plannedEndDate: '2026-11-25',
    status: 'planned',
    progressPercentage: 10,
    latitude: 12.8420,
    longitude: 80.1530,
    workZoneRadiusMeters: 250,
    isDemoSeed: true,
    createdAt: '2026-10-01T08:30:00Z',
    updatedAt: '2026-10-08T11:00:00Z',
  },
  {
    id: 'proj_gst_water_pipe',
    projectCode: 'WS-2026-114',
    title: 'Potable Water Feeder Main Pipeline Replacement',
    description: 'Deep mechanical trench excavation (2.4m depth) to replace leaking 600mm DI water feeder pipelines servicing urban wards.',
    department: 'Water Supply & Sewage Board',
    workCategory: 'water_pipeline',
    roadSegment: 'Grand Southern Trunk (GST) Road - Tambaram Corridor',
    zone: 'Zone 3 - Southern Metropolitan',
    contractor: 'Cauvery Water Tech Works',
    estimatedBudget: 285.5,
    plannedStartDate: '2026-10-25',
    plannedEndDate: '2026-12-10',
    status: 'planned',
    progressPercentage: 0,
    latitude: 12.8432,
    longitude: 80.1542,
    workZoneRadiusMeters: 200,
    isDemoSeed: true,
    createdAt: '2026-10-03T10:15:00Z',
    updatedAt: '2026-10-07T09:40:00Z',
  },
  {
    id: 'proj_vk_drainage',
    projectCode: 'MC-2026-042',
    title: 'Precast Stormwater Drain Canal Construction',
    description: 'Construction of reinforced cement concrete box culvert storm drains along the northern shoulder of the link road to mitigate monsoon flooding.',
    department: 'City Municipal Corporation',
    workCategory: 'drainage',
    roadSegment: 'Vandalur-Kelambakkam Arterial Road',
    zone: 'Zone 5 - Suburban South',
    contractor: 'Metro Drainage Solutions',
    estimatedBudget: 195.0,
    plannedStartDate: '2026-11-01',
    plannedEndDate: '2026-12-20',
    status: 'in_progress',
    progressPercentage: 35,
    latitude: 12.8385,
    longitude: 80.1565,
    workZoneRadiusMeters: 300,
    isDemoSeed: true,
    createdAt: '2026-09-20T07:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z',
  },
  {
    id: 'proj_vk_power_grid',
    projectCode: 'EL-2026-203',
    title: 'Underground 33kV High-Tension Power Cable Ducts',
    description: 'Trenching and laying of armored high-voltage electrical distribution cables from local substation to industrial cyber park.',
    department: 'Electricity & Power Utilities',
    workCategory: 'power_grid',
    roadSegment: 'Vandalur-Kelambakkam Arterial Road',
    zone: 'Zone 5 - Suburban South',
    contractor: 'Southern Power Grids Ltd',
    estimatedBudget: 310.0,
    plannedStartDate: '2026-11-08',
    plannedEndDate: '2026-12-05',
    status: 'planned',
    progressPercentage: 5,
    latitude: 12.8368,
    longitude: 80.1580,
    workZoneRadiusMeters: 220,
    isDemoSeed: true,
    createdAt: '2026-10-04T12:00:00Z',
    updatedAt: '2026-10-08T16:00:00Z',
  },
  {
    id: 'proj_kanchi_concrete',
    projectCode: 'HW-2026-031',
    title: 'Kancheepuram Heritage Corridor Concrete Pavement',
    description: 'Pavement replacement and heavy-duty white-topping around western temple gateway road to sustain pilgrim transport buses.',
    department: 'Highways & Road Infrastructure',
    workCategory: 'road_resurfacing',
    roadSegment: 'Kancheepuram Western Temple Ring Road',
    zone: 'Zone 1 - Heritage Core',
    contractor: 'Pallava Civil Constructions',
    estimatedBudget: 550.0,
    plannedStartDate: '2026-08-15',
    plannedEndDate: '2026-10-05',
    status: 'delayed',
    progressPercentage: 62,
    latitude: 12.8342,
    longitude: 79.7036,
    workZoneRadiusMeters: 350,
    isDemoSeed: true,
    createdAt: '2026-08-01T06:00:00Z',
    updatedAt: '2026-10-09T09:15:00Z',
  },
  {
    id: 'proj_omr_telecom',
    projectCode: 'TL-2026-078',
    title: 'High-Density Optical Fiber Micro-Trenching Network',
    description: 'Installation of micro-duct telecom conduits beneath the service road curb for municipal broadband and CCTV smart monitoring.',
    department: 'Optical Fiber & Telecom',
    workCategory: 'telecom_duct',
    roadSegment: 'Old Mahabalipuram Road (OMR) Expressway',
    zone: 'Zone 4 - IT Express Corridor',
    contractor: 'FiberLink Telecom Infrastructure',
    estimatedBudget: 145.0,
    plannedStartDate: '2026-09-10',
    plannedEndDate: '2026-10-30',
    status: 'in_progress',
    progressPercentage: 78,
    latitude: 12.9150,
    longitude: 80.2280,
    workZoneRadiusMeters: 180,
    isDemoSeed: true,
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-10-08T14:20:00Z',
  },
  {
    id: 'proj_anna_pedestrian',
    projectCode: 'MC-2026-155',
    title: 'Universal Footpath & Rainwater Drainage Revitalization',
    description: 'Pedestrian walkway widening, tactile paving for accessibility, and stormwater drop inlets along arterial avenue.',
    department: 'City Municipal Corporation',
    workCategory: 'drainage',
    roadSegment: 'Guindy - Anna Salai Link Avenue',
    zone: 'Zone 2 - Central Gateway',
    contractor: 'Urban Habitat Engineering',
    estimatedBudget: 175.0,
    plannedStartDate: '2026-11-15',
    plannedEndDate: '2026-12-30',
    status: 'planned',
    progressPercentage: 0,
    latitude: 13.0067,
    longitude: 80.2025,
    workZoneRadiusMeters: 160,
    isDemoSeed: true,
    createdAt: '2026-10-02T11:00:00Z',
    updatedAt: '2026-10-06T15:00:00Z',
  },
];

export const INITIAL_DEMO_REPORTS: CitizenReport[] = [
  {
    id: 'rep-001',
    referenceNo: 'CS-2026-7842',
    title: 'Freshly resurfaced bitumen excavated for water line pit',
    description: 'The carriageway near Tambaram Sanatorium was freshly paved last week, but backhoe excavators from the water department broke a 3.5m trench across the blacktop. Gravel scattered across lanes is causing severe two-wheeler skidding hazards.',
    category: 'repeated_excavation',
    latitude: 12.8428,
    longitude: 80.1538,
    landmark: 'GST Road near Tambaram Sanatorium Bus Stop',
    imageUrl: '',
    reporterName: 'Karthik Ramanathan',
    reporterContact: '+91 98401 23456',
    status: 'scheduled_for_work',
    currentStep: 3,
    departmentAssigned: 'Highways & Road Infrastructure',
    internalNotes: 'Work order #WO-7842 dispatched to Highways Sub-division for immediate bitumen cold-patching and contractor back-charge.',
    createdAt: '2026-10-07T08:15:00Z',
    updatedAt: '2026-10-08T10:00:00Z',
  },
  {
    id: 'rep-002',
    referenceNo: 'CS-2026-3104',
    title: 'Deep unbarricaded trench left open without caution blinkers',
    description: 'Underground electrical cable trench left open with no reflective barricades or caution flashers along the link road shoulder. Severe danger to evening commuters and school transport.',
    category: 'unsafe_excavation',
    latitude: 12.8375,
    longitude: 80.1578,
    landmark: 'Vandalur-Kelambakkam Road near Crescent Link Junction',
    imageUrl: '',
    reporterName: 'Ananya Sundaram',
    reporterContact: '+91 97910 88214',
    status: 'scheduled_for_work',
    currentStep: 4,
    departmentAssigned: 'Electricity & Power Utilities',
    internalNotes: 'Field safety crew deployed. Strobe warning markers and heavy-duty steel plates installed over active trench.',
    createdAt: '2026-10-08T14:30:00Z',
    updatedAt: '2026-10-09T07:45:00Z',
  },
  {
    id: 'rep-003',
    referenceNo: 'CS-2026-5591',
    title: 'Broken culvert causing severe waterlogging and pothole cluster',
    description: 'Collapsed roadside drainage slab leading to stagnant water pooling across two lanes, creating deep crater potholes that damage vehicle suspensions.',
    category: 'drainage_issues',
    latitude: 12.8440,
    longitude: 80.1520,
    landmark: 'GST Road service lane near Irumbuliyur Junction',
    imageUrl: '',
    reporterName: 'M. Selvam',
    reporterContact: '+91 94440 55123',
    status: 'verified',
    currentStep: 2,
    departmentAssigned: 'City Municipal Corporation',
    internalNotes: 'Geotag verified by Field Junior Engineer. Pre-cast RCC culvert replacement queued.',
    createdAt: '2026-10-09T06:10:00Z',
    updatedAt: '2026-10-09T06:10:00Z',
  },
  {
    id: 'rep-004',
    referenceNo: 'CS-2026-4109',
    title: 'Sunken utility manhole cover re-leveled on Chromepet flyover',
    description: 'Protruding telephone inspection chamber cover caused violent bumps for commuter buses descending towards Chromepet signal.',
    category: 'road_damage',
    latitude: 12.9510,
    longitude: 80.1415,
    landmark: 'Chromepet Flyover South Descent',
    imageUrl: '',
    reporterName: 'S. Balamurugan',
    reporterContact: '+91 98402 77190',
    status: 'resolved',
    currentStep: 5,
    departmentAssigned: 'Highways & Road Infrastructure',
    internalNotes: 'Cast-iron ring frame raised by 45mm and sealed with mastic asphalt. Inspection passed.',
    createdAt: '2026-09-28T09:20:00Z',
    updatedAt: '2026-10-02T16:30:00Z',
  },
  {
    id: 'rep-005',
    referenceNo: 'CS-2026-2287',
    title: 'Telecom trench gravel swept and cold-patched on OMR Service Road',
    description: 'Residual crushed blue metal gravel from fiber-optic micro-trenching left on cyclist lane near Thoraipakkam.',
    category: 'repeated_excavation',
    latitude: 12.9360,
    longitude: 80.2310,
    landmark: 'OMR Service Road near Thoraipakkam Toll Gate',
    imageUrl: '',
    reporterName: 'Divya Krishnan',
    reporterContact: '+91 98840 12099',
    status: 'resolved',
    currentStep: 5,
    departmentAssigned: 'Optical Fiber & Telecom',
    internalNotes: 'Contractor penalised and mandated to deploy vacuum sweeper. Surface restored.',
    createdAt: '2026-09-25T11:45:00Z',
    updatedAt: '2026-09-29T14:10:00Z',
  },
  {
    id: 'rep-006',
    referenceNo: 'CS-2026-6140',
    title: 'Uncovered electrical junction box shielded at Guindy link',
    description: 'Pedestrian pavement power junction box was left exposed following feeder cable testing.',
    category: 'unsafe_excavation',
    latitude: 13.0070,
    longitude: 80.2030,
    landmark: 'Guindy - Anna Salai Link Avenue',
    imageUrl: '',
    reporterName: 'R. Venkatesan',
    reporterContact: '+91 94441 88301',
    status: 'resolved',
    currentStep: 5,
    departmentAssigned: 'Electricity & Power Utilities',
    internalNotes: 'Reinforced polymer protective lockable shroud installed over circuit box.',
    createdAt: '2026-09-30T15:10:00Z',
    updatedAt: '2026-10-04T11:00:00Z',
  },
  {
    id: 'rep-007',
    referenceNo: 'CS-2026-8912',
    title: 'Drainage overflow desilted near Kelambakkam junction',
    description: 'Silt accumulation blocked side-drains causing road edge puddle formation during early pre-monsoon shower.',
    category: 'drainage_issues',
    latitude: 12.8390,
    longitude: 80.1560,
    landmark: 'Vandalur-Kelambakkam link junction',
    imageUrl: '',
    reporterName: 'M. Selvam',
    reporterContact: '+91 94440 55123',
    status: 'resolved',
    currentStep: 5,
    departmentAssigned: 'City Municipal Corporation',
    internalNotes: 'Suction tanker deployed. 120m culvert line fully cleared and flushed.',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-05T17:00:00Z',
  },
];

export const INITIAL_DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    actorName: 'InfraNexus Conflict Engine',
    actorRole: 'city_admin',
    action: 'SYSTEM_CONFLICT_DETECTED',
    entityType: 'project_conflicts',
    entityId: 'conf_proj_gst',
    details: {
      reason: 'Flagged Critical Overlap between GST Road Resurfacing and Water Pipeline Excavation (27 days overlap, 65m proximity).',
      severity: 'critical',
    },
    createdAt: '2026-10-04T10:15:00Z',
  },
  {
    id: 'log-002',
    actorName: 'Er. R. Senthil Kumar (Highways)',
    actorRole: 'dept_officer',
    action: 'STATUS_PROGRESS_UPDATE',
    entityType: 'projects',
    entityId: 'proj_gst_resurfacing',
    details: {
      previousProgress: 0,
      newProgress: 10,
      note: 'Initial sub-grade core sampling completed.',
    },
    createdAt: '2026-10-08T11:00:00Z',
  },
  {
    id: 'log-003',
    actorName: 'Dr. Meenakshi Sundaram (City Admin)',
    actorRole: 'city_admin',
    action: 'COORDINATION_REVIEW_INITIATED',
    entityType: 'project_conflicts',
    entityId: 'conf_proj_gst',
    details: {
      action: 'Triggered Gemini AI deconfliction analysis for GST road corridor.',
    },
    createdAt: '2026-10-08T16:45:00Z',
  },
];

// Profile data for mock roles
export const MOCK_USERS: Record<UserRole, UserProfile> = {
  citizen: {
    id: 'user_citizen_karthik',
    email: 'karthik.citizen@infranexus.gov.in',
    fullName: 'Karthik Ramanathan',
    role: 'citizen',
    department: 'Public Citizen',
    designation: 'Resident & Civic Monitor',
  },
  dept_officer: {
    id: 'user_officer_senthil',
    email: 'senthil.kumar@tnhighways.gov.in',
    fullName: 'Er. R. Senthil Kumar',
    role: 'dept_officer',
    department: 'Highways & Road Infrastructure',
    designation: 'Divisional Executive Engineer',
  },
  city_admin: {
    id: 'user_admin_meenakshi',
    email: 'admin.meenakshi@chennaicivic.gov.in',
    fullName: 'Dr. Meenakshi Sundaram, IAS',
    role: 'city_admin',
    department: 'City Municipal Corporation',
    designation: 'Municipal Zonal Commissioner',
  },
};

/**
 * Data Storage Management with LocalStorage persistence and in-memory cache
 */
class CivicSyncDataStore {
  private projects: Project[] = [];
  private reports: CitizenReport[] = [];
  private conflicts: ProjectConflict[] = [];
  private decisions: CoordinationDecision[] = [];
  private auditLogs: AuditLog[] = [];
  private currentRole: UserRole = 'dept_officer'; // default to officer so reviewers can explore right away
  private listeners: Set<() => void> = new Set();

  private isSupabaseLive: boolean = false;
  private lastSyncTimestamp: string | null = null;

  constructor() {
    this.init();
    // Non-blocking background sync with Supabase
    setTimeout(() => {
      this.syncWithSupabase();
    }, 100);
  }

  public async syncWithSupabase(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      // 1. Fetch remote projects
      const remoteProjects = await fetchSupabaseProjects();
      if (remoteProjects && remoteProjects.length > 0) {
        this.projects = remoteProjects;
        this.saveProjects();
        this.isSupabaseLive = true;
      }

      // 2. Fetch remote reports
      const currentUser = this.getCurrentUser();
      const remoteReports = await fetchSupabaseReports(this.currentRole, this.authenticatedUser?.id);
      if (remoteReports && remoteReports.length > 0) {
        // Merge or replace reports
        this.reports = remoteReports;
        this.saveReports();
        this.isSupabaseLive = true;
      }

      this.lastSyncTimestamp = new Date().toISOString();
      this.recalculateConflicts();
      this.notify();
      return true;
    } catch (err) {
      console.warn('Supabase sync note (using offline/demo store):', err);
      return false;
    }
  }

  public getSyncStatus(): { isLive: boolean; lastSync: string | null } {
    return {
      isLive: this.isSupabaseLive,
      lastSync: this.lastSyncTimestamp,
    };
  }

  private init() {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (storedProjects) {
        this.projects = JSON.parse(storedProjects);
        // Ensure coordinates match current Tambaram corridor
        const p1 = this.projects.find((p) => p.projectCode === 'HW-2026-089');
        if (p1 && p1.latitude > 12.9) {
          this.projects = [...INITIAL_DEMO_PROJECTS];
          this.saveProjects();
        }
      } else {
        this.projects = [...INITIAL_DEMO_PROJECTS];
        this.saveProjects();
      }

      const storedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (storedReports) {
        this.reports = JSON.parse(storedReports);
        if (!this.reports.some((r) => r.referenceNo.startsWith('CS-2026')) || this.reports.length < 7) {
          this.reports = [...INITIAL_DEMO_REPORTS];
          this.saveReports();
        }
      } else {
        this.reports = [...INITIAL_DEMO_REPORTS];
        this.saveReports();
      }

      const storedDecisions = localStorage.getItem(STORAGE_KEYS.DECISIONS);
      if (storedDecisions) {
        this.decisions = JSON.parse(storedDecisions);
      } else {
        this.decisions = [];
      }

      const storedAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
      if (storedAudit) {
        this.auditLogs = JSON.parse(storedAudit);
      } else {
        this.auditLogs = [...INITIAL_DEMO_AUDIT_LOGS];
        this.saveAudit();
      }

      const storedRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole | null;
      if (storedRole && ['citizen', 'dept_officer', 'city_admin'].includes(storedRole)) {
        this.currentRole = storedRole;
      }

      // Restore authenticated user profile if cached
      const storedAuthUser = localStorage.getItem('civicsync_authenticated_user');
      if (storedAuthUser) {
        try {
          const parsed = JSON.parse(storedAuthUser);
          if (parsed && parsed.fullName) {
            this.authenticatedUser = parsed;
            this.currentRole = parsed.role || this.currentRole;
          }
        } catch {}
      }

      // Recompute conflicts deterministically from projects
      this.recalculateConflicts();
    } catch (e) {
      console.warn('LocalStorage unavailable or parse error, using memory defaults', e);
      this.projects = [...INITIAL_DEMO_PROJECTS];
      this.reports = [...INITIAL_DEMO_REPORTS];
      this.auditLogs = [...INITIAL_DEMO_AUDIT_LOGS];
      this.recalculateConflicts();
    }
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public recalculateConflicts() {
    let existingConflicts: ProjectConflict[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CONFLICTS);
      if (raw) existingConflicts = JSON.parse(raw);
    } catch {}

    this.conflicts = detectSchedulingConflicts(this.projects, existingConflicts);
    this.saveConflicts();
    this.notify();
  }

  // --- Projects ---
  public getProjects(): Project[] {
    return [...this.projects];
  }

  public getProjectById(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  public addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const newProject: Project = {
      ...project,
      id: `proj_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.projects.unshift(newProject);
    this.saveProjects();

    this.logAudit(
      'PROJECT_CREATED',
      'projects',
      newProject.id,
      { title: newProject.title, code: newProject.projectCode, department: newProject.department }
    );

    this.recalculateConflicts();
    // Non-blocking sync to Supabase
    upsertSupabaseProject(newProject).catch((err) => console.warn('Supabase project sync note:', err));
    return newProject;
  }

  public updateProject(id: string, updates: Partial<Project>): Project | undefined {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    const old = this.projects[idx];
    const updated: Project = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.projects[idx] = updated;
    this.saveProjects();

    this.logAudit(
      'PROJECT_UPDATED',
      'projects',
      id,
      { updates, previousStatus: old.status, newStatus: updated.status }
    );

    this.recalculateConflicts();
    // Non-blocking sync to Supabase
    upsertSupabaseProject(updated).catch((err) => console.warn('Supabase project sync note:', err));
    return updated;
  }

  // --- Reports ---
  public getReports(): CitizenReport[] {
    return [...this.reports];
  }

  public getReportById(id: string): CitizenReport | undefined {
    return this.reports.find((r) => r.id === id);
  }

  public getReportByReference(refNo: string): CitizenReport | undefined {
    const cleanRef = refNo.trim().toUpperCase();
    return this.reports.find((r) => r.referenceNo.toUpperCase() === cleanRef);
  }

  public addReport(report: Omit<CitizenReport, 'id' | 'referenceNo' | 'status' | 'createdAt' | 'updatedAt'>): CitizenReport {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refNo = `CS-2026-${randomSuffix}`;

    const newReport: CitizenReport = {
      ...report,
      id: `rep_${Date.now()}`,
      referenceNo: refNo,
      status: 'submitted',
      currentStep: 1,
      reporterUserId: this.authenticatedUser?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.reports.unshift(newReport);
    this.saveReports();

    this.logAudit(
      'CITIZEN_REPORT_SUBMITTED',
      'citizen_reports',
      newReport.id,
      { referenceNo: newReport.referenceNo, title: newReport.title, category: newReport.category }
    );

    this.notify();
    // Non-blocking sync to Supabase
    insertSupabaseReport(newReport).catch((err) => console.warn('Supabase report sync note:', err));
    return newReport;
  }

  public updateReportStatus(
    id: string,
    status: CitizenReport['status'],
    internalNotes?: string,
    departmentAssigned?: CitizenReport['departmentAssigned'],
    currentStep?: number
  ): CitizenReport | undefined {
    const idx = this.reports.findIndex((r) => r.id === id);
    if (idx === -1) return undefined;

    const report = this.reports[idx];
    report.status = status;
    if (internalNotes !== undefined) report.internalNotes = internalNotes;
    if (departmentAssigned !== undefined) report.departmentAssigned = departmentAssigned;
    if (currentStep !== undefined) report.currentStep = currentStep;
    report.updatedAt = new Date().toISOString();

    this.saveReports();
    this.logAudit(
      'REPORT_STATUS_CHANGED',
      'citizen_reports',
      id,
      { referenceNo: report.referenceNo, newStatus: status, internalNotes }
    );

    this.notify();
    // Non-blocking sync to Supabase
    updateSupabaseReportStatus(id, {
      status,
      internal_notes: internalNotes,
      department_assigned: departmentAssigned,
      current_step: currentStep,
    }).catch((err) => console.warn('Supabase report status sync note:', err));
    return report;
  }

  // --- Conflicts & Coordination ---
  public getConflicts(): ProjectConflict[] {
    return [...this.conflicts];
  }

  public getConflictById(id: string): ProjectConflict | undefined {
    return this.conflicts.find((c) => c.id === id);
  }

  public dismissConflict(id: string, reason: string): boolean {
    const conflict = this.conflicts.find((c) => c.id === id);
    if (!conflict) return false;

    conflict.status = 'dismissed';
    conflict.dismissalReason = reason;
    conflict.updatedAt = new Date().toISOString();

    this.saveConflicts();
    this.logAudit(
      'CONFLICT_DISMISSED',
      'project_conflicts',
      id,
      { reason, projectA: conflict.projectA.title, projectB: conflict.projectB.title }
    );

    this.notify();
    return true;
  }

  public resolveConflictSequenced(
    conflictId: string,
    rationale: string,
    newStart: string = '2026-12-12',
    newEnd: string = '2027-01-18'
  ): boolean {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return false;

    // Shift project A (HW-2026-089) forward after Water Board testing concludes
    this.updateProject(conflict.projectA.id, {
      plannedStartDate: newStart,
      plannedEndDate: newEnd,
    });

    conflict.status = 'resolved_sequenced';
    conflict.overlapDays = 0;
    conflict.dismissalReason = rationale;
    conflict.updatedAt = new Date().toISOString();

    this.logAudit(
      'COORDINATION_SCHEDULE_REALIGNED',
      'project_conflicts',
      conflictId,
      {
        action: 'Sequence Reversal executed',
        rescheduledProject: conflict.projectA.title,
        newStartDate: newStart,
        newEndDate: newEnd,
        rationale,
      }
    );

    this.saveConflicts();
    this.saveProjects();
    this.recalculateConflicts();
    return true;
  }

  public resolveConflictOverride(conflictId: string, rationale: string): boolean {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return false;

    conflict.status = 'override_concurrent';
    conflict.dismissalReason = rationale;
    conflict.updatedAt = new Date().toISOString();

    this.logAudit(
      'JUSTIFIED_CONCURRENT_OVERRIDE',
      'project_conflicts',
      conflictId,
      {
        rationale,
        authorizedBy: this.getCurrentUser().fullName,
      }
    );

    this.saveConflicts();
    this.notify();
    return true;
  }

  public applyCoordinationDecision(
    conflictId: string,
    decision: {
      decisionType: CoordinationDecision['decisionType'];
      justification: string;
      agreedStartDate?: string;
      agreedEndDate?: string;
      aiRecommendationAccepted: boolean;
      shiftProjectB?: { id: string; newStart: string; newEnd: string };
      shiftProjectA?: { id: string; newStart: string; newEnd: string };
    }
  ): boolean {
    const conflict = this.conflicts.find((c) => c.id === conflictId);
    if (!conflict) return false;

    const newDecision: CoordinationDecision = {
      id: `dec_${Date.now()}`,
      conflictId,
      decisionType: decision.decisionType,
      justification: decision.justification,
      approvedBy: this.getCurrentUser().fullName,
      agreedStartDate: decision.agreedStartDate,
      agreedEndDate: decision.agreedEndDate,
      aiRecommendationAccepted: decision.aiRecommendationAccepted,
      createdAt: new Date().toISOString(),
    };

    this.decisions.unshift(newDecision);
    this.saveDecisions();

    // If dates shifted, update corresponding projects
    if (decision.shiftProjectB) {
      this.updateProject(decision.shiftProjectB.id, {
        plannedStartDate: decision.shiftProjectB.newStart,
        plannedEndDate: decision.shiftProjectB.newEnd,
      });
    }
    if (decision.shiftProjectA) {
      this.updateProject(decision.shiftProjectA.id, {
        plannedStartDate: decision.shiftProjectA.newStart,
        plannedEndDate: decision.shiftProjectA.newEnd,
      });
    }

    conflict.status = 'coordinated';
    conflict.resolutionDecisionId = newDecision.id;
    conflict.updatedAt = new Date().toISOString();
    this.saveConflicts();

    this.logAudit(
      'COORDINATION_DECISION_APPROVED',
      'project_conflicts',
      conflictId,
      {
        decisionType: decision.decisionType,
        justification: decision.justification,
        aiAccepted: decision.aiRecommendationAccepted,
      }
    );

    this.recalculateConflicts();
    return true;
  }

  public getDecisions(): CoordinationDecision[] {
    return [...this.decisions];
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  public logAudit(action: string, entityType: string, entityId: string, details: Record<string, any>) {
    const user = this.getCurrentUser();
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      actorName: user.fullName,
      actorRole: user.role,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.saveAudit();
  }

  // --- User & Role Management ---
  private authenticatedUser: UserProfile | null = null;

  public getAuthenticatedUser(): UserProfile | null {
    return this.authenticatedUser;
  }

  public setAuthenticatedUser(profile: UserProfile | null) {
    this.authenticatedUser = profile;
    if (profile) {
      this.currentRole = profile.role;
      try {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, profile.role);
        localStorage.setItem('civicsync_authenticated_user', JSON.stringify(profile));
        if (profile.fullName) {
          localStorage.setItem(`civicsync_name_${profile.id}`, profile.fullName);
          if (profile.email) {
            localStorage.setItem(`civicsync_name_${profile.email.toLowerCase()}`, profile.fullName);
          }
        }
      } catch {}
    } else {
      try {
        localStorage.removeItem('civicsync_authenticated_user');
      } catch {}
    }
    this.notify();
  }

  public updateAuthenticatedUserName(fullName: string) {
    const trimmed = fullName.trim();
    if (!trimmed) return;

    if (this.authenticatedUser) {
      this.authenticatedUser = {
        ...this.authenticatedUser,
        fullName: trimmed,
      };
      try {
        localStorage.setItem('civicsync_authenticated_user', JSON.stringify(this.authenticatedUser));
        localStorage.setItem(`civicsync_name_${this.authenticatedUser.id}`, trimmed);
        if (this.authenticatedUser.email) {
          localStorage.setItem(`civicsync_name_${this.authenticatedUser.email.toLowerCase()}`, trimmed);
        }
      } catch {}
      this.notify();
    }
  }

  public getCurrentRole(): UserRole {
    return this.currentRole;
  }

  public setRole(role: UserRole) {
    this.currentRole = role;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    } catch {}
    this.notify();
  }

  public getCurrentUser(): UserProfile {
    if (this.authenticatedUser && this.authenticatedUser.fullName) {
      return this.authenticatedUser;
    }
    // Check if cached in localStorage
    try {
      const stored = localStorage.getItem('civicsync_authenticated_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.fullName) {
          this.authenticatedUser = parsed;
          return parsed;
        }
      }
    } catch {}

    // Return a clean anonymous visitor profile if not signed in
    return {
      id: 'guest_citizen',
      email: '',
      fullName: 'Public Visitor',
      role: this.currentRole,
      department:
        this.currentRole === 'dept_officer'
          ? 'Highways & Road Infrastructure'
          : this.currentRole === 'city_admin'
          ? 'City Municipal Corporation'
          : 'Public Citizen',
      designation: 'Civic Observer',
    };
  }

  // --- Reset to Demonstration Defaults ---
  public resetToDemoDefaults() {
    this.projects = [...INITIAL_DEMO_PROJECTS];
    this.reports = [...INITIAL_DEMO_REPORTS];
    this.decisions = [];
    this.auditLogs = [...INITIAL_DEMO_AUDIT_LOGS];

    this.saveProjects();
    this.saveReports();
    this.saveDecisions();
    this.saveAudit();
    this.recalculateConflicts();
  }

  // Private storage sync
  private saveProjects() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(this.projects));
    } catch {}
  }
  private saveReports() {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(this.reports));
    } catch {}
  }
  private saveConflicts() {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFLICTS, JSON.stringify(this.conflicts));
    } catch {}
  }
  private saveDecisions() {
    try {
      localStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(this.decisions));
    } catch {}
  }
  private saveAudit() {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(this.auditLogs));
    } catch {}
  }
}

export const dataStore = new CivicSyncDataStore();
