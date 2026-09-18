-- Arch Consult — Saved reports schema
-- Run this in the Supabase SQL Editor, in addition to schema.sql and
-- 002_bookings.sql.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('health_check', 'launch_plan', 'ai_consultation')),
  title text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Reports require an account — there's no anonymous/guest save, unlike
-- bookings. A user can only ever see or create their own reports.
drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reports" on public.reports;
create policy "Users can delete own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);
