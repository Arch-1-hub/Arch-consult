-- Arch Consult - Sandbox monthly briefing emails
-- Run in the Supabase SQL Editor, after 012_sandbox_briefings.sql.

create table if not exists public.sandbox_email_optouts (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.sandbox_briefing_deliveries (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references public.sandbox_briefings(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (briefing_id, email)
);

alter table public.sandbox_email_optouts enable row level security;
alter table public.sandbox_briefing_deliveries enable row level security;
