-- Arch Consult — Document exchange (client <-> admin)
-- Run in Supabase SQL Editor (New query) AFTER 005_admin.sql. Safe to re-run.

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  uploaded_by_role text not null check (uploaded_by_role in ('client', 'admin')),
  file_path text not null unique,
  file_name text not null,
  file_type text not null,
  file_size bigint not null check (file_size > 0 and file_size <= 15728640),
  note text,
  created_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "Owners can view their documents" on public.documents;
create policy "Owners can view their documents"
  on public.documents for select
  using (auth.uid() = owner_id);

drop policy if exists "Owners can upload their own documents" on public.documents;
create policy "Owners can upload their own documents"
  on public.documents for insert
  with check (auth.uid() = owner_id and auth.uid() = uploaded_by and uploaded_by_role = 'client');

drop policy if exists "Owners can delete their own uploads" on public.documents;
create policy "Owners can delete their own uploads"
  on public.documents for delete
  using (auth.uid() = owner_id and auth.uid() = uploaded_by);

drop policy if exists "Admins can view all documents" on public.documents;
create policy "Admins can view all documents"
  on public.documents for select
  using (public.is_admin());

drop policy if exists "Admins can upload documents for clients" on public.documents;
create policy "Admins can upload documents for clients"
  on public.documents for insert
  with check (public.is_admin() and uploaded_by = auth.uid() and uploaded_by_role = 'admin');

drop policy if exists "Admins can delete any document" on public.documents;
create policy "Admins can delete any document"
  on public.documents for delete
  using (public.is_admin());

create index if not exists documents_owner_id_idx on public.documents(owner_id);
create index if not exists documents_created_at_idx on public.documents(created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents', 'documents', false, 15728640,
  array['application/pdf','image/png','image/jpeg','application/zip','application/x-zip-compressed']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners can read their storage files" on storage.objects;
create policy "Owners can read their storage files"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

drop policy if exists "Owners can upload their storage files" on storage.objects;
create policy "Owners can upload their storage files"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );

drop policy if exists "Owners can delete their storage files" on storage.objects;
create policy "Owners can delete their storage files"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin())
  );
