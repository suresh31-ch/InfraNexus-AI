-- ==============================================================================
-- CivicSync AI: Municipal Public Works & Infrastructure Coordination Schema
-- Database: Supabase PostgreSQL (mekeppamqbiaxncmzykr.supabase.co)
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'citizen' check (role in ('citizen', 'dept_officer', 'city_admin')),
  requested_role text default 'citizen' check (requested_role in ('citizen', 'dept_officer', 'city_admin')),
  department text default 'Public Citizen' check (department in (
    'Highways & Road Infrastructure',
    'Water Supply & Sewage Board',
    'Electricity & Power Utilities',
    'Optical Fiber & Telecom',
    'City Municipal Corporation',
    'Public Citizen'
  )),
  designation text default 'Resident Citizen',
  phone text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_department on public.profiles(department);

-- Trigger to automatically populate public.profiles upon auth.users sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    requested_role,
    department,
    designation
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Civic Citizen'),
    coalesce(new.raw_user_meta_data->>'role', 'citizen'),
    coalesce(new.raw_user_meta_data->>'requested_role', 'citizen'),
    case 
      when coalesce(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'requested_role', 'citizen') = 'dept_officer' 
        then coalesce(new.raw_user_meta_data->>'department', 'Highways & Road Infrastructure')
      when coalesce(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'requested_role', 'citizen') = 'city_admin' 
        then 'City Municipal Corporation'
      else 'Public Citizen'
    end,
    case 
      when coalesce(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'requested_role', 'citizen') = 'dept_officer' 
        then 'Divisional Executive Engineer'
      when coalesce(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'requested_role', 'citizen') = 'city_admin' 
        then 'Municipal Zonal Commissioner'
      else 'Resident Citizen'
    end
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. PROJECTS (THE SEVEN MUNICIPAL INFRASTRUCTURE WORKS)
-- ------------------------------------------------------------------------------
create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  project_code text unique not null,
  title text not null,
  description text,
  department text not null check (department in (
    'Highways & Road Infrastructure',
    'Water Supply & Sewage Board',
    'Electricity & Power Utilities',
    'Optical Fiber & Telecom',
    'City Municipal Corporation'
  )),
  work_category text not null check (work_category in (
    'road_resurfacing',
    'drainage',
    'water_pipeline',
    'power_grid',
    'telecom_duct',
    'gas_pipeline'
  )),
  road_segment text not null,
  zone text not null,
  contractor text not null,
  estimated_budget numeric(14, 2) check (estimated_budget >= 0),
  planned_start_date date not null,
  planned_end_date date not null,
  actual_start_date date,
  actual_end_date date,
  status text not null check (status in ('planned', 'in_progress', 'delayed', 'completed', 'halted')),
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  latitude double precision not null,
  longitude double precision not null,
  work_zone_radius_meters integer not null default 150 check (work_zone_radius_meters > 0),
  is_demo_seed boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint valid_dates check (planned_end_date >= planned_start_date)
);

create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_dates on public.projects(planned_start_date, planned_end_date);
create index if not exists idx_projects_coords on public.projects(latitude, longitude);
create index if not exists idx_projects_road on public.projects(road_segment);
create index if not exists idx_projects_dept on public.projects(department);

