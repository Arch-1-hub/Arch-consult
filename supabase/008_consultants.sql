-- Arch Consult — Consultant role & client assignments
-- Run in Supabase SQL Editor (New query) AFTER 007_documents.sql. Safe to re-run.

-- 1. Allow a third role. Existing users are untouched — this only widens
--    what's allowed going forward.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('client', 'consultant', 'admin'));

-- 2. Which consultant is assigned to which client. One consultant per
--    client for now (client_id is unique) — simplest model to start from;
--    can be loosened later if a client ever needs a second consultant.
create table if not exists public.client_assignments (
  client_id uuid primary key references auth.users(id) on delete cascade,
  consultant_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now()
);

alter table public.client_assignments enable row level security;

-- Only admins manage assignments.
drop policy if exists "Admins manage assignments" on public.client_assignments;
create policy "Admins manage assignments"
  on public.client_assignments for all
  using (public.is_admin()) with check (public.is_admin());

-- A consultant can see their own assignment list (to know who their
-- clients are). A client can see who their own consultant is.
drop policy if exists "Consultants see their assignments" on public.client_assignments;
create policy "Consultants see their assignments"
  on public.client_assignments for select
  using (auth.uid() = consultant_id or auth.uid() = client_id);

-- 3. Helper: is the signed-in user the assigned consultant for this client?
create or replace function public.is_assigned_consultant(target_client_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.client_assignments
    where client_id = target_client_id and consultant_id = auth.uid()
  );
$$;

-- 4. Consultants get the SAME read/update access admins have on bookings
--    and documents, but scoped to only their assigned clients.
drop policy if exists "Consultants view assigned bookings" on public.bookings;
create policy "Consultants view assigned bookings"
  on public.bookings for select
  using (public.is_assigned_consultant(user_id));

drop policy if exists "Consultants update assigned bookings" on public.bookings;
create policy "Consultants update assigned bookings"
  on public.bookings for update
  using (public.is_assigned_consultant(user_id))
  with check (public.is_assigned_consultant(user_id));

drop policy if exists "Consultants view assigned documents" on public.documents;
create policy "Consultants view assigned documents"
  on public.documents for select
  using (public.is_assigned_consultant(owner_id));

-- Consultants can send documents to their own assigned clients only.
alter table public.documents drop constraint if exists documents_uploaded_by_role_check;
alter table public.documents add constraint documents_uploaded_by_role_check
  check (uploaded_by_role in ('client', 'consultant', 'admin'));

drop policy if exists "Consultants upload documents for their clients" on public.documents;
create policy "Consultants upload documents for their clients"
  on public.documents for insert
  with check (
    uploaded_by = auth.uid()
    and uploaded_by_role = 'consultant'
    and public.is_assigned_consultant(owner_id)
  );

-- Storage: consultants can read/write files under their assigned clients'
-- folders (in addition to their own, via the existing owner rule).
drop policy if exists "Consultants read assigned client files" on storage.objects;
create policy "Consultants read assigned client files"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and public.is_assigned_consultant((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Consultants upload to assigned client folders" on storage.objects;
create policy "Consultants upload to assigned client folders"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and public.is_assigned_consultant((storage.foldername(name))[1]::uuid)
  );
