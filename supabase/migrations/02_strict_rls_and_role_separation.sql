-- ==============================================================================
-- CivicSync AI: Strict Row Level Security (RLS) & Role Separation Migration
-- Database: Supabase PostgreSQL
-- Applied on: mekeppamqbiaxncmzykr.supabase.co
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY: PREVENT USER SELF-ESCALATION OF ROLES
-- ------------------------------------------------------------------------------
-- Regular users must NEVER be able to grant themselves 'dept_officer' or 'city_admin'
-- by executing an update on their own row in public.profiles.
create or replace function public.protect_profile_role()
returns trigger as $$
begin
  -- Check if caller is attempting to escalate role or reassign department
  if (old.role is distinct from new.role or old.department is distinct from new.department) then
    -- Only allow if the executing authenticated user already has 'city_admin' role
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'city_admin'
    ) then
      raise exception 'Security Violation (403): Role escalation forbidden. Only City Administrators can assign municipal officer clearance.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_protect_profile_role on public.profiles;
create trigger tr_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ------------------------------------------------------------------------------
-- 2. STRICT RLS: CITIZEN REPORTS DATA ISOLATION
-- ------------------------------------------------------------------------------
-- Public Citizens can ONLY view and manage their OWN reports.
-- Department Officers and City Administrators can view reports to triage and remediate.
alter table public.citizen_reports enable row level security;

drop policy if exists "Public can view reports" on public.citizen_reports;
drop policy if exists "Anyone can submit reports" on public.citizen_reports;
drop policy if exists "Officers can update report statuses" on public.citizen_reports;
drop policy if exists "Citizens view own reports, Officers view all" on public.citizen_reports;
drop policy if exists "Citizens can insert reports" on public.citizen_reports;
drop policy if exists "Citizens can update own pending reports" on public.citizen_reports;
drop policy if exists "Officers can update department reports" on public.citizen_reports;

-- SELECT Policy: Citizens see ONLY their own reports; Officers & Admins see all
create policy "Citizens view own reports, Officers view all" on public.citizen_reports
  for select using (
    reporter_user_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );

-- INSERT Policy: Citizens can submit issues with their own user id
create policy "Citizens can insert reports" on public.citizen_reports
  for insert with check (
    reporter_user_id = auth.uid() or reporter_user_id is null
  );

-- UPDATE Policy: Citizens can update only their own reports while still in 'submitted' state
create policy "Citizens can update own pending reports" on public.citizen_reports
  for update using (
    reporter_user_id = auth.uid() and status = 'submitted'
  );

-- UPDATE Policy: Officers can update reports assigned to their department; City Admins can update all
create policy "Officers can update department reports" on public.citizen_reports
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'city_admin'
        or (profiles.role = 'dept_officer' and citizen_reports.department_assigned = profiles.department)
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 3. STRICT RLS: PROJECTS & DEPARTMENTAL WORKS
-- ------------------------------------------------------------------------------
-- Public can view projects (transparency).
-- Officers can only insert/update projects belonging to their own department.
-- City Administrator has citywide modification rights.
alter table public.projects enable row level security;

drop policy if exists "Anyone can view projects" on public.projects;
drop policy if exists "Officers can insert projects" on public.projects;
drop policy if exists "Officers can update projects" on public.projects;
drop policy if exists "Public can view public projects" on public.projects;
drop policy if exists "Officers update department projects" on public.projects;
drop policy if exists "Officers insert department projects" on public.projects;

create policy "Public can view public projects" on public.projects
  for select using (true);

create policy "Officers update department projects" on public.projects
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'city_admin'
        or (profiles.role = 'dept_officer' and projects.department = profiles.department)
      )
    )
  );

create policy "Officers insert department projects" on public.projects
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and (
        profiles.role = 'city_admin'
        or (profiles.role = 'dept_officer' and projects.department = profiles.department)
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 4. STRICT RLS: CONFLICT MANAGEMENT & COORDINATION DECISIONS
-- ------------------------------------------------------------------------------
alter table public.project_conflicts enable row level security;
alter table public.coordination_decisions enable row level security;

drop policy if exists "Public can view conflicts" on public.project_conflicts;
drop policy if exists "Officers can manage conflicts" on public.project_conflicts;
drop policy if exists "Officers and Admins manage conflicts" on public.project_conflicts;

-- Citizens and public can view high-level conflict transparency notices
create policy "Public can view conflicts" on public.project_conflicts
  for select using (true);

-- Only authorized officers and administrators can coordinate conflicts
create policy "Officers and Admins manage conflicts" on public.project_conflicts
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );

-- Coordination decisions: Restricted strictly to Officers and Administrators
create policy "Officers and Admins can view decisions" on public.coordination_decisions
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );

create policy "Officers and Admins can insert decisions" on public.coordination_decisions
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );

-- ------------------------------------------------------------------------------
-- 5. STRICT RLS: AUDIT LOGS (IMMUTABILITY & PRIVACY)
-- ------------------------------------------------------------------------------
alter table public.audit_logs enable row level security;

drop policy if exists "Officers and Admins can view audit logs" on public.audit_logs;
drop policy if exists "System and officers insert audit logs" on public.audit_logs;

create policy "Officers and Admins can view audit logs" on public.audit_logs
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );

create policy "System and officers insert audit logs" on public.audit_logs
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );
