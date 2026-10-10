-- ==============================================================================
-- InfraNexus AI: Comprehensive Schema Migration v3
-- Add non-destructive enhancements for delay risk evidence, citizen report
-- AI metadata, coordination accords, and spatial coordinates.
-- ==============================================================================

-- 1. ENHANCE PROJECTS WITH GEOMETRIC & DELAY-RISK FIELDS
alter table if exists public.projects
  add column if not exists work_zone_radius_meters integer default 220,
  add column if not exists delay_risk_score integer default 0,
  add column if not exists delay_risk_level text default 'low',
  add column if not exists expected_progress_percentage integer default 0,
  add column if not exists last_risk_assessed_at timestamptz;

create index if not exists idx_projects_delay_risk on public.projects(delay_risk_level);
create index if not exists idx_projects_dates on public.projects(planned_start_date, planned_end_date);

-- 2. ENHANCE CITIZEN REPORTS WITH AI TRIAGE & STORAGE REFERENCES
alter table if exists public.citizen_reports
  add column if not exists ai_suggested_category text,
  add column if not exists ai_suggested_department text,
  add column if not exists ai_severity_rating text,
  add column if not exists ai_safety_concern text,
  add column if not exists image_storage_path text,
  add column if not exists linked_project_id text references public.projects(id) on delete set null;

create index if not exists idx_citizen_reports_linked_project on public.citizen_reports(linked_project_id);

-- 3. COORDINATION ACTIONS & HUMAN-APPROVED ACCORDS TABLE
create table if not exists public.coordination_actions (
  id text primary key default gen_random_uuid()::text,
  conflict_id text not null references public.project_conflicts(id) on delete cascade,
  action_type text not null check (action_type in (
    'sequence_shift',
    'joint_trenching',
    'lane_segregation',
    'night_work_authorization',
    'emergency_closure'
  )),
  status text not null default 'proposed' check (status in (
    'proposed',
    'approved',
    'in_progress',
    'completed',
    'rejected'
  )),
  proposed_by text not null,
  approved_by text,
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_coordination_actions_conflict on public.coordination_actions(conflict_id);
create index if not exists idx_coordination_actions_status on public.coordination_actions(status);

-- 4. RLS ON COORDINATION ACTIONS
alter table public.coordination_actions enable row level security;

drop policy if exists "Officers and Admins view coordination actions" on public.coordination_actions;
create policy "Officers and Admins view coordination actions" on public.coordination_actions
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );

drop policy if exists "Admins can approve and update coordination actions" on public.coordination_actions;
create policy "Admins can approve and update coordination actions" on public.coordination_actions
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('dept_officer', 'city_admin')
    )
  );
