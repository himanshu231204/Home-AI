-- Phase 1 foundation schema.
-- Covers: users (via Supabase auth.users), projects, plots, house_requirements.
-- Geometry tables (designs, design_versions, floors, rooms, doors, windows,
-- stairs, balconies, generation_jobs, cost_estimates, ai_conversations,
-- ai_operations, subscriptions, payments, exports) are added in later
-- phases (Phase 3+) once the geometry engine and AI pipeline land — see
-- SPEC.md §43 for the full target schema.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);

create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- plots (SPEC.md §9)
-- ---------------------------------------------------------------------------
create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,

  width_mm integer not null check (width_mm > 0),
  length_mm integer not null check (length_mm > 0),

  road_side text not null
    check (road_side in ('NORTH', 'SOUTH', 'EAST', 'WEST', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST')),
  north_direction_degrees numeric not null default 0
    check (north_direction_degrees >= 0 and north_direction_degrees <= 360),

  location_country text not null default 'IN',
  location_state text,
  location_city text,
  postal_code text,

  plot_shape text not null default 'RECTANGLE' check (plot_shape in ('RECTANGLE')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id)
);

create index if not exists plots_project_id_idx on public.plots (project_id);

alter table public.plots enable row level security;

create policy "plots_select_own" on public.plots
  for select using (
    exists (select 1 from public.projects p where p.id = plots.project_id and p.user_id = auth.uid())
  );

create policy "plots_insert_own" on public.plots
  for insert with check (
    exists (select 1 from public.projects p where p.id = plots.project_id and p.user_id = auth.uid())
  );

create policy "plots_update_own" on public.plots
  for update using (
    exists (select 1 from public.projects p where p.id = plots.project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = plots.project_id and p.user_id = auth.uid())
  );

create policy "plots_delete_own" on public.plots
  for delete using (
    exists (select 1 from public.projects p where p.id = plots.project_id and p.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- house_requirements (SPEC.md §10)
-- ---------------------------------------------------------------------------
create table if not exists public.house_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,

  floors integer not null default 1 check (floors between 1 and 6),

  bedrooms integer not null default 0 check (bedrooms >= 0),
  bathrooms integer not null default 0 check (bathrooms >= 0),
  kitchens integer not null default 1 check (kitchens >= 0),

  parking_cars integer not null default 0 check (parking_cars >= 0),

  living_rooms integer not null default 1 check (living_rooms >= 0),
  dining_rooms integer not null default 1 check (dining_rooms >= 0),

  puja_room boolean not null default false,
  home_office boolean not null default false,
  balcony boolean not null default false,
  terrace boolean not null default false,
  utility_room boolean not null default false,
  store_room boolean not null default false,
  laundry_room boolean not null default false,

  vastu_enabled boolean not null default false,

  architectural_style text not null
    check (architectural_style in ('MODERN', 'CONTEMPORARY', 'TRADITIONAL', 'MINIMAL', 'LUXURY', 'INDIAN_MODERN')),

  budget_min numeric,
  budget_max numeric,
  currency text not null default 'INR',

  additional_requirements text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id)
);

create index if not exists house_requirements_project_id_idx on public.house_requirements (project_id);

alter table public.house_requirements enable row level security;

create policy "house_requirements_select_own" on public.house_requirements
  for select using (
    exists (select 1 from public.projects p where p.id = house_requirements.project_id and p.user_id = auth.uid())
  );

create policy "house_requirements_insert_own" on public.house_requirements
  for insert with check (
    exists (select 1 from public.projects p where p.id = house_requirements.project_id and p.user_id = auth.uid())
  );

create policy "house_requirements_update_own" on public.house_requirements
  for update using (
    exists (select 1 from public.projects p where p.id = house_requirements.project_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = house_requirements.project_id and p.user_id = auth.uid())
  );

create policy "house_requirements_delete_own" on public.house_requirements
  for delete using (
    exists (select 1 from public.projects p where p.id = house_requirements.project_id and p.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger plots_set_updated_at
  before update on public.plots
  for each row execute function public.set_updated_at();

create trigger house_requirements_set_updated_at
  before update on public.house_requirements
  for each row execute function public.set_updated_at();
