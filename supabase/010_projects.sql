-- Arch Consult — Client projects (status, progress, milestones)
-- Run in Supabase SQL Editor (New query) AFTER 009_messages.sql. Safe to re-run.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'planning'
    check (status in ('planning', 'in_progress', 'review', 'completed', 'on_hold')),
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  summary text,
  milestones jsonb not null default '[]'::jsonb,
    -- array of { "title": string, "done": boolean }
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Clients can read only their own projects.
drop policy if exists "Clients view their own projects" on public.projects;
create policy "Clients view their own projects"
  on public.projects for select
  using (auth.uid() = client_id);

-- Consultants can view and update projects for their assigned clients only.
drop policy if exists "Consultants view assigned projects" on public.projects;
create policy "Consultants view assigned projects"
  on public.projects for select
  using (public.is_assigned_consultant(client_id));

drop policy if exists "Consultants update assigned projects" on public.projects;
create policy "Consultants update assigned projects"
  on public.projects for update
  using (public.is_assigned_consultant(client_id))
  with check (public.is_assigned_consultant(client_id));

drop policy if exists "Consultants create projects for assigned clients" on public.projects;
create policy "Consultants create projects for assigned clients"
  on public.projects for insert
  with check (public.is_assigned_consultant(client_id) and created_by = auth.uid());

-- Admins can do everything.
drop policy if exists "Admins view all projects" on public.projects;
create policy "Admins view all projects"
  on public.projects for select
  using (public.is_admin());

drop policy if exists "Admins update all projects" on public.projects;
create policy "Admins update all projects"
  on public.projects for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins create projects" on public.projects;
create policy "Admins create projects"
  on public.projects for insert
  with check (public.is_admin() and created_by = auth.uid());

drop policy if exists "Admins delete projects" on public.projects;
create policy "Admins delete projects"
  on public.projects for delete
  using (public.is_admin());

create index if not exists projects_client_id_idx on public.projects(client_id);
