import { createClient } from '@supabase/supabase-js';
import { Project, CitizenReport, UserRole } from '../types';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://mekeppamqbiaxncmzykr.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_PCEbwI7GngpB91zFJa4aoA_kXt1Cqwm';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.includes('supabase.co') &&
  !supabaseUrl.includes('your-project-id')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

export interface SupabaseUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'dept_officer' | 'city_admin';
  requested_role?: 'citizen' | 'dept_officer' | 'city_admin';
  department: string;
  designation?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseHealthStatus {
  isConfigured: boolean;
  authConnected: boolean;
  tables: {
    profiles: boolean;
    projects: boolean;
    citizen_reports: boolean;
    project_conflicts: boolean;
    audit_logs: boolean;
  };
  projectCount: number;
  reportCount: number;
  lastChecked: string;
  message?: string;
}

/**
 * Check connectivity and existence of Supabase tables.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthStatus> {
  const result: SupabaseHealthStatus = {
    isConfigured: isSupabaseConfigured,
    authConnected: false,
    tables: {
      profiles: false,
      projects: false,
      citizen_reports: false,
      project_conflicts: false,
      audit_logs: false,
    },
    projectCount: 0,
    reportCount: 0,
    lastChecked: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    result.message = 'Supabase credentials not configured';
    return result;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    result.authConnected = true;

    // Check profiles table
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      result.tables.profiles = !error;
    } catch {
      result.tables.profiles = false;
    }

    // Check projects table
    try {
      const { data, error, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' });
      if (!error && data) {
        result.tables.projects = true;
        result.projectCount = data.length;
      }
    } catch {
      result.tables.projects = false;
    }

    // Check citizen_reports table
    try {
      const { data, error } = await supabase
        .from('citizen_reports')
        .select('*', { count: 'exact' });
      if (!error && data) {
        result.tables.citizen_reports = true;
        result.reportCount = data.length;
      }
    } catch {
      result.tables.citizen_reports = false;
    }

    // Check project_conflicts table
    try {
      const { error } = await supabase.from('project_conflicts').select('id').limit(1);
      result.tables.project_conflicts = !error;
    } catch {
      result.tables.project_conflicts = false;
    }

    // Check audit_logs table
    try {
      const { error } = await supabase.from('audit_logs').select('id').limit(1);
      result.tables.audit_logs = !error;
    } catch {
      result.tables.audit_logs = false;
    }

    if (!result.tables.projects) {
      result.message = 'Tables pending SQL migration in Supabase SQL editor';
    } else {
      result.message = 'All Supabase tables active and synchronized';
    }
  } catch (err: any) {
    result.message = err.message || 'Error checking Supabase';
  }

  return result;
}

/**
 * Fetch user profile from public.profiles with metadata fallback and local cache.
 */
export async function fetchSupabaseProfile(userId: string): Promise<SupabaseUserProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data && data.full_name) {
      // Cache the retrieved name
      try {
        localStorage.setItem(`civicsync_name_${userId}`, data.full_name);
        if (data.email) {
          localStorage.setItem(`civicsync_name_${data.email.toLowerCase()}`, data.full_name);
        }
      } catch {}
      return data as SupabaseUserProfile;
    }

    // Fallback: check currently authenticated user's metadata
    const { data: authUserData } = await supabase.auth.getUser();
    const authUser = authUserData?.user;

    const cachedName =
      (authUser?.id === userId ? authUser.user_metadata?.full_name : null) ||
      localStorage.getItem(`civicsync_name_${userId}`) ||
      (authUser?.email ? localStorage.getItem(`civicsync_name_${authUser.email.toLowerCase()}`) : null) ||
      localStorage.getItem('civicsync_registered_name') ||
      authUser?.email?.split('@')[0] ||
      'Verified User';

    const fallbackRole = (data?.role || authUser?.user_metadata?.requested_role || 'citizen') as 'citizen' | 'dept_officer' | 'city_admin';
    const fallbackDept = data?.department || (fallbackRole === 'dept_officer' ? 'Highways & Road Infrastructure' : fallbackRole === 'city_admin' ? 'City Municipal Corporation' : 'Public Citizen');

    const constructed: SupabaseUserProfile = {
      id: userId,
      email: data?.email || authUser?.email || '',
      full_name: cachedName,
      role: fallbackRole,
      department: fallbackDept,
      designation: data?.designation || (fallbackRole === 'citizen' ? 'Resident Civic Monitor' : fallbackRole === 'dept_officer' ? 'Divisional Engineer' : 'Municipal Administrator'),
    };

    // Auto-upsert into profiles table so future queries find it immediately
    try {
      await supabase.from('profiles').upsert({
        ...constructed,
        updated_at: new Date().toISOString(),
      });
    } catch {}

    return constructed;
  } catch {
    return null;
  }
}

