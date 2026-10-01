-- Arch Consult — Messaging (client <-> assigned consultant, admin sees all)
-- Run in Supabase SQL Editor (New query) AFTER 008_consultants.sql. Safe to re-run.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
    -- whose thread this is — every message belongs to one client's thread
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('client', 'consultant', 'admin')),
  body text not null check (char_length(body) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Who can READ a thread: the client themself, their assigned consultant,
-- or any admin.
drop policy if exists "Thread participants can read" on public.messages;
create policy "Thread participants can read"
  on public.messages for select
  using (
    auth.uid() = client_id
    or public.is_assigned_consultant(client_id)
    or public.is_admin()
  );

-- A client can only post into their OWN thread, as themself.
drop policy if exists "Clients can send in their own thread" on public.messages;
create policy "Clients can send in their own thread"
  on public.messages for insert
  with check (
    sender_id = auth.uid() and sender_role = 'client' and client_id = auth.uid()
  );

-- A consultant can only post into a thread for a client assigned to them.
drop policy if exists "Consultants can send to assigned clients" on public.messages;
create policy "Consultants can send to assigned clients"
  on public.messages for insert
  with check (
    sender_id = auth.uid() and sender_role = 'consultant'
    and public.is_assigned_consultant(client_id)
  );

-- An admin can post into any thread.
drop policy if exists "Admins can send in any thread" on public.messages;
create policy "Admins can send in any thread"
  on public.messages for insert
  with check (sender_id = auth.uid() and sender_role = 'admin' and public.is_admin());

create index if not exists messages_client_id_created_idx
  on public.messages(client_id, created_at);