-- Seed the 7 municipal projects
insert into public.projects (
  id, project_code, title, description, department, work_category, road_segment,
  zone, contractor, estimated_budget, planned_start_date, planned_end_date,
  status, progress_percentage, latitude, longitude, work_zone_radius_meters, is_demo_seed
)
values
(
  'proj_gst_resurfacing',
  'HW-2026-089',
  'GST Road Bitumen Resurfacing & Milling',
  'High-density asphalt resurfacing of the 4-lane arterial carriageway between Tambaram and Chromepet corridor to improve vehicular transit quality.',
  'Highways & Road Infrastructure',
  'road_resurfacing',
  'Grand Southern Trunk (GST) Road - Tambaram Corridor',
  'Zone 3 - Southern Metropolitan',
  'Apex Infra Highways Pvt Ltd',
  420.00,
  '2026-10-18',
  '2026-11-25',
  'planned',
  10,
  12.8420,
  80.1530,
  250,
  true
),
(
  'proj_gst_water_pipe',
  'WS-2026-114',
  'Potable Water Feeder Main Pipeline Replacement',
  'Deep mechanical trench excavation (2.4m depth) to replace leaking 600mm DI water feeder pipelines servicing urban wards.',
  'Water Supply & Sewage Board',
  'water_pipeline',
  'Grand Southern Trunk (GST) Road - Tambaram Corridor',
  'Zone 3 - Southern Metropolitan',
  'Cauvery Water Tech Works',
  285.50,
  '2026-10-25',
  '2026-12-10',
  'planned',
  0,
  12.8432,
  80.1542,
  200,
  true
),
(
  'proj_vk_drainage',
  'MC-2026-042',
  'Precast Stormwater Drain Canal Construction',
  'Construction of reinforced cement concrete box culvert storm drains along the northern shoulder of the link road to mitigate monsoon flooding.',
  'City Municipal Corporation',
  'drainage',
  'Vandalur-Kelambakkam Arterial Road',
  'Zone 5 - Suburban South',
  'Metro Drainage Solutions',
  195.00,
  '2026-11-01',
  '2026-12-20',
  'in_progress',
  35,
  12.8385,
  80.1565,
  300,
  true
),
(
  'proj_vk_power_grid',
  'EL-2026-203',
  'Underground 33kV High-Tension Power Cable Ducts',
  'Trenching and laying of armored high-voltage electrical distribution cables from local substation to industrial cyber park.',
  'Electricity & Power Utilities',
  'power_grid',
  'Vandalur-Kelambakkam Arterial Road',
  'Zone 5 - Suburban South',
  'Southern Power Grids Ltd',
  310.00,
  '2026-11-08',
  '2026-12-05',
  'planned',
  5,
  12.8368,
  80.1580,
  220,
  true
),
(
  'proj_kanchi_concrete',
  'HW-2026-031',
  'Kancheepuram Heritage Corridor Concrete Pavement',
  'Pavement replacement and heavy-duty white-topping around western temple gateway road to sustain pilgrim transport buses.',
  'Highways & Road Infrastructure',
  'road_resurfacing',
  'Kancheepuram Western Temple Ring Road',
  'Zone 1 - Heritage Core',
  'Pallava Civil Constructions',
  550.00,
  '2026-08-15',
  '2026-10-05',
  'delayed',
  62,
  12.8342,
  79.7036,
  350,
  true
),
(
  'proj_omr_telecom',
  'TL-2026-078',
  'High-Density Optical Fiber Micro-Trenching Network',
  'Installation of micro-duct telecom conduits beneath the service road curb for municipal broadband and CCTV smart monitoring.',
  'Optical Fiber & Telecom',
  'telecom_duct',
  'Old Mahabalipuram Road (OMR) Expressway',
  'Zone 4 - IT Express Corridor',
  'FiberLink Telecom Infrastructure',
  145.00,
  '2026-09-10',
  '2026-10-30',
  'in_progress',
  78,
  12.9150,
  80.2280,
  180,
  true
),
(
  'proj_anna_pedestrian',
  'MC-2026-155',
  'Universal Footpath & Rainwater Drainage Revitalization',
  'Pedestrian walkway widening, tactile paving for accessibility, and stormwater drop inlets along arterial avenue.',
  'City Municipal Corporation',
  'drainage',
  'Guindy - Anna Salai Link Avenue',
  'Zone 2 - Central Gateway',
  'Urban Habitat Engineering',
  175.00,
  '2026-11-15',
  '2026-12-30',
  'planned',
  0,
  13.0067,
  80.2025,
  160,
  true
)
on conflict (project_code) do update set
  title = excluded.title,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- 3. CITIZEN REPORTS