/**
 * Inserts or updates user profile in public.profiles.
 */
export async function upsertSupabaseProfile(profile: Partial<SupabaseUserProfile> & { id: string }): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString(),
      });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Convert Supabase snake_case row to TypeScript Project interface
 */
export function mapRowToProject(row: any): Project {
  return {
    id: row.id,
    projectCode: row.project_code,
    title: row.title,
    description: row.description || '',
    department: row.department,
    workCategory: row.work_category,
    roadSegment: row.road_segment,
    zone: row.zone,
    contractor: row.contractor,
    estimatedBudget: Number(row.estimated_budget) || 0,
    plannedStartDate: row.planned_start_date,
    plannedEndDate: row.planned_end_date,
    actualStartDate: row.actual_start_date,
    actualEndDate: row.actual_end_date,
    status: row.status,
    progressPercentage: Number(row.progress_percentage) || 0,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    workZoneRadiusMeters: Number(row.work_zone_radius_meters) || 150,
    isDemoSeed: Boolean(row.is_demo_seed),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert TypeScript Project interface to Supabase snake_case row
 */
export function mapProjectToRow(proj: Project): any {
  return {
    id: proj.id,
    project_code: proj.projectCode,
    title: proj.title,
    description: proj.description,
    department: proj.department,
    work_category: proj.workCategory,
    road_segment: proj.roadSegment,
    zone: proj.zone,
    contractor: proj.contractor,
    estimated_budget: proj.estimatedBudget,
    planned_start_date: proj.plannedStartDate,
    planned_end_date: proj.plannedEndDate,
    status: proj.status,
    progress_percentage: proj.progressPercentage,
    latitude: proj.latitude,
    longitude: proj.longitude,
    work_zone_radius_meters: proj.workZoneRadiusMeters,
    is_demo_seed: Boolean(proj.isDemoSeed),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch projects from Supabase public.projects
 */
export async function fetchSupabaseProjects(): Promise<Project[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('planned_start_date', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map(mapRowToProject);
  } catch {
    return null;
  }
}

/**
 * Upsert project to Supabase
 */
export async function upsertSupabaseProject(proj: Project): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const row = mapProjectToRow(proj);
    const { error } = await supabase
      .from('projects')
      .upsert(row, { onConflict: 'project_code' });
    return !error;
  } catch {
    return false;
  }
}

/**
 * Convert Supabase snake_case row to TypeScript CitizenReport interface
 */
export function mapRowToReport(row: any): CitizenReport {
  return {
    id: row.id,
    referenceNo: row.reference_no,
    title: row.title,
    description: row.description,
    category: row.category,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    landmark: row.landmark,
    imageUrl: row.image_url || '',
    reporterName: row.reporter_name,
    reporterContact: row.reporter_contact || '',
    reporterUserId: row.reporter_user_id,
    status: row.status,
    currentStep: Number(row.current_step) || 1,
    departmentAssigned: row.department_assigned,
    internalNotes: row.internal_notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert TypeScript CitizenReport interface to Supabase snake_case row
 */
export function mapReportToRow(rep: CitizenReport): any {
  return {
    id: rep.id,
    reference_no: rep.referenceNo,
    title: rep.title,
    description: rep.description,
    category: rep.category,
    latitude: rep.latitude,
    longitude: rep.longitude,
    landmark: rep.landmark,
    image_url: rep.imageUrl || null,
    reporter_name: rep.reporterName,
    reporter_contact: rep.reporterContact || null,
    reporter_user_id: rep.reporterUserId || null,
    status: rep.status,
    current_step: rep.currentStep || 1,
    department_assigned: rep.departmentAssigned || null,
    internal_notes: rep.internalNotes || null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch citizen reports from Supabase public.citizen_reports
 */
export async function fetchSupabaseReports(userRole: UserRole, userId?: string): Promise<CitizenReport[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    let query = supabase.from('citizen_reports').select('*');

    // If citizen, filter to own reports if userId provided
    if (userRole === 'citizen' && userId) {
      query = query.eq('reporter_user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) {
      return null;
    }

    return data.map(mapRowToReport);
  } catch {
    return null;
  }
}

/**
 * Insert new citizen report to Supabase
 */
export async function insertSupabaseReport(rep: CitizenReport): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const row = mapReportToRow(rep);
    const { error } = await supabase.from('citizen_reports').insert(row);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Update report status in Supabase
 */
export async function updateSupabaseReportStatus(
  id: string,
  updates: {
    status?: CitizenReport['status'];
    internal_notes?: string;
    department_assigned?: string;
    current_step?: number;
  }
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('citizen_reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