-- ------------------------------------------------------------------------------
create table if not exists public.citizen_reports (
  id text primary key default gen_random_uuid()::text,
  reference_no text unique not null,
  title text not null,
  description text not null,
  category text not null check (category in (
    'road_damage',
    'unsafe_excavation',
    'stalled_work',
    'drainage_issues',
    'repeated_excavation'
  )),
  latitude double precision not null,
  longitude double precision not null,
  landmark text not null,
  image_url text,
  reporter_name text not null,
  reporter_contact text,
  reporter_user_id uuid references public.profiles(id) on delete set null,
  status text not null check (status in ('submitted', 'verified', 'scheduled_for_work', 'resolved', 'dismissed')) default 'submitted',
  current_step integer default 1 check (current_step between 1 and 5),
  department_assigned text check (department_assigned in (
    'Highways & Road Infrastructure',
    'Water Supply & Sewage Board',
    'Electricity & Power Utilities',
    'Optical Fiber & Telecom',
    'City Municipal Corporation'
  )),
  internal_notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_reports_ref on public.citizen_reports(reference_no);
create index if not exists idx_reports_status on public.citizen_reports(status);
create index if not exists idx_reports_coords on public.citizen_reports(latitude, longitude);
create index if not exists idx_reports_user on public.citizen_reports(reporter_user_id);

-- Seed reports
insert into public.citizen_reports (
  id, reference_no, title, description, category, latitude, longitude,
  landmark, reporter_name, reporter_contact, status, current_step,
  department_assigned, internal_notes
)
values
(
  'rep-001',
  'CS-2026-7842',
  'Freshly resurfaced bitumen excavated for water line pit',
  'The carriageway near Tambaram Sanatorium was freshly paved last week, but backhoe excavators from the water department broke a 3.5m trench across the blacktop. Gravel scattered across lanes is causing severe two-wheeler skidding hazards.',
  'repeated_excavation',
  12.8428,
  80.1538,
  'GST Road near Tambaram Sanatorium Bus Stop',
  'Karthik Ramanathan',
  '+91 98401 23456',
  'scheduled_for_work',
  3,
  'Highways & Road Infrastructure',
  'Work order #WO-7842 dispatched to Highways Sub-division for immediate bitumen cold-patching and contractor back-charge.'
),
(
  'rep-002',
  'CS-2026-3104',
  'Deep unbarricaded trench left open without caution blinkers',
  'Underground electrical cable trench left open with no reflective barricades or caution flashers along the link road shoulder. Severe danger to evening commuters and school transport.',
  'unsafe_excavation',
  12.8375,
  80.1578,
  'Vandalur-Kelambakkam Road near Crescent Link Junction',
  'Ananya Sundaram',
  '+91 97910 88214',
  'scheduled_for_work',
  4,
  'Electricity & Power Utilities',
  'Field safety crew deployed. Strobe warning markers and heavy-duty steel plates installed over active trench.'
)
on conflict (reference_no) do nothing;

-- ------------------------------------------------------------------------------
-- 4. CONFLICTS & DECISIONS
-- ------------------------------------------------------------------------------
create table if not exists public.project_conflicts (
  id text primary key default gen_random_uuid()::text,
  project_a_id text not null references public.projects(id) on delete cascade,
  project_b_id text not null references public.projects(id) on delete cascade,
  road_segment text not null,
  conflict_category text not null,
  overlap_days integer not null check (overlap_days >= 0),
  distance_meters double precision not null check (distance_meters >= 0),
  severity text not null check (severity in ('critical', 'high', 'moderate', 'low')),
  conflict_reason text not null,
  status text not null check (status in ('pending_review', 'coordinated', 'resolved_sequenced', 'dismissed', 'override_concurrent')) default 'pending_review',
  dismissal_reason text,
  resolution_decision_id text,
  detected_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint unique_project_pair unique(project_a_id, project_b_id)
);

create table if not exists public.coordination_decisions (
  id text primary key default gen_random_uuid()::text,
  conflict_id text not null references public.project_conflicts(id) on delete cascade,
  decision_type text not null,
  justification text not null,
  approved_by uuid references public.profiles(id) on delete set null,
  agreed_start_date date,
  agreed_end_date date,
  ai_recommendation_accepted boolean default false,
  created_at timestamptz default now() not null
);

-- ------------------------------------------------------------------------------
-- 5. AUDIT LOGS
-- ------------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id text primary key default gen_random_uuid()::text,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null
);
